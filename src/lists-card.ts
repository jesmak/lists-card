/**
 * lists-card: any list an entity holds, such as tasks, events or notices. Each list says where its items are and which
 * of their keys the card reads. One list is grouped by its items' dates (over, going on, to come), by one of their keys,
 * or not at all. Several lists are a group each. Held to a height, the header stays and the lists scroll under it.
 *
 * The card shows what its sources give and remembers nothing itself.
 */
import { LitElement, css, html, nothing } from "lit";
import type { CSSResultGroup, PropertyValues, TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";

import { CARD_VERSION } from "./const";
import "./editor";
import { ScrollFade, fadeStyles } from "./fade";
import type { HomeAssistant } from "./hass";
import { gridMinRows, heightCardSize, heightStyle, validHeight } from "./height";
import { arrange, dayOf, readItems, validList, zoneDay } from "./lists";
import { browserLanguage, translate } from "./localize/localize";
import { drawnScale, fillLimit, filledHeight, filledStyle, spareRoom, validRowStep } from "./rows";
import { HEADINGS, LAYOUTS, TEXT_MODES } from "./types";
import type { Arranged, Bucket, Group, Headings, Layout, ListConfig, ListsCardConfig, Placed, TextMode, When } from "./types";

interface CardRegistration {
    type: string;
    name: string;
    description: string;
    documentationURL?: string;
    preview?: boolean;
}

/** A list as the card shows it: its heading, and its items arranged, or none while its entity has no list to read. */
interface Shown {
    config: ListConfig;
    name: string;
    arranged?: Arranged;
}

/** The list's own room at its top, above which the spare room of a filled row goes. */
const LIST_TOP_PX = 4;
/**
 * A held card's least height: its header, a heading, and the tallest an item gets with its text cut to two lines, with
 * the card's border. Held, an item's title and label keep to one line each, so this is from the config alone, never the
 * data. Measured live from 180 px of card up: the header 44, a heading 24, and an item 85 in rows and 87 in the timeline,
 * where a badge with a year is the taller. A text shown whole has no limit, so a longer one scrolls.
 */
const HEADER_PX = 44;
const HEADING_PX = 24;
const ITEM_PX = 88;
const BORDER_PX = 2;
const LIST_BOTTOM_PX = 12;

const px = (value: string) => parseFloat(value) || 0;

/** The parts the card itself puts in its ha-card, one after another. */
const CARD_PARTS = [".hd", ".list"].map((part) => `:scope > ${part}`).join(", ");

/** An icon's name with its set, such as `mdi:home`. Anything else in an icon field is shown as text, such as an emoji. */
const ICON_NAME = /^[a-z0-9-]+:[a-z0-9-]+$/i;

/**
 * A part's height once the folds inside it have slid open or shut, so the card is on its rows as a slide begins. A shut
 * fold ends at nothing, an open one at its content's own height, which its clipped box doesn't have while it slides.
 * Every part between the list and a fold is a column of blocks with no gaps. Drawn sizes are divided by the card's
 * `scale`, as paddings and margins are in the layout's pixels.
 */
export function endHeight(part: HTMLElement, scale = 1, own = true): number {
    // A part with no fold inside is as tall as it is drawn. The list itself never is: it grows to whatever the card is given.
    if (own && !part.querySelector(".fold")) {
        return part.getBoundingClientRect().height / scale;
    }
    const style = getComputedStyle(part);
    // A timeline's item lays its parts side by side, so it is as tall as its tallest.
    const sideBySide = style.display === "flex" && !style.flexDirection.startsWith("column");
    let height = 0;
    for (const element of part.children) {
        const child = element as HTMLElement;
        const childStyle = getComputedStyle(child);
        if (childStyle.position === "absolute") {
            continue;
        }
        let own: number;
        if (child.classList.contains("fold")) {
            const content = child.firstElementChild?.firstElementChild as HTMLElement | null;
            own = child.classList.contains("open") && content ? endHeight(content, scale) : 0;
        } else {
            own = px(childStyle.marginTop) + endHeight(child, scale) + px(childStyle.marginBottom);
        }
        height = sideBySide ? Math.max(height, own) : height + own;
    }
    return height + px(style.paddingTop) + px(style.paddingBottom) + px(style.borderTopWidth) + px(style.borderBottomWidth);
}

export class ListsCard extends LitElement {
    @property({ attribute: false }) public hass?: HomeAssistant;
    /** "grid" in a sections view, where the card's rows are set in its layout tab. */
    @property({ attribute: false }) public layout?: string;
    @state() private config?: ListsCardConfig;
    /** The items opened by a tap, and the groups folded shut, by their keys. */
    @state() private opened = new Set<string>();
    @state() private shut = new Set<string>();
    /** The items whose text, cut to two lines, has more to show. */
    @state() private cut = new Set<string>();
    /** While a fold slides, the rows the card fills follow it. */
    @state() private sliding = false;
    @state() private filled = 0;
    @state() private spare = 0;

    private lists: Shown[] = [];
    private resizes?: ResizeObserver;
    private frame?: number;
    private slideTimer?: number;
    private dayTimer?: number;

    constructor() {
        super();
        // Fades the edges of the lists while the card is held to a height and they scroll.
        new ScrollFade(this, () => (this.heightStyle() ? this.renderRoot.querySelectorAll<HTMLElement>(".list") : []));
    }

    public static getConfigElement(): HTMLElement {
        return document.createElement("lists-card-editor");
    }

    /** The first entity with a list of objects in an attribute, with the key that looks most like a title. */
    public static getStubConfig(hass?: HomeAssistant): Record<string, unknown> {
        for (const entity of Object.values(hass?.states ?? {})) {
            for (const [attribute, value] of Object.entries(entity?.attributes ?? {})) {
                const first = Array.isArray(value) ? value[0] : undefined;
                if (!entity || first === null || typeof first !== "object") {
                    continue;
                }
                const title = ["title", "name", "summary"].find((key) => typeof first[key] === "string");
                if (title) {
                    const list: ListConfig = { entity: entity.entity_id, attribute };
                    return { lists: [title === "title" ? list : { ...list, fields: { title } }] };
                }
            }
        }
        return { lists: [] };
    }

    public setConfig(config: ListsCardConfig): void {
        const invalid = (key: string) => new Error(translate(browserLanguage(), `common.${key}`));
        if (!config || !Array.isArray(config.lists) || !config.lists.every(validList)) {
            throw invalid("invalid_configuration");
        }
        if (config.layout != null && !LAYOUTS.includes(config.layout)) {
            throw invalid("invalid_layout");
        }
        if (config.text != null && !TEXT_MODES.includes(config.text)) {
            throw invalid("invalid_text");
        }
        if (config.headings != null && !HEADINGS.includes(config.headings)) {
            throw invalid("invalid_headings");
        }
        if (!validHeight(config)) {
            throw invalid("invalid_height");
        }
        if (!validRowStep(config)) {
            throw invalid("invalid_row_step");
        }
        this.config = config;
    }

    public getCardSize(): number {
        const items = this.lists.reduce((sum, list) => sum + (list.arranged?.groups.reduce((n, g) => n + g.items.length, 0) ?? 0), 0);
        return heightCardSize(this.config ?? {}, 1 + Math.max(1, items), this.minimumHeight());
    }

    public getGridOptions(): Record<string, unknown> {
        return { columns: 12, min_columns: 6, rows: "auto", min_rows: gridMinRows(this.minimumHeight()) };
    }

    private hasHeader(): boolean {
        return Boolean(this.config?.title || this.config?.icon);
    }

    private minimumHeight(): number {
        return (this.hasHeader() ? HEADER_PX : 0) + LIST_TOP_PX + HEADING_PX + ITEM_PX + LIST_BOTTOM_PX + BORDER_PX;
    }

    private heightStyle(): string {
        return heightStyle(this.config ?? {}, this.layout, this.minimumHeight());
    }

    private layoutMode(): Layout {
        return this.config?.layout ?? "rows";
    }

    private textMode(): TextMode {
        return this.config?.text ?? "clamp";
    }

    private headings(): Headings {
        return this.config?.headings ?? "plain";
    }

    public connectedCallback(): void {
        super.connectedCallback();
        this.resizes = new ResizeObserver(() => this.measureSoon());
        this.watchDay();
        if (this.hasUpdated) {
            this.requestUpdate();
        }
    }

    public disconnectedCallback(): void {
        super.disconnectedCallback();
        window.clearTimeout(this.slideTimer);
        window.clearInterval(this.dayTimer);
        this.sliding = false;
        this.resizes?.disconnect();
        cancelAnimationFrame(this.frame ?? 0);
    }

    /** The items change buckets when the day does, with no change in any entity, so the card is drawn again then. */
    private watchDay(): void {
        window.clearInterval(this.dayTimer);
        let day = zoneDay(Date.now(), this.timeZone());
        // Asked once a minute, which holds in every time zone and over a clock change, where a timer set for midnight doesn't.
        this.dayTimer = window.setInterval(() => {
            const now = zoneDay(Date.now(), this.timeZone());
            if (now !== day) {
                day = now;
                this.requestUpdate();
            }
        }, 60_000);
    }

    protected shouldUpdate(changed: PropertyValues): boolean {
        if (!this.config || !changed.has("hass") || changed.size > 1) {
            return true;
        }
        const previous = changed.get("hass") as HomeAssistant | undefined;
        if (!previous || !this.hass) {
            return true;
        }
        if ((previous.locale?.language ?? previous.language) !== (this.hass.locale?.language ?? this.hass.language)) {
            return true;
        }
        return this.config.lists.some(({ entity }) => previous.states[entity] !== this.hass?.states[entity]);
    }

    protected willUpdate(): void {
        if (!this.hass || !this.config) {
            return;
        }
        const names = Object.fromEntries(
            (["before", "now", "after"] as Bucket[]).map((bucket) => [bucket, this.text(`common.bucket_${bucket}`)]),
        ) as Record<Bucket, string>;
        const whole = this.config.lists.length > 1;
        this.lists = this.config.lists.map((config) => {
            const entity = this.hass?.states[config.entity];
            const name =
                config.name ||
                (entity && this.hass?.formatEntityName?.(entity, [{ type: "device" }, { type: "entity" }])) ||
                (entity?.attributes.friendly_name as string | undefined) ||
                config.entity;
            const items = readItems(entity, config);
            return { config, name, arranged: items && arrange(items, config, Date.now(), names, { timeZone: this.timeZone(), whole }) };
        });
    }

    protected updated(): void {
        if (!this.isConnected) {
            return;
        }
        const card = this.renderRoot.querySelector("ha-card");
        if (card) {
            this.resizes?.observe(card);
        }
        this.measureSoon();
    }

    protected render(): TemplateResult | typeof nothing {
        if (!this.hass || !this.config) {
            return nothing;
        }
        const several = this.lists.length > 1;
        return html`
            <ha-card style=${this.cardStyle()} class=${this.cardClass()} @transitionend=${this.slid}>
                ${this.header()}
                <div class="list">
                    ${this.lists.length === 0 ? html`<div class="empty">${this.text("common.no_lists")}</div>` : nothing}
                    ${this.lists.map((list, index) => (several ? this.listAsGroup(list, index) : this.listGroups(list, index)))}
                </div>
            </ha-card>
        `;
    }

    private header(): TemplateResult | typeof nothing {
        if (!this.hasHeader()) {
            return nothing;
        }
        const title = this.config?.title ?? "";
        return html`<div class="hd">
            ${this.config?.icon ? html`<ha-icon class="hd-icon" icon=${this.config.icon}></ha-icon>` : nothing}
            <div class="hd-title" title=${title}>${title}</div>
            ${this.pill()}
        </div>`;
    }

    /**
     * Beside the title: how many items the first group has, with its name, when its tone says it matters, as "2 late"
     * does. Otherwise the number of items on the card.
     */
    private pill(): TemplateResult | typeof nothing {
        const groups = this.lists.flatMap((list) => list.arranged?.groups ?? []);
        const count = groups.reduce((sum, group) => sum + group.items.length, 0);
        if (count === 0) {
            return nothing;
        }
        const lead = this.lists.length === 1 ? groups[0] : undefined;
        if (lead?.name && (lead.tone === "warning" || lead.tone === "highlight")) {
            return html`<span class="pill tone-${lead.tone}">${lead.items.length} ${lead.name.toLocaleLowerCase(this.language())}</span>`;
        }
        return html`<span class="pill">${count}</span>`;
    }

    /** One list on the card: its groups are the card's groups. */
    private listGroups(list: Shown, index: number): TemplateResult {
        const groups = list.arranged?.groups ?? [];
        if (groups.length === 0) {
            return html`<div class="empty">${this.emptyText(list)}</div>`;
        }
        return html`${groups.map((group) => this.group(group, `${index} ${group.key}`, index, nothing))} ${this.more(list)}`;
    }

    /** One of several lists: a group of its own, under its name. */
    private listAsGroup(list: Shown, index: number): TemplateResult {
        const items = list.arranged?.groups.flatMap((group) => group.items) ?? [];
        const group: Group = { key: "list", name: list.name, tone: "plain", items };
        const rest = items.length === 0 ? html`<div class="empty">${this.emptyText(list)}</div>` : this.more(list);
        return this.group(group, `${index} list`, index, rest);
    }

    private emptyText(list: Shown): string {
        if (!list.arranged) {
            return this.text("common.unreadable", { entity: list.config.entity });
        }
        return list.config.empty || this.text("common.empty");
    }

    private more(list: Shown): TemplateResult | typeof nothing {
        const hidden = list.arranged?.hidden ?? 0;
        return hidden > 0 ? html`<div class="more">${this.text("common.more", { n: hidden })}</div>` : nothing;
    }

    private group(group: Group, key: string, list: number, rest: TemplateResult | typeof nothing): TemplateResult {
        const items = html`<div class="items">
            ${repeat(
                group.items,
                (item) => item.key,
                (item) => this.item(item, `${list} ${item.key}`),
            )}
        </div>`;
        if (group.name === undefined) {
            return html`<div class="grp">${items}${rest}</div>`;
        }
        if (this.headings() === "plain") {
            return html`<div class="grp">
                <div class="gh" title=${group.name}>${group.name}</div>
                ${items}${rest}
            </div>`;
        }
        const open = !this.shut.has(key);
        return html`<div class="grp">
            <button class="gh folding" aria-expanded=${open ? "true" : "false"} @click=${() => this.toggle("shut", key)}>
                <span class="dot tone-${group.tone}"></span>
                <span class="gh-name" title=${group.name}>${group.name}</span>
                <span class="count">${group.items.length}</span>
                <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
            </button>
            ${this.fold(open, html`${items}${rest}`)}
        </div>`;
    }

    private item(item: Placed, key: string): TemplateResult {
        const mode = this.textMode();
        const open = this.opened.has(key);
        // A tap opens what isn't in sight: a folded text, or the rest of one cut to two lines.
        const can = Boolean(item.text) && (mode === "fold" || (mode === "clamp" && (open || this.cut.has(key))));
        const classes = ["item", this.layoutMode(), `tone-${item.tone}`, open && "open", can && "can"].filter(Boolean).join(" ");
        const cover = can
            ? html`<button
                  class="cover"
                  aria-label=${item.title}
                  aria-expanded=${open ? "true" : "false"}
                  @click=${() => this.toggle("opened", key)}
              ></button>`
            : nothing;
        const source = item.link
            ? html`<a class="src" href=${item.link} target="_blank" rel="noreferrer" title=${this.text("common.open_source")}
                  ><ha-icon icon="mdi:open-in-new"></ha-icon
              ></a>`
            : nothing;
        // The chevron keeps its place on every item with a text that may be cut, so a text's width never depends on it.
        const chevron =
            item.text && mode !== "full" ? html`<ha-icon class="chev ${can ? "" : "idle"}" icon="mdi:chevron-down"></ha-icon>` : nothing;
        const actions = item.link || (item.text && mode !== "full") ? html`<span class="act">${source}${chevron}</span>` : nothing;
        const text = item.text
            ? html`<div class="tx ${mode === "clamp" && !open ? "clamp" : ""}" data-key=${key}>${item.text}</div>`
            : nothing;
        const label = item.label ? html`<div class="lb" title=${item.label}>${item.label}</div>` : nothing;
        const when = this.whenText(item);

        if (this.layoutMode() === "timeline") {
            const extra = this.badgeSaysIt(item) ? "" : when;
            const line =
                item.label || extra
                    ? html`<div class="lb" title=${[item.label, extra].filter(Boolean).join(" · ")}>
                          ${item.label ?? nothing}${item.label && extra ? " · " : nothing}${extra ? html`<span class="when">${extra}</span>` : nothing}
                      </div>`
                    : nothing;
            return html`<div class=${classes}>
                ${cover} ${this.badge(item)}
                <div class="body">
                    <div class="ti" title=${item.title}>${this.icon(item, "ti-icon")}${item.title}</div>
                    ${line} ${mode === "fold" ? this.fold(open, text) : text}
                </div>
                ${actions}
            </div>`;
        }

        const folded = mode === "fold";
        return html`<div class=${classes}>
            ${cover}
            <div class="line">
                <span class="ic">${this.icon(item)}</span>
                <span class="ti" title=${item.title}
                    >${item.title}${folded && !open && item.label ? html`<span class="inl"> · ${item.label}</span>` : nothing}</span
                >
                ${when ? html`<span class="when" title=${this.longWhen(item)}>${when}</span>` : nothing} ${actions}
            </div>
            ${folded ? this.fold(open, html`<div class="sub">${label}${text}</div>`) : label !== nothing || text !== nothing ? html`<div class="sub">${label}${text}</div>` : nothing}
        </div>`;
    }

    private icon(item: Placed, classes = ""): TemplateResult | typeof nothing {
        if (!item.icon) {
            return nothing;
        }
        return ICON_NAME.test(item.icon)
            ? html`<ha-icon class=${classes} icon=${item.icon}></ha-icon>`
            : html`<span class="emoji ${classes}">${item.icon}</span>`;
    }

    private format(when: When, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
        // A whole day is held as its midnight in UTC, so it is written out in UTC whatever zone the viewer is in.
        return new Intl.DateTimeFormat(this.language(), { ...options, timeZone: when.allDay ? "UTC" : this.timeZone() });
    }

    private year(when: When): string {
        return this.format(when, { year: "numeric" }).format(when.time);
    }

    private thisYear(): string {
        return new Intl.DateTimeFormat(this.language(), { year: "numeric", timeZone: this.timeZone() }).format(Date.now());
    }

    /** The date's parts for a text: day and month, the year when it isn't this one, the time when the date has one. */
    private dateOptions(when: When, ...also: When[]): Intl.DateTimeFormatOptions {
        const year = [when, ...also].some((w) => this.year(w) !== this.thisYear());
        return {
            day: "numeric",
            month: "numeric",
            ...(year ? { year: "numeric" } : {}),
            ...(when.allDay ? {} : { hour: "numeric", minute: "2-digit" }),
        };
    }

    /**
     * When the item is, as a short text: a period as its range, today as "today", a day in a bucket toned as a warning
     * as how long ago it was, and any other day with its weekday.
     */
    private whenText(item: Placed): string {
        const start = item.start ?? item.end;
        if (!start) {
            return "";
        }
        const end = item.start && item.end ? item.end : undefined;
        if (end && (end.time !== start.time || end.allDay !== start.allDay)) {
            // One formatter writes both ends, so a period mixing a day and a time is written by its start's kind.
            return this.format(start, this.dateOptions(start, end)).formatRange(start.time, end.time);
        }
        const away = dayOf(start, this.timeZone()) - zoneDay(Date.now(), this.timeZone());
        if (away === 0 || (away < 0 && item.tone === "warning")) {
            const relative = new Intl.RelativeTimeFormat(this.language(), { numeric: "auto", style: "short" }).format(away, "day");
            return start.allDay || away !== 0
                ? relative
                : `${relative} ${this.format(start, { hour: "numeric", minute: "2-digit" }).format(start.time)}`;
        }
        return this.format(start, { weekday: "short", ...this.dateOptions(start) }).format(start.time);
    }

    private longWhen(item: Placed): string {
        const start = item.start ?? item.end;
        if (!start) {
            return "";
        }
        const options: Intl.DateTimeFormatOptions = start.allDay ? { dateStyle: "full" } : { dateStyle: "full", timeStyle: "short" };
        const end = item.start && item.end ? item.end : undefined;
        const format = this.format(start, options);
        return end ? format.formatRange(start.time, end.time) : format.format(start.time);
    }

    private sameMonthDays(item: Placed): boolean {
        const { start, end } = item;
        return Boolean(
            start?.allDay &&
            end?.allDay &&
            end.time > start.time &&
            this.format(start, { year: "numeric", month: "numeric" }).format(start.time) ===
                this.format(end, { year: "numeric", month: "numeric" }).format(end.time),
        );
    }

    /** Whether the timeline's badge already says when the item is, so the text needn't: a plain day, or days within a month. */
    private badgeSaysIt(item: Placed): boolean {
        const start = item.start ?? item.end;
        if (!start) {
            return true;
        }
        if (item.start && item.end && item.end.time !== item.start.time) {
            return this.sameMonthDays(item);
        }
        const away = dayOf(start, this.timeZone()) - zoneDay(Date.now(), this.timeZone());
        return start.allDay && away !== 0 && !(away < 0 && item.tone === "warning");
    }

    /** The day large, or a period's days within one month, the month under it, and the year only when it isn't this year's. */
    private badge(item: Placed): TemplateResult {
        const start = item.start ?? item.end;
        if (!start) {
            return html`<div class="badge"><div class="day">–</div></div>`;
        }
        const day = (when: When) => this.format(when, { day: "numeric" }).format(when.time);
        const days = this.sameMonthDays(item) ? `${day(start)}–${day(item.end!)}` : day(start);
        const year = this.year(start);
        return html`<div class="badge" title=${this.longWhen(item)}>
            <div class="day">${days}</div>
            <div class="month">${this.format(start, { month: "short" }).format(start.time)}</div>
            ${year === this.thisYear() ? nothing : html`<div class="year">${year}</div>`}
        </div>`;
    }

    private timeZone(): string | undefined {
        return this.hass?.locale?.time_zone === "server" ? this.hass.config?.time_zone : undefined;
    }

    private toggle(which: "opened" | "shut", key: string): void {
        const keys = new Set(this[which]);
        if (!keys.delete(key)) {
            keys.add(key);
        }
        this[which] = keys;
        // Only a fold slides. A text cut to two lines opens at once.
        if (which === "shut" || this.textMode() === "fold") {
            this.sliding = true;
            window.clearTimeout(this.slideTimer);
            // The slide's end lifts it. Without a slide, as with reduced motion, there is no end to wait for.
            this.slideTimer = window.setTimeout(() => (this.sliding = false), 1000);
        }
    }

    private readonly slid = (event: TransitionEvent): void => {
        const fold = event.target as HTMLElement;
        if (event.propertyName !== "grid-template-rows" || !fold.classList?.contains("fold")) {
            return;
        }
        const moving = [...this.renderRoot.querySelectorAll(".fold")].some((f) => f !== fold && (f.getAnimations?.().length ?? 0) > 0);
        if (!moving) {
            window.clearTimeout(this.slideTimer);
            this.sliding = false;
        }
    };

    /** Content that slides open and shut. A shut one stays in the page, so the change can be animated. */
    private fold(isOpen: boolean, content: TemplateResult | typeof nothing): TemplateResult {
        return html`<div class="fold ${isOpen ? "open" : ""}" ?inert=${!isOpen}>
            <div class="fold-in"><div class="fold-body">${content}</div></div>
        </div>`;
    }

    private measureSoon(): void {
        cancelAnimationFrame(this.frame ?? 0);
        this.frame = requestAnimationFrame(() => {
            // A change in which texts are cut draws the card again, and the rows are filled on that render's own frame.
            if (!this.findCut()) {
                this.fillRows();
            }
        });
    }

    /** Which texts, cut to two lines, have more to show. Only those open on a tap. True when the set changed. */
    private findCut(): boolean {
        const cut = new Set<string>();
        for (const text of this.renderRoot.querySelectorAll<HTMLElement>(".tx.clamp")) {
            if (text.scrollHeight > text.clientHeight + 1 && text.dataset.key) {
                cut.add(text.dataset.key);
            }
        }
        // An opened text isn't cut any more, and stays one that can be shut.
        for (const key of this.opened) {
            if (this.cut.has(key)) {
                cut.add(key);
            }
        }
        if (cut.size === this.cut.size && [...cut].every((key) => this.cut.has(key))) {
            return false;
        }
        this.cut = cut;
        return true;
    }

    private fillRows(): void {
        const card = this.renderRoot.querySelector<HTMLElement>("ha-card");
        if (!card || !card.clientWidth) {
            return;
        }
        const limit = fillLimit(this.config ?? {}, this.layout, this.minimumHeight());
        if (!limit) {
            if (this.filled) this.filled = 0;
            if (this.spare) this.spare = 0;
            return;
        }
        const scale = drawnScale(card);
        // The card's parts one after another, never the card's own height, which is the min-height set here, and only its
        // own parts, never an element a theme adds to it. The list counts as its folds will end.
        const style = getComputedStyle(card);
        let content = px(style.borderTopWidth) + px(style.borderBottomWidth) + px(style.paddingTop) + px(style.paddingBottom);
        for (const part of card.querySelectorAll<HTMLElement>(CARD_PARTS)) {
            const partStyle = getComputedStyle(part);
            const height = part.classList.contains("list") ? endHeight(part, scale, false) : part.getBoundingClientRect().height / scale;
            content += px(partStyle.marginTop) + height + px(partStyle.marginBottom);
        }
        // The spare room as drawn now, which while a slide goes on is somewhere between the old and the new.
        const list = card.querySelector<HTMLElement>(":scope > .list");
        content -= list ? Math.max(0, px(getComputedStyle(list).paddingTop) - LIST_TOP_PX) : 0;
        const filled = filledHeight(content, this.config ?? {}, limit);
        const spare = spareRoom(filled, content);
        if (filled !== this.filled) {
            this.filled = filled;
        }
        if (spare !== this.spare) {
            this.spare = spare;
        }
    }

    /** The card's inline style: the height it is held to, or the rows it fills up to any limit, with their spare room under the header. */
    private cardStyle(): string {
        const style = filledStyle(this.config ?? {}, this.layout, this.minimumHeight(), this.filled);
        return this.filled ? `${style}; --lc-spare: ${this.spare}px` : style;
    }

    private cardClass(): string {
        // Without a single icon on the card, the rows give its column up.
        const icons = this.lists.some((list) => list.arranged?.groups.some((group) => group.items.some((item) => item.icon)));
        return [this.heightStyle() && "held", this.sliding && "sliding", !icons && "no-icons"].filter(Boolean).join(" ");
    }

    private text(key: string, values: Record<string, string | number> = {}): string {
        return Object.entries(values).reduce(
            (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
            translate(this.language(), key),
        );
    }

    private language(): string {
        return this.hass?.locale?.language ?? this.hass?.language ?? browserLanguage();
    }

    static get styles(): CSSResultGroup {
        return [
            css`
                /*
                 * A column, so that with a height of its own, given in the options or by the dashboard's grid, the
                 * header keeps its place and the lists scroll in what is left.
                 */
                ha-card {
                    /* ha-card's own transition covers every property, so a change in the rows filled would animate. Only a slide does. */
                    transition: none;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    container-type: inline-size;
                    --lc-warning: var(--warning-color, #ffa600);
                    --lc-highlight: var(--success-color, #43a047);
                }

                .hd {
                    flex: none;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 16px 0;
                    min-height: 32px;
                }

                .hd-icon {
                    flex: none;
                    color: var(--state-icon-color);
                }

                .hd-title {
                    flex: 1 1 auto;
                    min-width: 0;
                    font-size: var(--ha-card-header-font-size, 18px);
                    line-height: 1.4;
                }

                .pill {
                    flex: none;
                    font-size: 12px;
                    font-weight: 500;
                    white-space: nowrap;
                    border-radius: 10px;
                    padding: 1px 8px;
                    background: rgba(var(--rgb-primary-text-color, 33, 33, 33), 0.1);
                }

                .pill.tone-warning {
                    background: color-mix(in srgb, var(--lc-warning) 24%, transparent);
                }

                .pill.tone-highlight {
                    background: color-mix(in srgb, var(--lc-highlight) 24%, transparent);
                }

                /* The room a whole row leaves over goes under the header, above the lists. */
                .list {
                    flex: 1 1 auto;
                    min-height: 0;
                    padding: calc(4px + var(--lc-spare, 0px)) 0 12px;
                }

                .grp + .grp {
                    border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
                    margin-top: 4px;
                }

                .gh {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-sizing: border-box;
                    width: 100%;
                    padding: 6px 16px 2px;
                    font: inherit;
                    font-size: 11px;
                    font-weight: 500;
                    line-height: 16px;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    text-align: start;
                    color: var(--secondary-text-color);
                    background: none;
                    border: 0;
                    overflow-wrap: anywhere;
                }

                .gh.folding {
                    min-height: 36px;
                    padding: 4px 12px 4px 16px;
                    font-size: 14px;
                    line-height: 20px;
                    letter-spacing: normal;
                    text-transform: none;
                    color: var(--primary-text-color);
                    cursor: pointer;
                }

                .gh-name {
                    flex: 1 1 auto;
                    min-width: 0;
                }

                .count {
                    flex: none;
                    font-size: 12px;
                    font-weight: 400;
                    color: var(--secondary-text-color);
                }

                .dot {
                    flex: none;
                    width: 8px;
                    height: 8px;
                    border-radius: 2px;
                    background: var(--secondary-text-color);
                }

                .dot.tone-warning {
                    background: var(--lc-warning);
                }

                .dot.tone-highlight {
                    background: var(--lc-highlight);
                }

                .dot.tone-dimmed {
                    opacity: 0.5;
                }

                .chev {
                    flex: none;
                    --mdc-icon-size: 20px;
                    color: var(--secondary-text-color);
                    transition: transform var(--ha-animation-duration-normal, 250ms) ease;
                }

                .gh[aria-expanded="false"] .chev {
                    transform: rotate(-90deg);
                }

                .item.open .act .chev {
                    transform: rotate(180deg);
                }

                .chev.idle {
                    visibility: hidden;
                }

                .item {
                    position: relative;
                    padding: 4px 16px;
                }

                /* The tap that opens an item covers it, and its texts let the tap through. The source link lies over it. */
                .cover {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    padding: 0;
                    border: 0;
                    background: none;
                    cursor: pointer;
                }

                .cover:focus-visible {
                    outline: 2px solid var(--primary-color);
                    outline-offset: -2px;
                    border-radius: 4px;
                }

                .item.can > :not(.cover) {
                    pointer-events: none;
                }

                .item .src {
                    pointer-events: auto;
                }

                .tone-dimmed > :not(.cover) {
                    opacity: 0.6;
                }

                /* The date and the buttons go to a line of their own when the title has too little room beside them. */
                .line {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                    align-items: flex-start;
                    gap: 0 10px;
                    min-height: 24px;
                }

                .ic {
                    flex: none;
                    width: 24px;
                    line-height: 24px;
                    text-align: center;
                    color: var(--state-icon-color);
                    --mdc-icon-size: 20px;
                }

                .emoji {
                    font-size: 17px;
                }

                .no-icons .ic {
                    display: none;
                }

                .no-icons .sub {
                    padding-left: 0;
                }

                .ti {
                    flex: 1 1 130px;
                    min-width: 0;
                    font-weight: 500;
                    line-height: 20px;
                    padding: 2px 0;
                    overflow-wrap: anywhere;
                }

                .inl {
                    font-weight: 400;
                    font-size: 12px;
                    color: var(--secondary-text-color);
                }

                .when {
                    flex: none;
                    font-size: 12px;
                    line-height: 24px;
                    white-space: nowrap;
                    color: var(--secondary-text-color);
                }

                .tone-warning .when {
                    color: var(--lc-warning);
                }

                .tone-highlight .when {
                    color: var(--lc-highlight);
                }

                /* The buttons' icons are smaller than the buttons, so the row is pulled out until the last icon ends where the texts do. */
                .act {
                    flex: none;
                    display: flex;
                    align-items: center;
                    height: 24px;
                    margin-right: -5px;
                }

                .src {
                    position: relative;
                    display: grid;
                    place-items: center;
                    width: 28px;
                    height: 28px;
                    margin: -2px 0;
                    border-radius: 50%;
                    color: var(--secondary-text-color);
                    --mdc-icon-size: 18px;
                }

                .src:hover {
                    background: rgba(var(--rgb-primary-text-color, 33, 33, 33), 0.06);
                    color: var(--primary-color);
                }

                .sub {
                    padding: 0 0 0 34px;
                }

                .lb {
                    font-size: 12px;
                    line-height: 16px;
                    color: var(--secondary-text-color);
                    overflow-wrap: anywhere;
                }

                .tx {
                    font-size: 13px;
                    line-height: 18px;
                    color: var(--secondary-text-color);
                    overflow-wrap: anywhere;
                }

                .tx.clamp {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* The timeline: a date badge, with a line running from each badge to the next. */
                .item.timeline {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding-top: 0;
                    padding-bottom: 0;
                }

                .item.timeline::before {
                    content: "";
                    position: absolute;
                    left: 39.5px;
                    top: 0;
                    bottom: 0;
                    width: 1px;
                    background: var(--divider-color, rgba(0, 0, 0, 0.12));
                }

                .item.timeline:first-child::before {
                    top: 12px;
                }

                .item.timeline:last-child::before {
                    bottom: calc(100% - 12px);
                }

                .badge {
                    flex: none;
                    position: relative;
                    width: 48px;
                    box-sizing: border-box;
                    margin: 6px 0;
                    text-align: center;
                    border-radius: 6px;
                    padding: 3px 0 2px;
                    line-height: 1.15;
                    background: var(--card-background-color, #fff);
                    box-shadow: inset 0 0 0 1px var(--divider-color, rgba(0, 0, 0, 0.12));
                }

                .tone-warning .badge {
                    box-shadow: inset 0 0 0 1.5px var(--lc-warning);
                }

                .tone-highlight .badge {
                    box-shadow: inset 0 0 0 1.5px var(--lc-highlight);
                }

                .day {
                    font-size: 15px;
                    font-weight: 500;
                    white-space: nowrap;
                }

                .month,
                .year {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    color: var(--secondary-text-color);
                }

                .body {
                    flex: 1 1 auto;
                    min-width: 0;
                    padding: 7px 0;
                }

                .timeline .ti {
                    padding: 0;
                }

                .ti-icon {
                    margin-right: 5px;
                    --mdc-icon-size: 18px;
                    color: var(--state-icon-color);
                }

                .timeline .act {
                    margin-top: 6px;
                }

                .timeline .lb .when {
                    line-height: inherit;
                }

                .more,
                .empty {
                    padding: 4px 16px 2px;
                    font-size: 12px;
                    color: var(--secondary-text-color);
                }

                .empty {
                    font-size: 13px;
                    padding-top: 8px;
                }

                .fold {
                    display: grid;
                    grid-template-rows: 0fr;
                    transition: grid-template-rows var(--ha-animation-duration-normal, 250ms) ease;
                }

                .fold.open {
                    grid-template-rows: 1fr;
                }

                .fold-in {
                    min-height: 0;
                    overflow: hidden;
                }

                /* Held to a height, the header keeps to one line and the lists scroll, measured the same whether they do or not. */
                .held .hd-title,
                .held .ti,
                .held .lb,
                .held .gh-name,
                .held .gh:not(.folding) {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .held .gh:not(.folding) {
                    display: block;
                }

                .held .line {
                    flex-wrap: nowrap;
                }

                .held .ti {
                    flex-basis: 0;
                }

                .held .list {
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-gutter: stable;
                }

                .sliding.held .list {
                    overflow-y: hidden;
                }

                /* The rows the card fills, and the spare room above the lists, change along with a slide, not on ha-card's own timing. */
                ha-card.sliding {
                    transition: min-height var(--ha-animation-duration-normal, 250ms) ease;
                }

                ha-card.sliding > .list {
                    transition: padding var(--ha-animation-duration-normal, 250ms) ease;
                }

                @media (prefers-reduced-motion: reduce) {
                    .fold,
                    .chev,
                    ha-card.sliding,
                    ha-card.sliding > .list {
                        transition: none;
                    }
                }
            `,
            fadeStyles,
        ];
    }
}

// Registered only once, as another copy of the card may already be loaded.
if (!customElements.get("lists-card")) {
    customElements.define("lists-card", ListsCard);
    console.info(
        `%c  LISTS-CARD \n%c  ${CARD_VERSION}    `,
        "color: orange; font-weight: bold; background: black",
        "color: white; font-weight: bold; background: dimgray",
    );
    const registry = window as unknown as { customCards?: CardRegistration[] };
    registry.customCards = registry.customCards ?? [];
    registry.customCards.push({
        type: "lists-card",
        name: translate(browserLanguage(), "common.name"),
        description: translate(browserLanguage(), "common.description"),
        documentationURL: "https://github.com/jesmak/lists-card",
        preview: true,
    });
}

declare global {
    interface HTMLElementTagNameMap {
        "lists-card": ListsCard;
    }
}
