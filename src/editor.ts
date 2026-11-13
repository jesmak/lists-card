/**
 * The card's visual editor: the title and its icon, the layout, how an item's text is shown, the group headings, what the
 * card may change on its to-do lists, its lists, and how the card rounds its height to the rows of a sections view. Each
 * list is a row that opens a page of its own, with the fields that list's kind can use: a calendar's, a to-do list's or
 * an entity attribute's. Its height mode is set in YAML only.
 */
import { LitElement, css, html, nothing } from "lit";
import type { CSSResultGroup, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { HomeAssistant } from "./hass";
import { browserLanguage, translate } from "./localize/localize";
import { DEFAULT_TONES } from "./lists";
import { rowStepData, rowStepSchema, tidyRowStep } from "./rows";
import { BUCKETS, EDITING, FIELDS, GROUPINGS, HEADINGS, LAYOUTS, TEXT_MODES, TONES } from "./types";
import type { BucketConfig, FieldMap, ListConfig, ListsCardConfig } from "./types";

interface SchemaEntry {
    name: string;
}

type Text = (key: string) => string;

const DEFAULTS: Record<string, unknown> = { layout: "rows", text: "clamp", headings: "plain", editing: "full" };
const LIST_DEFAULTS: Record<string, unknown> = { group: "time", limit: 0 };

const select = (name: string, values: readonly string[], text: Text) => ({
    mode: "dropdown",
    options: values.map((value) => ({ value, label: text(`editor.${name}_${value}`) })),
});

function lookSchema(text: Text) {
    return [
        {
            type: "grid",
            name: "",
            schema: [
                { name: "title", selector: { text: {} } },
                { name: "icon", selector: { icon: {} } },
            ],
        },
        { name: "layout", selector: { select: select("layout", LAYOUTS, text) } },
        { name: "text", selector: { select: select("text", TEXT_MODES, text) } },
        { name: "headings", selector: { select: select("headings", HEADINGS, text) } },
        { name: "editing", selector: { select: select("editing", EDITING, text) } },
    ];
}

/** What a list reads: a calendar's events, a to-do list's items, or an entity's attribute or state. */
export type ListKind = "calendar" | "todo" | "attribute";

export function listKind(list: Partial<ListConfig>): ListKind {
    const entity = list.entity ?? "";
    if (!list.attribute && entity.startsWith("calendar.")) {
        return "calendar";
    }
    if (!list.attribute && entity.startsWith("todo.")) {
        return "todo";
    }
    return "attribute";
}

/** The time groups a list of this kind can have. Only a to-do list has done items. */
const bucketsOf = (kind: ListKind) => (kind === "todo" ? BUCKETS : BUCKETS.filter((bucket) => bucket !== "done"));

/**
 * The fields of one list's page, those its kind can use. A field inside an object selector takes its helper from
 * `description`, as ha-form's computeHelper doesn't reach it.
 */
/**
 * The attributes of an entity that can't hold a list as they are now: those that are neither a list nor an object, nor
 * text that reads as JSON. An object stays on offer, as a list may be deeper inside it, reached with a path. Only the
 * value at the moment is known, so an attribute that is empty now is left out too, and the picker takes a name typed in.
 */
export function notListAttributes(attributes: Record<string, unknown> | undefined): string[] {
    const holdsList = (value: unknown) => {
        if (value !== null && typeof value === "object") {
            return true;
        }
        if (typeof value !== "string" || !/^\s*[[{]/.test(value)) {
            return false;
        }
        try {
            return typeof JSON.parse(value) === "object";
        } catch {
            return false;
        }
    };
    return Object.entries(attributes ?? {})
        .filter(([, value]) => !holdsList(value))
        .map(([name]) => name);
}

export function listSchema(kind: ListKind, text: Text, hiddenAttributes: string[] = []) {
    const bucket = (name: string) => ({
        name,
        selector: {
            object: {
                fields: {
                    name: { label: text("editor.bucket_name"), selector: { text: {} } },
                    tone: { label: text("editor.bucket_tone"), selector: { select: select("tone", TONES, text) } },
                    days: {
                        label: text("editor.bucket_days"),
                        description: text("editor.bucket_days_helper"),
                        selector: { number: { min: 0, step: 1, mode: "box" } },
                    },
                    farthest_first: {
                        label: text("editor.bucket_farthest_first"),
                        description: text("editor.bucket_farthest_first_helper"),
                        selector: { boolean: {} },
                    },
                },
            },
        },
    });
    const groupings = GROUPINGS.filter((grouping) => grouping !== "key" || kind === "attribute");
    return [
        { name: "entity", required: true, selector: { entity: {} } },
        ...(kind === "calendar" ? [{ name: "entities", selector: { entity: { multiple: true, filter: { domain: "calendar" } } } }] : []),
        ...(kind === "attribute"
            ? [
                  // Home Assistant's own attribute picker, offering the attributes of the entity picked above.
                  {
                      name: "attribute",
                      selector: { attribute: { hide_attributes: hiddenAttributes } },
                      context: { filter_entity: "entity" },
                  },
                  { name: "path", selector: { text: {} } },
              ]
            : []),
        { name: "name", selector: { text: {} } },
        ...(kind === "attribute"
            ? [
                  {
                      name: "fields",
                      selector: {
                          object: {
                              fields: Object.fromEntries(
                                  FIELDS.map((field) => [field, { label: text(`editor.field_${field}`), selector: { text: {} } }]),
                              ),
                          },
                      },
                  },
              ]
            : []),
        { name: "group", selector: { select: select("group", groupings, text) } },
        { name: "limit", selector: { number: { min: 0, step: 1, mode: "box" } } },
        { name: "hide_more", selector: { boolean: {} } },
        {
            name: "order",
            selector: {
                select: {
                    multiple: true,
                    reorder: true,
                    options: bucketsOf(kind).map((value) => ({ value, label: text(`editor.${value}`) })),
                },
            },
        },
        ...bucketsOf(kind).map(bucket),
        { name: "empty", selector: { text: {} } },
    ];
}

/** A list's page values: the list over its kind's defaults. */
export function listFormData(list: ListConfig): Record<string, unknown> {
    return { ...LIST_DEFAULTS, order: bucketsOf(listKind(list)), ...list };
}

/** The form's values: the config over the defaults. An option left empty in YAML is null, and shows its default. */
export function formData(config: ListsCardConfig): Record<string, unknown> {
    // The lists have a section of their own, not a field of the card's form.
    const set = Object.fromEntries(Object.entries(config).filter(([name, value]) => value != null && name !== "lists"));
    return { ...DEFAULTS, ...set };
}

// A switch left off is the same as one never touched.
const blank = (value: unknown) => value === undefined || value === null || value === "" || value === false;

/** An object without its blank values, or undefined when nothing is left. */
function tidy<T extends object>(value: T | undefined): T | undefined {
    const entries = Object.entries(value ?? {}).filter(([, v]) => !blank(v));
    return entries.length > 0 ? (Object.fromEntries(entries) as T) : undefined;
}

/** A list as the configuration keeps it: blank values and defaults left out, so it stays as short as one written by hand. */
export function tidyList(list: ListConfig): ListConfig {
    const tidied: Record<string, unknown> = { entity: list.entity };
    for (const key of ["attribute", "path", "name", "empty", "hide_more"] as const) {
        if (!blank(list[key])) {
            tidied[key] = list[key];
        }
    }
    const entities = (list.entities ?? []).filter((entity) => entity && entity !== list.entity);
    if (entities.length > 0) {
        tidied.entities = entities;
    }
    const fields = tidy<FieldMap>(list.fields);
    if (fields) {
        tidied.fields = fields;
    }
    if (list.group && list.group !== LIST_DEFAULTS.group) {
        tidied.group = list.group;
    }
    if (list.limit) {
        tidied.limit = list.limit;
    }
    // Every bucket the list's kind has, in its usual order, is the default.
    if (list.order?.length && list.order.join() !== BUCKETS.join() && list.order.join() !== bucketsOf(listKind(list)).join()) {
        tidied.order = list.order;
    }
    for (const bucket of BUCKETS) {
        const config = tidy<BucketConfig>(list[bucket]);
        if (config && !(Object.keys(config).length === 1 && config.tone === DEFAULT_TONES[bucket])) {
            tidied[bucket] = config;
        }
    }
    return tidied as unknown as ListConfig;
}

/** The form's values as the card's configuration, with empty values and defaults left out. */
export function configFromForm(value: ListsCardConfig): ListsCardConfig {
    const config: ListsCardConfig = tidyRowStep(value);
    config.lists = (config.lists ?? []).filter((list) => list?.entity).map(tidyList);
    for (const key of ["title", "icon"]) {
        if (!config[key]) {
            delete config[key];
        }
    }
    for (const [key, defaultValue] of Object.entries(DEFAULTS)) {
        if (config[key] === defaultValue || blank(config[key])) {
            delete config[key];
        }
    }
    return config;
}

const KIND_ICONS: Record<ListKind, string> = {
    calendar: "mdi:calendar",
    todo: "mdi:checkbox-marked-circle-outline",
    attribute: "mdi:format-list-bulleted",
};

@customElement("lists-card-editor")
export class ListsCardEditor extends LitElement {
    @property({ attribute: false }) public hass?: HomeAssistant;
    @state() private config: ListsCardConfig = { type: "custom:lists-card", lists: [] };
    /** The list whose own page is open, by its place on the card. */
    @state() private open?: number;

    public setConfig(config: ListsCardConfig): void {
        this.config = { ...config };
        if (this.open !== undefined && this.open >= (config.lists?.length ?? 0)) {
            this.open = undefined;
        }
    }

    protected render(): TemplateResult | typeof nothing {
        if (!this.hass) {
            return nothing;
        }
        const lists = this.config.lists ?? [];
        if (this.open !== undefined && lists[this.open]) {
            return this.listPage(lists[this.open], this.open);
        }
        const text: Text = (key) => this.text(key);
        return html`
            ${this.form(formData(rowStepData(this.config)), lookSchema(text), this.valueChanged)}
            <div class="lists">
                <div class="lists-title">${this.text("editor.lists")}</div>
                ${lists.map((list, index) => this.listRow(list, index, lists.length))}
                ${this.form({}, [{ name: "add_list", selector: { entity: {} } }], this.addList)}
                <p class="helper">${this.text("editor.lists_helper")}</p>
            </div>
            ${this.form(formData(rowStepData(this.config)), rowStepSchema(this.config, text), this.valueChanged)}
        `;
    }

    private form(data: Record<string, unknown>, schema: unknown, changed: (event: CustomEvent) => void, kind?: ListKind): TemplateResult {
        // Only a to-do list's page says what its done group holds.
        const helper = (name: string) => this.helper(name === "order" && kind === "todo" ? "order_todo" : name);
        return html`<ha-form
            .hass=${this.hass}
            .data=${data}
            .schema=${schema}
            .computeLabel=${(entry: SchemaEntry) => this.text(`editor.${entry.name}`)}
            .computeHelper=${(entry: SchemaEntry) => helper(entry.name)}
            @value-changed=${changed}
        ></ha-form>`;
    }

    /** A list's row: what it reads, its name, and buttons that move it, open its page and delete it. */
    private listRow(list: ListConfig, index: number, count: number): TemplateResult {
        const state = this.hass?.states[list.entity];
        const name = list.name || (state?.attributes.friendly_name as string | undefined) || list.entity;
        const button = (icon: string, label: string, action: () => void, disabled = false) =>
            html`<button class="icon-button" title=${label} aria-label=${label} ?disabled=${disabled} @click=${action}>
                <ha-icon icon=${icon}></ha-icon>
            </button>`;
        return html`<div class="list-row">
            <ha-icon class="kind" icon=${KIND_ICONS[listKind(list)]}></ha-icon>
            <div class="list-name">
                <div>${name}</div>
                ${name !== list.entity ? html`<div class="list-entity">${list.entity}</div>` : nothing}
            </div>
            ${
                count > 1
                    ? html`${button("mdi:arrow-up", this.text("editor.move_up"), () => this.moveList(index, -1), index === 0)}
                      ${button("mdi:arrow-down", this.text("editor.move_down"), () => this.moveList(index, 1), index === count - 1)}`
                    : nothing
            }
            ${button("mdi:pencil", this.text("editor.edit_list"), () => (this.open = index))}
            ${button("mdi:delete-outline", this.text("editor.delete_list"), () => this.setLists(this.lists().filter((_, i) => i !== index)))}
        </div>`;
    }

    /** A list's own page, with the fields its kind can use, and a way back to the card's settings. */
    private listPage(list: ListConfig, index: number): TemplateResult {
        const text: Text = (key) => this.text(key);
        const state = this.hass?.states[list.entity];
        const name = list.name || (state?.attributes.friendly_name as string | undefined) || list.entity;
        const changed = (event: CustomEvent<{ value: ListConfig }>) => {
            const lists = this.lists();
            lists[index] = event.detail.value;
            this.setLists(lists);
        };
        return html`
            <div class="page-head">
                <button
                    class="icon-button"
                    title=${this.text("editor.back")}
                    aria-label=${this.text("editor.back")}
                    @click=${() => (this.open = undefined)}
                >
                    <ha-icon icon="mdi:arrow-left"></ha-icon>
                </button>
                <ha-icon class="kind" icon=${KIND_ICONS[listKind(list)]}></ha-icon>
                <div class="page-title">${name}</div>
            </div>
            ${this.form(
                listFormData(list),
                listSchema(
                    listKind(list),
                    text,
                    // The list's own attribute stays on offer even when it holds nothing at the moment.
                    notListAttributes(this.hass?.states[list.entity]?.attributes).filter((name) => name !== list.attribute),
                ),
                changed,
                listKind(list),
            )}
        `;
    }

    private lists(): ListConfig[] {
        return [...(this.config.lists ?? [])];
    }

    private moveList(index: number, by: number): void {
        const lists = this.lists();
        const [list] = lists.splice(index, 1);
        lists.splice(index + by, 0, list);
        this.setLists(lists);
    }

    /** A list added by picking its entity, its page opened at once. */
    private readonly addList = (event: CustomEvent<{ value: { add_list?: string } }>): void => {
        const entity = event.detail.value.add_list;
        if (!entity) {
            return;
        }
        const lists = [...this.lists(), { entity }];
        this.setLists(lists);
        this.open = lists.length - 1;
    };

    private setLists(lists: ListConfig[]): void {
        this.emit({ ...this.config, lists });
    }

    private readonly valueChanged = (event: CustomEvent<{ value: ListsCardConfig }>): void => {
        this.emit({ ...this.config, ...event.detail.value, lists: this.lists() });
    };

    private emit(value: ListsCardConfig): void {
        const config = configFromForm(value);
        this.config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
    }

    static get styles(): CSSResultGroup {
        return css`
            ha-form {
                display: block;
                margin-bottom: 16px;
            }

            .helper {
                margin: 4px 0 16px;
                padding: 0 16px;
                color: var(--secondary-text-color);
                font-size: 12px;
            }

            .lists-title {
                margin: 0 0 8px;
                font-weight: 500;
            }

            .list-row {
                display: flex;
                align-items: center;
                gap: 8px;
                min-height: 48px;
                padding: 0 4px 0 12px;
                margin-bottom: 8px;
                border: 1px solid var(--divider-color);
                border-radius: var(--ha-card-border-radius, 12px);
            }

            .kind {
                flex: none;
                color: var(--secondary-text-color);
            }

            .list-name {
                flex: 1 1 auto;
                min-width: 0;
                overflow-wrap: anywhere;
            }

            .list-entity {
                font-size: 12px;
                color: var(--secondary-text-color);
            }

            .icon-button {
                flex: none;
                display: grid;
                place-items: center;
                width: 40px;
                height: 40px;
                padding: 0;
                border: 0;
                border-radius: 50%;
                background: none;
                color: var(--primary-text-color);
                cursor: pointer;
            }

            .icon-button:hover:not(:disabled) {
                background: rgba(var(--rgb-primary-text-color, 33, 33, 33), 0.06);
            }

            .icon-button:disabled {
                opacity: 0.35;
                cursor: default;
            }

            .page-head {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0 0 16px -8px;
            }

            .page-title {
                font-size: 18px;
                overflow-wrap: anywhere;
            }
        `;
    }

    private text(key: string): string {
        return translate(this.language(), key);
    }

    private helper(name: string): string | undefined {
        const key = `editor.${name}_helper`;
        const helper = translate(this.language(), key);
        return helper === key ? undefined : helper;
    }

    private language(): string {
        return this.hass?.locale?.language ?? this.hass?.language ?? browserLanguage();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "lists-card-editor": ListsCardEditor;
    }
}
