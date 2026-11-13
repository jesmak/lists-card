import type { LovelaceCardConfig } from "./hass";
import type { RowStepConfig } from "./rows";

export type Layout = "rows" | "timeline";
export const LAYOUTS: Layout[] = ["rows", "timeline"];

/** An item's text: whole, cut to two lines, or folded away. In the last two a tap opens the item. */
export type TextMode = "full" | "clamp" | "fold";
export const TEXT_MODES: TextMode[] = ["full", "clamp", "fold"];

export type Headings = "plain" | "fold";
export const HEADINGS: Headings[] = ["plain", "fold"];

/** What a card may change on its to-do lists. */
export type Editing = "full" | "tick" | "none";
export const EDITING: Editing[] = ["full", "tick", "none"];

/** What a list's groups are made from: its items' dates, one of their keys, or nothing. */
export type Grouping = "time" | "key" | "month" | "none";
export const GROUPINGS: Grouping[] = ["time", "key", "month", "none"];

/** Where an item's dates put it: over, going on today, or still to come. A ticked to-do item is done, whatever its dates. */
export type Bucket = "before" | "now" | "after" | "done";
export const BUCKETS: Bucket[] = ["before", "now", "after", "done"];

export type Tone = "plain" | "warning" | "highlight" | "dimmed";
export const TONES: Tone[] = ["plain", "warning", "highlight", "dimmed"];

export interface BucketConfig {
    /** The bucket's heading, in place of the card's own. */
    name?: string;
    tone?: Tone;
    /** How many days back (before) or ahead (after) the bucket reaches. Items further away are left out. */
    days?: number;
    /** The items furthest from today first, where the nearest usually are: the most overdue task rather than the latest. */
    farthest_first?: boolean;
}

/** The card's fields, each the key of an item that holds it. A key may be a path, such as `attributes.title`. */
export interface FieldMap {
    id?: string;
    title?: string;
    text?: string;
    start?: string;
    end?: string;
    label?: string;
    icon?: string;
    link?: string;
    group?: string;
}
export const FIELDS: Array<keyof FieldMap> = ["title", "text", "start", "end", "label", "icon", "link", "group", "id"];

/** One list of the card: where its items are, which of their keys the card reads, and how they are grouped. */
export interface ListConfig {
    entity: string;
    /** More calendars whose events are merged into a calendar's list, such as the public holidays. */
    entities?: string[];
    /** The attribute that holds the items. Without one they are read from the state, as JSON. */
    attribute?: string;
    /** A path to the items inside the attribute, such as `data.items`, when they aren't at its top. */
    path?: string;
    /** The list's heading on a card with several lists, in place of the entity's name. */
    name?: string;
    fields?: FieldMap;
    group?: Grouping;
    /** The most items shown. The card says how many were left out, unless `hide_more` is set. */
    limit?: number;
    /** No row saying how many the limit left out, so the list is only its first items. */
    hide_more?: boolean;
    before?: BucketConfig;
    now?: BucketConfig;
    after?: BucketConfig;
    done?: BucketConfig;
    /** The buckets in the order they are shown. One left out is not shown at all. */
    order?: Bucket[];
    /** What the card says when the list has no items, in place of its own text. */
    empty?: string;
}

export interface ListsCardConfig extends LovelaceCardConfig, RowStepConfig {
    lists: ListConfig[];
    title?: string;
    /** An icon before the title. */
    icon?: string;
    layout?: Layout;
    text?: TextMode;
    headings?: Headings;
    /** What the card may change on a to-do list: everything, only whether an item is ticked, or nothing. */
    editing?: Editing;
}

/** A date of an item: an instant, or a whole day held as that day's midnight in UTC. */
export interface When {
    time: number;
    allDay: boolean;
}

/** One item of a list, as the card reads it. */
export interface Item {
    /** Unique within its list: the item's id, else its title and dates, with a number after it when another item has the same. */
    key: string;
    title: string;
    text?: string;
    start?: When;
    end?: When;
    label?: string;
    /** An icon's name with its set, such as `mdi:home`, or any other short text, such as an emoji. */
    icon?: string;
    link?: string;
    group?: string;
    /** A to-do item's own id, which ticking it names, and whether it is done. Other items have neither. */
    uid?: string;
    done?: boolean;
}

/** An item of a to-do list, as Home Assistant's `todo/item/subscribe` gives it. */
export interface TodoItem {
    uid: string;
    summary: string;
    status: "needs_action" | "completed" | null;
    description?: string | null;
    /** A day, or a time with its date. */
    due?: string | null;
    /** When the item was ticked, where the list keeps it. */
    completed?: string | null;
}

/** An event of a calendar, as Home Assistant's `calendar/event/subscribe` gives it. */
export interface CalendarEvent {
    summary: string;
    /** A day, or a time with its date. A whole day's end is the day after it. */
    start: string;
    end: string;
    description?: string | null;
    location?: string | null;
    uid?: string | null;
    /** Which of a repeating event's times this is. The times share the uid. */
    recurrence_id?: string | null;
    all_day?: boolean;
}

/** An item with the bucket its dates put it in, and that bucket's tone. */
export interface Placed extends Item {
    bucket: Bucket;
    tone: Tone;
}

export interface Group {
    key: string;
    /** The group's heading. A group without one has none. */
    name?: string;
    tone: Tone;
    items: Placed[];
}

/** A list as it is shown: its groups in order, and how many items its limit left out. */
export interface Arranged {
    groups: Group[];
    hidden: number;
}
