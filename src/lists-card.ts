/**
 * lists-card: any list an entity holds, such as tasks, events or notices. Each list says where its items are and which
 * of their keys the card reads. One list is grouped by its items' dates (over, going on, to come), by one of their keys,
 * or not at all. Several lists are a group each. Held to a height, the header stays and the lists scroll under it.
 *
 * The card shows what its sources give and remembers nothing itself. What it changes are to-do lists: an item ticked,
 * added, edited, moved or deleted.
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
import {
    arrange,
    calendarEntities,
    calendarItems,
    calendarWindow,
    colorOf,
    cssColor,
    dayOf,
    isCalendarList,
    isTodoList,
    readItems,
    todoItems,
    validList,
    zoneDay,
} from "./lists";
import { browserLanguage, translate } from "./localize/localize";
import { draftOf, hasFeature, moveTarget, saveData } from "./todo";
import type { Draft, TodoFeature } from "./todo";
import { drawnScale, fillLimit, filledHeight, filledStyle, spareRoom, validRowStep } from "./rows";
import { BUCKETS, EDITING, HEADINGS, LAYOUTS, TEXT_MODES } from "./types";
import type {
    Arranged,
    Bucket,
    CalendarEvent,
    Group,
    Headings,
    Item,
    Layout,
    ListConfig,
    ListsCardConfig,
    Placed,
    TextMode,
    TodoItem,
    When,
} from "./types";

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
    /** A to-do list whose items haven't come yet. */
    loading?: boolean;
    /** How many items the list's limit leaves out, and whether they are shown after all, opened by a tap. */
    cut: number;
    open: boolean;
}

/** A ticked to-do item, by its list's entity and its uid: as it was, which keeps its place and its date, and whether it is shown done. */
interface Ticking {
    held: TodoItem;
    to: boolean;
}

/** The keys of the card's subscriptions: a to-do list's by its entity, a calendar's by its entity and window. */
const TODO_PREFIX = "todo ";
const todoKey = (entity: string) => `${TODO_PREFIX}${entity}`;
const calendarKey = (entity: string, start: string, end: string) => `calendar ${entity} ${start} ${end}`;

/** How long a ticked item stays in its place, so a tick by mistake can be undone where it was made. */
const TICK_HOLD_MS = 1000;

/** An item being written, and whether the last try to save it failed. */
interface Editing extends Draft {
    failed?: boolean;
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
    /** The to-do lists' items as they last came, those whose subscription failed, and the items just ticked. */
    @state() private todos = new Map<string, TodoItem[]>();
    /** The calendars' events as they last came, by their subscriptions' keys. */
    @state() private events = new Map<string, CalendarEvent[]>();
    @state() private failed = new Set<string>();
    @state() private ticking = new Map<string, Ticking>();
    /** The item open in the editor, a new one without a uid, and the to-do lists asking whether to delete what is done. */
    @state() private editing?: Editing;
    @state() private asking = new Set<string>();
    /** The lists, by their place on the card, whose items beyond the limit have been opened. */
    @state() private expanded = new Set<number>();
    private focusEditor = false;

    private subscriptions = new Map<string, Promise<() => Promise<void>>>();
    private tickTimers = new Map<string, number>();

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

    /** The first entity with a list of objects in an attribute, with the key that looks most like a title, else the first to-do list. */
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
        const todo = Object.keys(hass?.states ?? {}).find((entity) => entity.startsWith("todo."));
        return { lists: todo ? [{ entity: todo }] : [] };
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
        if (config.editing != null && !EDITING.includes(config.editing)) {
            throw invalid("invalid_editing");
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
        return Boolean(this.config?.title || this.config?.icon || this.addTarget());
    }

    /** The list the header's + adds to: the card's only list, when it is a to-do list that takes new items. */
    private addTarget(): ListConfig | undefined {
        const lists = this.config?.lists ?? [];
        return lists.length === 1 && isTodoList(lists[0]) && this.can(lists[0], "create") ? lists[0] : undefined;
    }

    private minimumHeight(): number {
        return (this.hasHeader() ? HEADER_PX : 0) + this.listTop() + HEADING_PX + ITEM_PX + LIST_BOTTOM_PX + BORDER_PX;
    }

    /** The list's own room at its top: a little under a header, and as much as at its bottom on a card with none, which is centred. */
    private listTop(): number {
        return this.hasHeader() ? LIST_TOP_PX : LIST_BOTTOM_PX;
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
        this.watchSources();
        this.tickTimers.forEach((timer) => window.clearTimeout(timer));
        this.tickTimers.clear();
        this.ticking = new Map();
        this.editing = undefined;
        this.asking = new Set();
    }

    /**
     * The subscriptions the card's lists need: each to-do list's items, and each calendar's events over its list's
     * window, which moves with the day. Each is keyed by what it asks, so a changed window is a new subscription.
     */
    private wantedSources(): Map<string, Record<string, unknown>> {
        const wanted = new Map<string, Record<string, unknown>>();
        for (const list of this.config?.lists ?? []) {
            if (isTodoList(list)) {
                wanted.set(todoKey(list.entity), { type: "todo/item/subscribe", entity_id: list.entity });
            } else if (isCalendarList(list)) {
                const { start, end } = calendarWindow(list, Date.now(), this.timeZone());
                for (const entity of calendarEntities(list)) {
                    wanted.set(calendarKey(entity, start, end), { type: "calendar/event/subscribe", entity_id: entity, start, end });
                }
            }
        }
        return wanted;
    }

    /**
     * Subscribes to what the card's lists need while it is on the page, and lets go of what they no longer do. Home
     * Assistant sends a to-do list's items and a calendar's events whole, at once and on every change.
     */
    private watchSources(): void {
        const connection = this.isConnected ? this.hass?.connection : undefined;
        const wanted = connection ? this.wantedSources() : new Map<string, Record<string, unknown>>();
        for (const [key, subscription] of this.subscriptions) {
            if (!wanted.has(key)) {
                this.subscriptions.delete(key);
                subscription.then((unsubscribe) => unsubscribe()).catch(() => undefined);
                this.todos.delete(key.slice(TODO_PREFIX.length));
                this.events.delete(key);
                this.failed.delete(key);
            }
        }
        for (const [key, message] of wanted) {
            if (this.subscriptions.has(key)) {
                continue;
            }
            const subscription = connection!.subscribeMessage<{ items?: TodoItem[]; events?: CalendarEvent[] | null }>((answer) => {
                if (message.type === "todo/item/subscribe") {
                    this.todos = new Map(this.todos).set(message.entity_id as string, Array.isArray(answer?.items) ? answer.items : []);
                } else {
                    this.events = new Map(this.events).set(key, Array.isArray(answer?.events) ? answer.events : []);
                }
            }, message);
            // No such entity, or not a to-do list or a calendar after all.
            subscription.catch(() => {
                if (this.subscriptions.get(key) === subscription) {
                    this.failed = new Set(this.failed).add(key);
                }
            });
            this.subscriptions.set(key, subscription);
        }
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
        this.watchSources();
        const names = Object.fromEntries(BUCKETS.map((bucket) => [bucket, this.text(`common.bucket_${bucket}`)])) as Record<Bucket, string>;
        const whole = this.config.lists.length > 1;
        this.lists = this.config.lists.map((config, index) => {
            const entity = this.hass?.states[config.entity];
            const name =
                config.name ||
                (entity && this.hass?.formatEntityName?.(entity, [{ type: "device" }, { type: "entity" }])) ||
                (entity?.attributes.friendly_name as string | undefined) ||
                config.entity;
            const { items, loading } = isTodoList(config)
                ? {
                      items: this.todoItems(config.entity),
                      loading: !this.todos.has(config.entity) && !this.failed.has(todoKey(config.entity)),
                  }
                : isCalendarList(config)
                  ? this.calendarItems(config)
                  : { items: readItems(entity, config), loading: false };
            const colored =
                items && !isCalendarList(config) && config.color ? items.map((item) => ({ ...item, color: config.color })) : items;
            const arrangeBy = (list: ListConfig) =>
                colored && arrange(colored, list, Date.now(), names, { timeZone: this.timeZone(), whole, monthName: this.monthName });
            const limited = arrangeBy(config);
            const cut = limited?.hidden ?? 0;
            const open = cut > 0 && !config.hide_more && this.expanded.has(index);
            return {
                config,
                name,
                arranged: open ? arrangeBy({ ...config, limit: 0, past_limit: undefined }) : limited,
                loading,
                cut,
                open,
            };
        });
    }

    /**
     * A calendar list's events from all its calendars. Until every calendar has answered or failed it is loading, and
     * when none could be read it has no list to show.
     */
    private calendarItems(list: ListConfig): { items?: Item[]; loading: boolean } {
        const { start, end } = calendarWindow(list, Date.now(), this.timeZone());
        const keys = calendarEntities(list).map((entity) => [entity, calendarKey(entity, start, end)] as const);
        if (keys.some(([, key]) => !this.events.has(key) && !this.failed.has(key))) {
            return { loading: true };
        }
        const read = keys.filter(([, key]) => this.events.has(key));
        return {
            items: read.length
                ? read.flatMap(([entity, key]) =>
                      calendarItems(this.events.get(key)!, entity).map((item) => ({ ...item, color: colorOf(list, entity) })),
                  )
                : undefined,
            loading: false,
        };
    }

    /** A month's heading in the viewer's language, such as "Marraskuu", with its year when that isn't this one. */
    private readonly monthName = (year: number, month: number): string => {
        const thisYear = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: this.timeZone() }).format(Date.now()));
        const options: Intl.DateTimeFormatOptions = year === thisYear ? { month: "long" } : { month: "long", year: "numeric" };
        const name = new Intl.DateTimeFormat(this.language(), { ...options, timeZone: "UTC" }).format(Date.UTC(year, month, 1));
        return name.charAt(0).toLocaleUpperCase(this.language()) + name.slice(1);
    };

    /** A to-do list's items, those just ticked still where they were, or undefined until they have come. */
    private todoItems(entity: string): ReturnType<typeof todoItems> | undefined {
        const raw = this.todos.get(entity);
        return raw && todoItems(raw.map((todo) => this.ticking.get(`${entity} ${todo.uid}`)?.held ?? todo));
    }

    /** Whether the item is shown done: as it was just ticked, or as its list has it. */
    private shownDone(list: ListConfig, item: Placed): boolean {
        return this.ticking.get(`${list.entity} ${item.uid}`)?.to ?? Boolean(item.done);
    }

    private features(entity: string): number {
        return Number(this.hass?.states[entity]?.attributes.supported_features ?? 0);
    }

    /** Whether the card may change a to-do list in this way: the list supports it, and the card isn't read only. */
    /** Whether the card may change a to-do list in this way: the list supports it, and the card is set to change everything. */
    private can(list: ListConfig, feature: TodoFeature): boolean {
        return (this.config?.editing ?? "full") === "full" && this.supports(list, feature);
    }

    /** Whether an item of the list can be ticked: the card isn't set to change nothing, and the list lets items be changed. */
    private canTick(list: ListConfig): boolean {
        return this.config?.editing !== "none" && this.supports(list, "update");
    }

    private supports(list: ListConfig, feature: TodoFeature): boolean {
        return Boolean(this.hass?.callService) && hasFeature(this.features(list.entity), feature);
    }

    private rawItem(entity: string, uid: string | undefined) {
        return uid === undefined ? undefined : this.todos.get(entity)?.find((todo) => todo.uid === uid);
    }

    private async callTodo(action: string, data: Record<string, unknown>, entity: string): Promise<void> {
        await this.hass?.callService?.("todo", action, data, { entity_id: entity });
    }

    /** Opens an item in the editor, or an empty one for a new item, in place of whatever was open. */
    private edit(list: ListConfig, item?: Placed): void {
        const raw = this.rawItem(list.entity, item?.uid);
        this.editing = raw ? draftOf(list.entity, raw) : { entity: list.entity, title: "", text: "", day: "", time: "" };
        this.focusEditor = true;
    }

    private async save(): Promise<void> {
        const draft = this.editing;
        if (!draft?.title.trim()) {
            return;
        }
        const before = this.rawItem(draft.entity, draft.uid);
        try {
            if (draft.uid !== undefined && !before) {
                throw new Error("The item is gone from its list.");
            }
            await this.callTodo(before ? "update_item" : "add_item", saveData(draft, this.features(draft.entity), before), draft.entity);
            if (this.editing === draft) {
                this.editing = undefined;
            }
        } catch {
            if (this.editing === draft) {
                this.editing = { ...draft, failed: true };
            }
        }
    }

    private async deleteItem(): Promise<void> {
        const draft = this.editing;
        if (!draft?.uid) {
            return;
        }
        try {
            await this.callTodo("remove_item", { item: [draft.uid] }, draft.entity);
            if (this.editing === draft) {
                this.editing = undefined;
            }
        } catch {
            if (this.editing === draft) {
                this.editing = { ...draft, failed: true };
            }
        }
    }

    /** Moves the open item one row up or down among the items without a date, which the list keeps in its own order. */
    private async move(direction: "up" | "down"): Promise<void> {
        const draft = this.editing;
        const target = draft?.uid ? moveTarget(this.todos.get(draft.entity) ?? [], draft.uid, direction) : null;
        if (!draft || target === null) {
            return;
        }
        try {
            await this.hass?.callWS?.({ type: "todo/item/move", entity_id: draft.entity, uid: draft.uid, previous_uid: target });
        } catch {
            if (this.editing === draft) {
                this.editing = { ...draft, failed: true };
            }
        }
    }

    /** Deletes every done item of the list, once the list has been asked and said yes. */
    private async clearDone(list: ListConfig): Promise<void> {
        const done = (this.todos.get(list.entity) ?? []).filter((todo) => todo.status === "completed").map((todo) => todo.uid);
        this.ask(list.entity, false);
        if (done.length > 0) {
            await this.callTodo("remove_item", { item: done }, list.entity).catch(() => undefined);
        }
    }

    private ask(entity: string, on: boolean): void {
        const asking = new Set(this.asking);
        if (on) {
            asking.add(entity);
        } else {
            asking.delete(entity);
        }
        this.asking = asking;
    }

    /** Ticks an item done, or open again. It is shown so at once, and keeps its place a moment before it moves. */
    private async tick(list: ListConfig, item: Placed): Promise<void> {
        const key = `${list.entity} ${item.uid}`;
        const current = this.ticking.get(key);
        const held = current?.held ?? this.todos.get(list.entity)?.find((todo) => todo.uid === item.uid);
        if (!held) {
            return;
        }
        const to = !(current?.to ?? Boolean(item.done));
        this.ticking = new Map(this.ticking).set(key, { held, to });
        window.clearTimeout(this.tickTimers.get(key));
        this.tickTimers.set(
            key,
            window.setTimeout(() => this.settle(key), TICK_HOLD_MS),
        );
        try {
            await this.hass?.callService?.(
                "todo",
                "update_item",
                { item: item.uid, status: to ? "completed" : "needs_action" },
                { entity_id: list.entity },
            );
        } catch {
            // Home Assistant tells the user why. The item goes back to what its list says.
            this.settle(key);
        }
    }

    private settle(key: string): void {
        window.clearTimeout(this.tickTimers.get(key));
        this.tickTimers.delete(key);
        const ticking = new Map(this.ticking);
        ticking.delete(key);
        this.ticking = ticking;
    }

    protected updated(): void {
        if (!this.isConnected) {
            return;
        }
        const card = this.renderRoot.querySelector("ha-card");
        if (card) {
            this.resizes?.observe(card);
        }
        if (this.focusEditor) {
            this.focusEditor = false;
            this.renderRoot.querySelector<HTMLInputElement>(".editor .f-title")?.focus();
        }
        this.measureSoon();
    }

    /**
     * How wide the buttons on a title's row are at most on the card, in rows: a link's button, and with the texts folded
     * away, the chevron that opens one. Every row makes that room at its end, so the dates end at the same place.
     */
    private titleButtonsPx = 0;

    private measureTitleButtons(): void {
        const fold = this.textMode() === "fold";
        const items = this.lists.flatMap((list) => list.arranged?.groups.flatMap((group) => group.items) ?? []);
        this.titleButtonsPx =
            this.layoutMode() === "timeline"
                ? 0
                : Math.max(
                      0,
                      ...items.filter((item) => item.uid === undefined).map((item) => (item.link ? 28 : 0) + (fold && item.text ? 20 : 0)),
                  );
    }

    protected render(): TemplateResult | typeof nothing {
        if (!this.hass || !this.config) {
            return nothing;
        }
        this.measureTitleButtons();
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
            ${this.pill()} ${this.addButton()}
        </div>`;
    }

    private addButton(): TemplateResult | typeof nothing {
        const list = this.addTarget();
        if (!list) {
            return nothing;
        }
        return html`<button
            class="hd-add"
            title=${this.text("common.add_item")}
            aria-label=${this.text("common.add_item")}
            @click=${() => this.edit(list)}
        >
            <ha-icon icon="mdi:plus"></ha-icon>
        </button>`;
    }

    /**
     * Beside the title: how many items the first group has, with its name, when its tone says it matters, as "2 late"
     * does. Otherwise the number of items on the card that aren't done.
     */
    private pill(): TemplateResult | typeof nothing {
        // What is done is not counted.
        const groups = this.lists.flatMap((list) => list.arranged?.groups ?? []);
        const count = groups.reduce((sum, group) => sum + group.items.filter((item) => item.bucket !== "done").length, 0);
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
    private listGroups(list: Shown, index: number): TemplateResult | typeof nothing {
        if (list.loading) {
            return nothing;
        }
        const groups = list.arranged?.groups ?? [];
        const adding = this.newEditor(list.config);
        if (groups.length === 0) {
            return html`${adding}${adding === nothing ? html`<div class="empty">${this.emptyText(list)}</div>` : nothing}`;
        }
        return html`${adding}${groups.map((group) => this.group(group, `${index} ${group.key}`, index, this.clearRow(list, group)))}
        ${this.more(list, index)}`;
    }

    /** One of several lists: a group of its own, under its name. */
    private listAsGroup(list: Shown, index: number): TemplateResult {
        const items = list.arranged?.groups.flatMap((group) => group.items) ?? [];
        const group: Group = { key: "list", name: list.name, tone: "plain", items };
        const empty = list.loading
            ? nothing
            : items.length === 0
              ? html`<div class="empty">${this.emptyText(list)}</div>`
              : this.more(list, index);
        return this.group(group, `${index} list`, index, html`${empty}${this.clearRow(list, group)}`);
    }

    private emptyText(list: Shown): string {
        if (!list.arranged) {
            return this.text("common.unreadable", { entity: list.config.entity });
        }
        return list.config.empty || this.text("common.empty");
    }

    /** What the list's limit leaves out, as a row that opens it, and once opened a row that shuts it again. */
    private more(list: Shown, index: number): TemplateResult | typeof nothing {
        if (list.cut === 0 || list.config.hide_more) {
            return nothing;
        }
        const toggle = () => {
            const expanded = new Set(this.expanded);
            if (!expanded.delete(index)) {
                expanded.add(index);
            }
            this.expanded = expanded;
        };
        return html`<button class="more" aria-expanded=${list.open ? "true" : "false"} @click=${toggle}>
            ${list.open ? this.text("common.less") : this.text("common.more", { n: list.cut })}
        </button>`;
    }

    private group(group: Group, key: string, list: number, rest: TemplateResult | typeof nothing): TemplateResult {
        const items = html`<div class="items">
            ${repeat(
                group.items,
                (item) => item.key,
                (item) => this.item(item, `${list} ${item.key}`, this.lists[list].config),
            )}
        </div>`;
        if (group.name === undefined) {
            return html`<div class="grp">${items}${rest}</div>`;
        }
        if (this.headings() === "plain") {
            const clear = group.key === "done" ? this.clearButton(this.lists[list]) : nothing;
            return html`<div class="grp">
                <div class="gh"><span class="gh-name" title=${group.name}>${group.name}</span>${clear}</div>
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

    private item(item: Placed, key: string, list: ListConfig): TemplateResult {
        if (item.uid !== undefined && this.can(list, "update")) {
            return this.todoItem(item, list);
        }
        const mode = this.textMode();
        const open = this.opened.has(key);
        // A tap opens what isn't in sight: a folded text, or the rest of one cut to two lines.
        const can = Boolean(item.text) && (mode === "fold" || (mode === "clamp" && (open || this.cut.has(key))));
        const done = item.uid !== undefined && this.shownDone(list, item);
        const classes = ["item", this.layoutMode(), `tone-${item.tone}`, open && "open", can && "can", done && "done"]
            .filter(Boolean)
            .join(" ");
        const tick = item.uid === undefined ? nothing : this.tickBox(list, item, done);
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
        const text = item.text
            ? html`<div class="tx ${mode === "clamp" && !open ? "clamp" : ""}" data-key=${key}>${item.text}</div>`
            : nothing;
        const timeline = this.layoutMode() === "timeline";
        // In rows a text cut to two lines has its chevron at the end of its own row, so the title's row holds only the
        // date and its buttons, which end where every other row's do. A folded text is out of sight, so its chevron
        // stays on the title's row.
        const chevronOnTitle = timeline || mode === "fold";
        const titleButtons = [source, chevronOnTitle ? chevron : nothing].filter((part) => part !== nothing);
        const actions =
            titleButtons.length > 0 || (!timeline && this.titleButtonsPx > 0) ? html`<span class="act">${titleButtons}</span>` : nothing;
        const label = item.label ? html`<div class="lb" title=${item.label}>${item.label}</div>` : nothing;
        const when = this.whenText(item);

        if (this.layoutMode() === "timeline") {
            const extra = this.timelineWhen(item);
            const line =
                item.label || extra
                    ? html`<div class="lb" title=${[item.label, extra].filter(Boolean).join(" · ")}>
                          ${item.label ?? nothing}${item.label && extra ? " · " : nothing}${extra ? html`<span class="when">${extra}</span>` : nothing}
                      </div>`
                    : nothing;
            return html`<div class=${classes}>
                ${cover} ${this.badge(item)}
                <div class="body">
                    <div class="ti" title=${item.title}>${tick}${this.icon(item, "ti-icon")}${item.title}</div>
                    ${line} ${mode === "fold" ? this.fold(open, text) : text}
                </div>
                ${actions}
            </div>`;
        }

        const folded = mode === "fold";
        return html`<div class=${classes}>
            ${cover} ${this.accent(item)}
            <div class="line">
                <span class="ic">${tick === nothing ? this.icon(item) : tick}</span>
                <span class="ti" title=${item.title}
                    >${item.title}${folded && !open && item.label ? html`<span class="inl"> · ${item.label}</span>` : nothing}</span
                >
                ${when ? html`<span class="when" title=${this.longWhen(item)}>${when}</span>` : nothing} ${actions}
            </div>
            ${
                folded
                    ? this.fold(open, html`<div class="sub">${label}${text}</div>`)
                    : label !== nothing || text !== nothing
                      ? html`<div class="sub">
                            ${label}${chevron === nothing ? text : html`<div class="tx-row">${text}${chevron}</div>`}
                        </div>`
                      : nothing
            }
        </div>`;
    }

    /**
     * An item of a to-do list the card may change. A tap opens it in the editor, which shows its whole text, so its text
     * is cut to two lines at most and never folded. Open, the editor takes the place of its date and text.
     */
    private todoItem(item: Placed, list: ListConfig): TemplateResult {
        const editing = this.editing?.entity === list.entity && this.editing.uid === item.uid;
        const done = this.shownDone(list, item);
        // An open item has no cover, so it isn't one that lets clicks through to it, or its editor would take none.
        const classes = ["item", !editing && "can", this.layoutMode(), `tone-${item.tone}`, done && "done", editing && "editing"]
            .filter(Boolean)
            .join(" ");
        const cover = editing
            ? nothing
            : html`<button
                  class="cover"
                  aria-label=${`${this.text("common.edit_item")}: ${item.title}`}
                  @click=${() => this.edit(list, item)}
              ></button>`;
        const tick = this.tickBox(list, item, done);
        const text = item.text && !editing && this.textMode() !== "fold" ? html`<div class="tx clamp">${item.text}</div>` : nothing;
        const when = editing ? "" : this.whenText(item);
        const editor = editing ? this.editor(list) : nothing;

        if (this.layoutMode() === "timeline") {
            const extra = editing ? "" : this.timelineWhen(item);
            return html`<div class=${classes}>
                ${cover} ${this.badge(item)}
                <div class="body">
                    <div class="ti" title=${item.title}>${tick}${item.title}</div>
                    ${extra ? html`<div class="lb"><span class="when">${extra}</span></div>` : nothing} ${text} ${editor}
                </div>
            </div>`;
        }
        return html`<div class=${classes}>
            ${cover} ${this.accent(item)}
            <div class="line">
                <span class="ic">${tick}</span>
                <span class="ti" title=${item.title}>${item.title}</span>
                ${when ? html`<span class="when" title=${this.longWhen(item)}>${when}</span>` : nothing}
            </div>
            ${text !== nothing ? html`<div class="sub">${text}</div>` : nothing} ${editor}
        </div>`;
    }

    /** The editor of a new item, at the top of its list. */
    private newEditor(list: ListConfig): TemplateResult | typeof nothing {
        if (this.editing?.entity !== list.entity || this.editing.uid !== undefined) {
            return nothing;
        }
        return html`<div class="item new">${this.editor(list)}</div>`;
    }

    /** The open item's fields, those the list supports, and its buttons. Enter in the title saves, Escape closes it. */
    private editor(list: ListConfig): TemplateResult {
        const draft = this.editing!;
        const isNew = draft.uid === undefined;
        const set = (field: "title" | "text" | "day" | "time") => (event: Event) => {
            this.editing = { ...this.editing!, [field]: (event.target as HTMLInputElement).value, failed: false };
        };
        const keys = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                this.editing = undefined;
            } else if (event.key === "Enter" && (event.target as HTMLElement).classList.contains("f-title")) {
                void this.save();
            }
        };
        const field = (label: string, input: TemplateResult, classes = "") =>
            html`<label class="field ${classes}"><span>${label}</span>${input}</label>`;
        const text = this.can(list, "description")
            ? field(
                  this.text("common.edit_text"),
                  html`<textarea class="f-text" rows="2" .value=${draft.text} @input=${set("text")}></textarea>`,
              )
            : nothing;
        const days = this.can(list, "dueDate") || this.can(list, "dueDateTime");
        const day = days
            ? html`<div class="when-row">
                  ${field(this.text("common.edit_day"), html`<input class="f-day" type="date" .value=${draft.day} @input=${set("day")} />`, "grow")}
                  ${
                      this.can(list, "dueDateTime")
                          ? field(
                                this.text("common.edit_time"),
                                html`<input class="f-time" type="time" .value=${draft.time} @input=${set("time")} />`,
                            )
                          : nothing
                  }
                  ${
                      draft.day
                          ? html`<button
                                class="ibtn"
                                title=${this.text("common.clear_day")}
                                aria-label=${this.text("common.clear_day")}
                                @click=${() => (this.editing = { ...draft, day: "", time: "" })}
                            >
                                <ha-icon icon="mdi:close"></ha-icon>
                            </button>`
                          : nothing
                  }
              </div>`
            : nothing;
        const raw = this.todos.get(list.entity) ?? [];
        const moves =
            !isNew && this.can(list, "move") && ["up", "down"].some((d) => moveTarget(raw, draft.uid!, d as "up" | "down") !== null);
        const moveButton = (direction: "up" | "down") =>
            html`<button
                class="ibtn"
                ?disabled=${moveTarget(raw, draft.uid!, direction) === null}
                title=${this.text(`common.move_${direction}`)}
                aria-label=${this.text(`common.move_${direction}`)}
                @click=${() => this.move(direction)}
            >
                <ha-icon icon=${direction === "up" ? "mdi:arrow-up" : "mdi:arrow-down"}></ha-icon>
            </button>`;
        return html`<div class="editor" @keydown=${keys}>
            ${field(this.text("common.edit_title"), html`<input class="f-title" .value=${draft.title} @input=${set("title")} />`)} ${text}
            ${day} ${draft.failed ? html`<div class="failed">${this.text("common.save_failed")}</div>` : nothing}
            <div class="btns">
                ${
                    !isNew && this.can(list, "delete")
                        ? html`<button class="tbtn del" @click=${() => this.deleteItem()}>
                              <ha-icon icon="mdi:delete-outline"></ha-icon>${this.text("common.delete")}
                          </button>`
                        : nothing
                }
                ${moves ? html`${moveButton("up")}${moveButton("down")}` : nothing}
                <span class="sp"></span>
                <button class="tbtn" @click=${() => (this.editing = undefined)}>${this.text("common.cancel")}</button>
                <button class="tbtn fill" ?disabled=${!draft.title.trim()} @click=${() => this.save()}>
                    ${this.text(isNew ? "common.add" : "common.save")}
                </button>
            </div>
        </div>`;
    }

    /** "Delete done" beside the done group's heading, which asks before it deletes. */
    private clearButton(list: Shown | undefined): TemplateResult | typeof nothing {
        if (!list || !isTodoList(list.config) || !this.can(list.config, "delete")) {
            return nothing;
        }
        const entity = list.config.entity;
        const count = (this.todos.get(entity) ?? []).filter((todo) => todo.status === "completed").length;
        if (count === 0) {
            return nothing;
        }
        if (!this.asking.has(entity)) {
            return html`<button class="clear" @click=${() => this.ask(entity, true)}>${this.text("common.clear_done")}</button>`;
        }
        return html`<span class="asking">
            <span>${this.text(count === 1 ? "common.clear_done_ask_one" : "common.clear_done_ask", { n: count })}</span>
            <button class="clear del" @click=${() => this.clearDone(list.config)}>${this.text("common.delete")}</button>
            <button class="clear" @click=${() => this.ask(entity, false)}>${this.text("common.cancel")}</button>
        </span>`;
    }

    /** "Delete done" as a row of its own, where the done items have no plain heading to sit beside: under foldable headings, or among several lists. */
    private clearRow(list: Shown, group: Group): TemplateResult | typeof nothing {
        const plainDone = this.headings() === "plain" && group.key === "done" && this.lists.length === 1;
        const holdsDone = group.items.some((item) => item.bucket === "done");
        if (plainDone || !holdsDone) {
            return nothing;
        }
        const button = this.clearButton(list);
        return button === nothing ? nothing : html`<div class="clear-row">${button}</div>`;
    }

    /** The line beside an item, in its list's or calendar's colour, or the theme's primary colour when it has none. */
    private accent(item: Placed): TemplateResult {
        const color = cssColor(item.color);
        return html`<span class="acc" style=${color ? `--lc-acc: ${color}` : ""}></span>`;
    }

    /** A to-do item's round tick. On a list that can't be changed it only shows whether the item is done. */
    private tickBox(list: ListConfig, item: Placed, done: boolean): TemplateResult {
        const icon = html`<ha-icon icon="mdi:check"></ha-icon>`;
        if (!this.canTick(list)) {
            return html`<span class="tick ${done ? "on" : ""}">${icon}</span>`;
        }
        return html`<button
            class="tick ${done ? "on" : ""}"
            role="checkbox"
            aria-checked=${done ? "true" : "false"}
            aria-label=${item.title}
            title=${this.text(done ? "common.mark_open" : "common.mark_done")}
            @click=${() => this.tick(list, item)}
        >
            ${icon}
        </button>`;
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
            // One formatter writes both ends, so a period mixing a day and a time is written by its start's kind. A period
            // with times has its weekday, as a single day does.
            const options = this.dateOptions(start, end);
            return this.format(start, start.allDay ? options : { weekday: "short", ...options }).formatRange(start.time, end.time);
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

    /** A period of whole days that isn't within one month, which the badge writes as its first and last day. */
    private acrossMonths(item: Placed): boolean {
        const { start, end } = item;
        return Boolean(start?.allDay && end?.allDay && end.time > start.time && !this.sameMonthDays(item));
    }

    /**
     * When the item is, as the timeline writes it under the title: nothing when the badge says it all, and only the time
     * when the item is within the badge's one day, as a meeting from 18 to 19.30 is. A past one in a group toned as a
     * warning still says how long ago it was.
     */
    private timelineWhen(item: Placed): string {
        if (this.badgeSaysIt(item)) {
            return "";
        }
        const start = (item.start ?? item.end)!;
        const end = item.start && item.end ? item.end : undefined;
        const zone = this.timeZone();
        const day = dayOf(start, zone);
        const oneDay = !start.allDay && (!end || (!end.allDay && dayOf(end, zone) === day));
        const late = day < zoneDay(Date.now(), zone) && item.tone === "warning";
        if (!oneDay || late) {
            return this.whenText(item);
        }
        const time = this.format(start, { hour: "numeric", minute: "2-digit" });
        return end && end.time !== start.time ? time.formatRange(start.time, end.time) : time.format(start.time);
    }

    /** Whether the timeline's badge already says when the item is, so the text needn't: a plain day, or a period of whole days. */
    private badgeSaysIt(item: Placed): boolean {
        const start = item.start ?? item.end;
        if (!start) {
            return true;
        }
        if (item.start && item.end && item.end.time !== item.start.time) {
            return this.sameMonthDays(item) || this.acrossMonths(item);
        }
        const away = dayOf(start, this.timeZone()) - zoneDay(Date.now(), this.timeZone());
        return start.allDay && away !== 0 && !(away < 0 && item.tone === "warning");
    }

    /**
     * The day large, or a period's days within one month, the month under it, and the year only when it isn't this
     * year's. A period across months has no one month to stand under, so it is its first and last day, one over the other.
     */
    private badge(item: Placed): TemplateResult {
        // The line beside the item is the badge's own, so it is always as tall as the badge, whatever stands beside it.
        const line = this.accent(item);
        const start = item.start ?? item.end;
        if (!start) {
            return html`<div class="badge">
                <div class="day">–</div>
                ${line}
            </div>`;
        }
        if (this.acrossMonths(item)) {
            const date = (when: When) => this.format(when, { day: "numeric", month: "numeric" }).format(when.time);
            const endYear = this.year(item.end!);
            return html`<div class="badge" title=${this.longWhen(item)}>
                <div class="end">${date(start)}</div>
                <div class="end">${date(item.end!)}</div>
                ${endYear === this.thisYear() ? nothing : html`<div class="year">${endYear}</div>`} ${line}
            </div>`;
        }
        const day = (when: When) => this.format(when, { day: "numeric" }).format(when.time);
        const days = this.sameMonthDays(item) ? `${day(start)}–${day(item.end!)}` : day(start);
        const year = this.year(start);
        return html`<div class="badge" title=${this.longWhen(item)}>
            <div class="day">${days}</div>
            <div class="month">${this.format(start, { month: "short" }).format(start.time)}</div>
            ${year === this.thisYear() ? nothing : html`<div class="year">${year}</div>`} ${line}
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
        // The spare room as drawn now, above and below the lists, which while a slide goes on is somewhere between the old
        // and the new.
        const list = card.querySelector<HTMLElement>(":scope > .list");
        if (list) {
            const listStyle = getComputedStyle(list);
            content -= Math.max(0, px(listStyle.paddingTop) - this.listTop()) + Math.max(0, px(listStyle.paddingBottom) - LIST_BOTTOM_PX);
        }
        const filled = filledHeight(content, this.config ?? {}, limit);
        const spare = spareRoom(filled, content);
        if (filled !== this.filled) {
            this.filled = filled;
        }
        if (spare !== this.spare) {
            this.spare = spare;
        }
    }

    /**
     * The card's inline style: the height it is held to, or the rows it fills up to any limit, with their spare room.
     * Under a header the room goes between it and the lists. A card with no header is centred instead, the room split so
     * the lists stand as far from the card's top as from its bottom.
     */
    private cardStyle(): string {
        const style = [filledStyle(this.config ?? {}, this.layout, this.minimumHeight(), this.filled)];
        if (this.filled) {
            // With no header the list has as much room at its top as at its bottom, so the spare room is split in half.
            const top = this.hasHeader() ? this.spare : Math.floor(this.spare / 2);
            style.push(`--lc-spare: ${top}px`, `--lc-spare-bottom: ${this.spare - top}px`);
        }
        if (this.titleButtonsPx) {
            style.push(`--lc-title-buttons: ${this.titleButtonsPx}px`);
        }
        return style.filter(Boolean).join("; ");
    }

    private cardClass(): string {
        // Without a single icon or tick on the card, the rows give its column up.
        const icons = this.lists.some((list) => list.arranged?.groups.some((group) => group.items.some((item) => item.icon || item.uid)));
        return [
            this.heightStyle() && "held",
            this.sliding && "sliding",
            !icons && "no-icons",
            this.titleButtonsPx && "rows-buttons",
            !this.hasHeader() && "no-header",
        ]
            .filter(Boolean)
            .join(" ");
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

                /* The room a whole row leaves over goes under the header, or above and below the lists on a card with none. */
                .list {
                    flex: 1 1 auto;
                    min-height: 0;
                    padding: calc(4px + var(--lc-spare, 0px)) 0 calc(12px + var(--lc-spare-bottom, 0px));
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

                .item .src,
                .item .tick,
                .item .editor {
                    pointer-events: auto;
                }

                .tone-dimmed > :not(.cover) {
                    opacity: 0.6;
                }

                /*
                 * A dimmed badge stays solid and dims its texts, or the timeline's line would show through it. An open
                 * editor isn't dimmed either. Both rules are as strong as the one above, so they win by coming after it.
                 */
                .tone-dimmed > .badge,
                .tone-dimmed > .editor {
                    opacity: 1;
                }

                /* In the timeline the editor is inside the item's body, which an open item leaves undimmed. */
                .tone-dimmed.editing > .body {
                    opacity: 1;
                }

                .tone-dimmed > .badge > * {
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
                    justify-content: flex-end;
                    align-items: center;
                    height: 24px;
                    margin-right: -5px;
                }

                .rows-buttons .line > .act {
                    min-width: var(--lc-title-buttons);
                }

                /* A text cut to two lines, with the chevron that opens it at the end of its row. */
                .tx-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                }

                .tx-row > .tx {
                    flex: 1 1 auto;
                    min-width: 0;
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

                /* A to-do item's tick: a ring, filled in the highlight colour once done. It lies over the tap that opens the item. */
                .tick {
                    position: relative;
                    flex: none;
                    box-sizing: border-box;
                    display: inline-grid;
                    place-items: center;
                    width: 20px;
                    height: 20px;
                    margin: 2px;
                    padding: 0;
                    border: 2px solid var(--secondary-text-color);
                    border-radius: 50%;
                    background: none;
                    color: var(--card-background-color, #fff);
                    font: inherit;
                    vertical-align: top;
                    --mdc-icon-size: 15px;
                    /* The rows' 24 px line height would make the icon's box taller than the ring and sink the check to its bottom. */
                    line-height: 0;
                }

                button.tick {
                    cursor: pointer;
                }

                button.tick:focus-visible {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }

                .tick ha-icon {
                    display: flex;
                    visibility: hidden;
                }

                .tick.on {
                    border-color: var(--lc-highlight);
                    background: var(--lc-highlight);
                }

                .tick.on ha-icon {
                    visibility: visible;
                }

                /* In the timeline the tick is before the title, in its line's height. */
                .timeline .ti .tick {
                    margin: -2px 8px -2px 0;
                }

                .done .ti {
                    text-decoration: line-through;
                }

                /* The header's +, its icon ending where the pill's text does, as the item buttons' icons do. */
                .hd-add {
                    flex: none;
                    display: grid;
                    place-items: center;
                    width: 32px;
                    height: 32px;
                    margin: -4px -9px -4px -6px;
                    padding: 0;
                    border: 0;
                    border-radius: 50%;
                    background: none;
                    color: var(--secondary-text-color);
                    cursor: pointer;
                }

                .hd-add:hover,
                .ibtn:hover:not(:disabled) {
                    background: rgba(var(--rgb-primary-text-color, 33, 33, 33), 0.06);
                    color: var(--primary-color);
                }

                /* The editor, under an item's title, or at the top of the list for a new item. */
                .editor {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 8px 0 6px 34px;
                }

                .timeline .editor,
                .no-icons .editor {
                    padding-left: 0;
                }

                .item.new {
                    padding-top: 0;
                }

                .field {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    min-width: 0;
                    font-size: 11px;
                    color: var(--secondary-text-color);
                }

                .field input,
                .field textarea {
                    box-sizing: border-box;
                    width: 100%;
                    min-width: 0;
                    padding: 7px 10px;
                    font: inherit;
                    font-size: 14px;
                    color: var(--primary-text-color);
                    background: var(--input-fill-color, rgba(var(--rgb-primary-text-color, 33, 33, 33), 0.06));
                    border: 0;
                    border-bottom: 1px solid var(--secondary-text-color);
                    border-radius: 4px 4px 0 0;
                    outline: none;
                    color-scheme: inherit;
                }

                .field input:focus,
                .field textarea:focus {
                    border-bottom: 2px solid var(--primary-color);
                    padding-bottom: 6px;
                }

                .field textarea {
                    resize: vertical;
                    line-height: 18px;
                }

                .when-row {
                    display: flex;
                    align-items: flex-end;
                    gap: 8px;
                }

                .when-row .grow {
                    flex: 1 1 auto;
                }

                .when-row .ibtn {
                    margin-bottom: 2px;
                }

                .failed {
                    font-size: 13px;
                    color: var(--error-color, #db4437);
                }

                .btns {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 4px;
                    margin-right: -5px;
                }

                .btns .sp {
                    flex: 1 1 auto;
                }

                .tbtn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 12px;
                    font: inherit;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--primary-color);
                    background: none;
                    border: 0;
                    border-radius: 16px;
                    cursor: pointer;
                    --mdc-icon-size: 18px;
                }

                .tbtn.fill {
                    color: var(--text-primary-color, #fff);
                    background: var(--primary-color);
                }

                .tbtn:disabled {
                    opacity: 0.5;
                    cursor: default;
                }

                .tbtn.del {
                    padding-left: 0;
                    color: var(--error-color, #db4437);
                }

                .ibtn {
                    display: grid;
                    place-items: center;
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    border: 0;
                    border-radius: 50%;
                    background: none;
                    color: var(--secondary-text-color);
                    cursor: pointer;
                    --mdc-icon-size: 20px;
                }

                .ibtn:disabled {
                    opacity: 0.35;
                    cursor: default;
                }

                /* "Delete done", beside the done group's heading or on a row of its own, and its question. */
                .clear {
                    flex: none;
                    padding: 0;
                    font: inherit;
                    font-size: 12px;
                    font-weight: 400;
                    letter-spacing: normal;
                    text-transform: none;
                    color: var(--primary-color);
                    background: none;
                    border: 0;
                    cursor: pointer;
                }

                .clear:hover {
                    text-decoration: underline;
                }

                .clear.del {
                    font-weight: 500;
                    color: var(--error-color, #db4437);
                }

                .asking {
                    flex: none;
                    display: flex;
                    gap: 10px;
                    font-size: 12px;
                    font-weight: 400;
                    letter-spacing: normal;
                    text-transform: none;
                }

                .clear-row {
                    display: flex;
                    justify-content: flex-end;
                    padding: 2px 16px;
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

                /*
                 * The line beside an item, 12 px from what is on each side of it: the card's padding edge and the item's
                 * icon or title in rows, the badge and the text in the timeline, where it is as tall as the badge. It is
                 * placed absolutely, as a line stretched by the item would be measured at the item's height while a
                 * fold slides.
                 */
                .acc {
                    position: absolute;
                    width: 2px;
                    border-radius: 999px;
                    background: var(--lc-acc, var(--primary-color));
                    pointer-events: none;
                }

                .item.rows {
                    padding-left: 30px;
                }

                .item.rows > .acc {
                    left: 16px;
                    top: 6px;
                    bottom: 6px;
                }

                .item.timeline > .body {
                    margin-left: 14px;
                }

                .badge > .acc {
                    left: calc(100% + 12px);
                    top: 0;
                    bottom: 0;
                }

                .badge {
                    flex: none;
                    position: relative;
                    width: 52px;
                    /* Whole pixels, as its lines alone come to 35.75, and the items beside a title alone would end a fraction short. */
                    min-height: 36px;
                    box-sizing: border-box;
                    margin: 7px 0;
                    text-align: center;
                    border-radius: 6px;
                    padding: 4px 0 3px;
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

                .end {
                    font-size: 12px;
                    font-weight: 500;
                    line-height: 1.25;
                    white-space: nowrap;
                }

                .month,
                .year {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    color: var(--secondary-text-color);
                }

                /* A year is shown only when it isn't this one, and stands out, so a date a year old isn't read as this year's. */
                .year {
                    color: var(--lc-warning);
                }

                /*
                 * The title and the line under it stand centred against a badge of two lines, 36 px tall from 7 px down,
                 * so an item of one or two lines is 50 px tall, whatever its second line is, and the badges stand at
                 * even gaps. Anything more flows on below them. A title alone is centred against the badge by itself,
                 * as is a title with its text folded away. A description's line is 2 px taller than a time's, so the
                 * pair starts a pixel higher.
                 */
                .body {
                    flex: 1 1 auto;
                    min-width: 0;
                    padding: 7px 0;
                }

                .timeline .body:has(> .ti:only-child),
                .timeline .body:has(> .ti + .fold:not(.open):last-child) {
                    padding-top: 15px;
                }

                .timeline .body:has(> .ti + .tx) {
                    padding-top: 6px;
                    padding-bottom: 6px;
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

                /* The row of what the limit leaves out is a button that opens it, looking like the row it was. */
                button.more {
                    display: block;
                    width: 100%;
                    margin: 0;
                    border: 0;
                    background: none;
                    font: inherit;
                    font-size: 12px;
                    text-align: start;
                    cursor: pointer;
                }

                button.more:hover {
                    color: var(--primary-color);
                }

                button.more:focus-visible {
                    outline: 2px solid var(--primary-color);
                    outline-offset: -2px;
                    border-radius: 4px;
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
                .held .gh-name {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .held .line {
                    flex-wrap: nowrap;
                }

                .held .ti {
                    flex-basis: 0;
                }

                /* The lists scroll with no scrollbar. Their fading edges show that there is more. */
                .held .list {
                    overflow-y: auto;
                    scrollbar-width: none;
                }

                .held .list::-webkit-scrollbar {
                    display: none;
                }

                /* A card with no header has as much room above its lists as below them. */
                .no-header > .list {
                    padding-top: calc(12px + var(--lc-spare, 0px));
                }

                /*
                 * Held to a height, a card with no header centres its lists while they fit. The auto margins share the
                 * room left over, and come to nothing once the lists are taller, so they scroll from their top.
                 */
                .held.no-header > .list {
                    display: flex;
                    flex-direction: column;
                }

                .held.no-header > .list > :first-child {
                    margin-top: auto;
                }

                .held.no-header > .list > :last-child {
                    margin-bottom: auto;
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
