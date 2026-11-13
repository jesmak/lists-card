/**
 * Changing a to-do list's items: what a list lets be changed, an edited item as the action's data, and where an item
 * moved one row up or down lands. The card draws and calls, this only works out what to send.
 */
import type { TodoItem } from "./types";

/** Home Assistant's to-do list features, as `supported_features` holds them. */
export const TODO_FEATURES = {
    create: 1,
    delete: 2,
    update: 4,
    move: 8,
    dueDate: 16,
    dueDateTime: 32,
    description: 64,
} as const;

export type TodoFeature = keyof typeof TODO_FEATURES;

export function hasFeature(features: number, feature: TodoFeature): boolean {
    return (features & TODO_FEATURES[feature]) !== 0;
}

/** An item as it is being written: a new one has no uid. The day is `YYYY-MM-DD` and the time `HH:MM`, either may be blank. */
export interface Draft {
    entity: string;
    uid?: string;
    title: string;
    text: string;
    day: string;
    time: string;
}

/** The draft of an item already on the list, its due day and time split as the editor's fields hold them. */
export function draftOf(entity: string, item: TodoItem): Draft {
    const due = item.due ?? "";
    const [day, rest = ""] = due.split("T");
    return { entity, uid: item.uid, title: item.summary, text: item.description ?? "", day, time: rest.slice(0, 5) };
}

/**
 * The due day or time as `todo.add_item` and `todo.update_item` take it. A time without a day is nothing, and a list
 * that takes only times gets the day's midnight. A day taken away from an item that had one is sent as null.
 */
function dueData(draft: Draft, features: number, had: boolean): Record<string, unknown> {
    if (!draft.day) {
        return had ? { due_date: null } : {};
    }
    const time = hasFeature(features, "dueDateTime") ? draft.time : "";
    if (time || !hasFeature(features, "dueDate")) {
        // Without a zone, Home Assistant reads the time in its own.
        return { due_datetime: `${draft.day} ${time || "00:00"}:00` };
    }
    return { due_date: draft.day };
}

/** The data of `todo.add_item` for a new item, or of `todo.update_item` for one on the list, with only what the list supports. */
export function saveData(draft: Draft, features: number, before?: TodoItem): Record<string, unknown> {
    const data: Record<string, unknown> = before ? { item: draft.uid, rename: draft.title.trim() } : { item: draft.title.trim() };
    if (hasFeature(features, "description")) {
        const text = draft.text.trim();
        if (text || before?.description) {
            data.description = text;
        }
    }
    if (hasFeature(features, "dueDate") || hasFeature(features, "dueDateTime")) {
        Object.assign(data, dueData(draft, features, Boolean(before?.due)));
    }
    return data;
}

/** An item that can be moved by hand: one with no due day that isn't done, as the card sorts the rest by their dates. */
const movable = (item: TodoItem) => !item.due && item.status !== "completed";

/**
 * Where an item lands when it is moved one row up or down among the movable items, as `todo/item/move`'s
 * `previous_uid`, the item it is put after: undefined for the top of the list, and null when it can't go that way.
 */
export function moveTarget(items: TodoItem[], uid: string, direction: "up" | "down"): string | undefined | null {
    const rows = items.filter(movable);
    const at = rows.findIndex((item) => item.uid === uid);
    if (at < 0) {
        return null;
    }
    if (direction === "down") {
        return at + 1 < rows.length ? rows[at + 1].uid : null;
    }
    if (at === 0) {
        return null;
    }
    // Up: just before the row above, so after whatever is before that row in the whole list.
    const above = items.findIndex((item) => item.uid === rows[at - 1].uid);
    return above > 0 ? items[above - 1].uid : undefined;
}
