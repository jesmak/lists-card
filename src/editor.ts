/**
 * The card's visual editor: the title and its icon, the layout, how an item's text is shown, the group headings, the
 * lists with their sources, keys, grouping and buckets, and how the card rounds its height to the rows of a sections
 * view, and what the card may change on its to-do lists. Its height mode is set in YAML only.
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

/** A field inside the object selector takes its helper from `description`, as ha-form's computeHelper doesn't reach it. */
function listsSchema(text: Text) {
    const bucket = (name: string) => ({
        label: text(`editor.${name}`),
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
    return [
        {
            name: "lists",
            selector: {
                object: {
                    multiple: true,
                    label_field: "entity",
                    description_field: "attribute",
                    fields: {
                        entity: { label: text("editor.entity"), required: true, selector: { entity: {} } },
                        entities: {
                            label: text("editor.entities"),
                            description: text("editor.entities_helper"),
                            selector: { entity: { multiple: true, filter: { domain: "calendar" } } },
                        },
                        attribute: {
                            label: text("editor.attribute"),
                            description: text("editor.attribute_helper"),
                            selector: { text: {} },
                        },
                        path: { label: text("editor.path"), description: text("editor.path_helper"), selector: { text: {} } },
                        name: { label: text("editor.name"), description: text("editor.name_helper"), selector: { text: {} } },
                        fields: {
                            label: text("editor.fields"),
                            description: text("editor.fields_helper"),
                            selector: {
                                object: {
                                    fields: Object.fromEntries(
                                        FIELDS.map((field) => [field, { label: text(`editor.field_${field}`), selector: { text: {} } }]),
                                    ),
                                },
                            },
                        },
                        group: { label: text("editor.group"), selector: { select: select("group", GROUPINGS, text) } },
                        limit: {
                            label: text("editor.limit"),
                            description: text("editor.limit_helper"),
                            selector: { number: { min: 0, step: 1, mode: "box" } },
                        },
                        order: {
                            label: text("editor.order"),
                            description: text("editor.order_helper"),
                            selector: {
                                select: {
                                    multiple: true,
                                    reorder: true,
                                    options: BUCKETS.map((value) => ({ value, label: text(`editor.${value}`) })),
                                },
                            },
                        },
                        before: bucket("before"),
                        now: bucket("now"),
                        after: bucket("after"),
                        done: bucket("done"),
                        empty: { label: text("editor.empty"), selector: { text: {} } },
                    },
                },
            },
        },
    ];
}

/** The form's values: the config over the defaults. An option left empty in YAML is null, and shows its default. */
export function formData(config: ListsCardConfig): Record<string, unknown> {
    const set = Object.fromEntries(Object.entries(config).filter(([, value]) => value != null));
    const lists = (config.lists ?? []).map((list) => ({ ...LIST_DEFAULTS, order: BUCKETS, ...list }));
    return { ...DEFAULTS, ...set, lists };
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
    for (const key of ["attribute", "path", "name", "empty"] as const) {
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
    // Every bucket in its usual order is the default.
    if (list.order?.length && list.order.join() !== BUCKETS.join()) {
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

@customElement("lists-card-editor")
export class ListsCardEditor extends LitElement {
    @property({ attribute: false }) public hass?: HomeAssistant;
    @state() private config: ListsCardConfig = { type: "custom:lists-card", lists: [] };

    public setConfig(config: ListsCardConfig): void {
        this.config = { ...config };
    }

    protected render(): TemplateResult | typeof nothing {
        if (!this.hass) {
            return nothing;
        }
        const data = formData(rowStepData(this.config));
        const text: Text = (key) => this.text(key);
        const form = (schema: unknown) => html`
            <ha-form
                .hass=${this.hass}
                .data=${data}
                .schema=${schema}
                .computeLabel=${(entry: SchemaEntry) => this.text(`editor.${entry.name}`)}
                .computeHelper=${(entry: SchemaEntry) => this.helper(entry.name)}
                @value-changed=${this.valueChanged}
            ></ha-form>
        `;
        return html`
            ${form(lookSchema(text))} ${form(listsSchema(text))}
            <p class="helper">${this.text("editor.lists_helper")}</p>
            ${form(rowStepSchema(this.config, text))}
        `;
    }

    static get styles(): CSSResultGroup {
        return css`
            ha-form {
                display: block;
                margin-bottom: 16px;
            }

            .helper {
                margin: -8px 0 16px;
                padding: 0 16px;
                color: var(--secondary-text-color);
                font-size: 12px;
            }
        `;
    }

    private valueChanged(event: CustomEvent<{ value: ListsCardConfig }>): void {
        const config = configFromForm({ ...this.config, ...event.detail.value });
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
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
