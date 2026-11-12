/**
 * Reading a list's items from its entity, and arranging them for the card.
 *
 * The items are a list of objects in an attribute, a list nested deeper inside it, an object keyed by id, or any of
 * those as JSON text in an attribute or in the state. Which of an item's keys the card reads is set per list. Arranged,
 * the items are in their buckets' order (over, going on today, to come), cut to the list's limit, and split into groups.
 */
import type { HassEntity } from "./hass";
import { BUCKETS, GROUPINGS, TONES } from "./types";
import type { Arranged, Bucket, FieldMap, Group, Item, ListConfig, Placed, Tone, When } from "./types";

const DAY_MS = 86_400_000;

/** The value at a dotted path, such as `data.items` or `attributes.title`. A number steps into a list. */
export function dig(value: unknown, path: string | undefined): unknown {
    if (!path) {
        return value;
    }
    for (const part of path.split(".")) {
        if (value === null || typeof value !== "object") {
            return undefined;
        }
        value = (value as Record<string, unknown>)[part];
    }
    return value;
}

function parsed(value: unknown): unknown {
    if (typeof value !== "string") {
        return value;
    }
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
}

/**
 * A date as the card understands it: a day (`2026-03-01`, `1.3.2026`), a time with its date in a form JavaScript reads,
 * or a number of seconds or milliseconds since the epoch. A text without a four-digit year is not a date, as JavaScript
 * would make one up for it.
 */
export function parseWhen(value: unknown): When | undefined {
    if (typeof value === "number") {
        // Seconds until the year 5138, milliseconds from 1973 on.
        return Number.isFinite(value) ? { time: value < 1e11 ? value * 1000 : value, allDay: false } : undefined;
    }
    if (typeof value !== "string") {
        return undefined;
    }
    const text = value.trim();
    const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text) ?? /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text);
    if (day) {
        const [year, month, date] = day[1].length === 4 ? [day[1], day[2], day[3]] : [day[3], day[2], day[1]];
        const time = Date.UTC(Number(year), Number(month) - 1, Number(date));
        // A day that doesn't exist, such as the 31st of February, rolls over into another.
        return new Date(time).getUTCDate() === Number(date) ? { time, allDay: true } : undefined;
    }
    const time = /\d{4}/.test(text) ? Date.parse(text) : NaN;
    return Number.isNaN(time) ? undefined : { time, allDay: false };
}

/** A text without its HTML: the tags gone, the entities read, each paragraph's end a space. */
export function plainText(value: string): string {
    if (!/[<&]/.test(value)) {
        return value.replace(/\s+/g, " ").trim();
    }
    const spaced = value.replace(/<\/(p|div|li|h\d|tr)>|<br\s*\/?>/gi, " $&");
    const text = new DOMParser().parseFromString(spaced, "text/html").body.textContent ?? "";
    return text.replace(/\s+/g, " ").trim();
}

function text(value: unknown): string | undefined {
    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** The link when it is an absolute http or https address. The items are outside data, and a `javascript:` link would run. */
function webLink(value: unknown): string | undefined {
    const link = text(value);
    if (!link) {
        return undefined;
    }
    try {
        return ["http:", "https:"].includes(new URL(link).protocol) ? link : undefined;
    } catch {
        return undefined;
    }
}

function readItem(raw: unknown, fields: FieldMap, fallbackId: string | undefined): Item | undefined {
    // A list of plain texts or numbers is a list of titles.
    const source = raw !== null && typeof raw === "object" ? (raw as Record<string, unknown>) : { [fields.title ?? "title"]: raw };
    const field = (name: keyof FieldMap) => dig(source, fields[name] ?? name);
    const title = text(field("title"));
    if (!title) {
        return undefined;
    }
    const item: Item = { key: "", title: plainText(title) };
    const body = text(field("text"));
    if (body) {
        item.text = plainText(body);
    }
    item.start = parseWhen(field("start"));
    item.end = parseWhen(field("end"));
    item.label = text(field("label"));
    item.icon = text(field("icon"));
    item.link = webLink(field("link"));
    item.group = text(field("group"));
    item.key = text(field("id")) ?? fallbackId ?? [item.title, item.start?.time ?? "", item.end?.time ?? ""].join("|");
    return item;
}

/**
 * The list's items in their source's order, or undefined when the entity or its items can't be read: no such entity or
 * attribute, text that isn't JSON, or something that is neither a list nor an object. Items without a title are left out.
 */
export function readItems(state: HassEntity | undefined, list: ListConfig): Item[] | undefined {
    if (!state) {
        return undefined;
    }
    const source = dig(parsed(list.attribute ? state.attributes[list.attribute] : state.state), list.path);
    if (source === null || typeof source !== "object") {
        return undefined;
    }
    const fields = list.fields ?? {};
    const items = Array.isArray(source)
        ? source.map((raw) => readItem(raw, fields, undefined))
        : Object.entries(source).map(([id, raw]) => readItem(raw, fields, id));
    // A key seen before gets a number after it, so two items alike, or two with the same id, stay two.
    const seen = new Map<string, number>();
    return items
        .filter((item): item is Item => item !== undefined)
        .map((item) => {
            const count = seen.get(item.key) ?? 0;
            seen.set(item.key, count + 1);
            return count === 0 ? item : { ...item, key: `${item.key} #${count + 1}` };
        });
}

/** A time's day in a time zone, the browser's when none is given, as days since the epoch. */
export function zoneDay(time: number, timeZone?: string): number {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(time);
    const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    return Date.UTC(part("year"), part("month") - 1, part("day")) / DAY_MS;
}

export const dayOf = (when: When, timeZone?: string) => (when.allDay ? Math.round(when.time / DAY_MS) : zoneDay(when.time, timeZone));

/** The first and last day of an item, or undefined for one with no date. */
function span(item: Item, timeZone?: string): [number, number] | undefined {
    const start = item.start ?? item.end;
    const end = item.end ?? item.start;
    return start && end ? [dayOf(start, timeZone), dayOf(end, timeZone)] : undefined;
}

/** Over when its last day is before today, to come when its first is after, otherwise going on. An item with no date is going on. */
export function bucketOf(item: Item, today: number, timeZone?: string): Bucket {
    const days = span(item, timeZone);
    if (!days) {
        return "now";
    }
    return days[1] < today ? "before" : days[0] > today ? "after" : "now";
}

export function validList(list: unknown): list is ListConfig {
    const config = list as ListConfig | null;
    const bucket = (value: unknown) => {
        const b = value as { tone?: Tone; days?: unknown; farthest_first?: unknown } | null | undefined;
        return (
            b == null ||
            (typeof b === "object" &&
                (b.tone == null || TONES.includes(b.tone)) &&
                (b.days == null || count(b.days)) &&
                (b.farthest_first == null || typeof b.farthest_first === "boolean"))
        );
    };
    const count = (value: unknown) => typeof value === "number" && Number.isInteger(value) && value >= 0;
    const textOrUnset = (value: unknown) => value == null || typeof value === "string";
    return (
        config !== null &&
        typeof config === "object" &&
        typeof config.entity === "string" &&
        config.entity !== "" &&
        textOrUnset(config.attribute) &&
        textOrUnset(config.path) &&
        textOrUnset(config.name) &&
        textOrUnset(config.empty) &&
        (config.fields == null || (typeof config.fields === "object" && Object.values(config.fields).every(textOrUnset))) &&
        (config.group == null || GROUPINGS.includes(config.group)) &&
        (config.limit == null || count(config.limit)) &&
        (config.order == null || (Array.isArray(config.order) && config.order.every((b) => BUCKETS.includes(b)))) &&
        bucket(config.before) &&
        bucket(config.now) &&
        bucket(config.after)
    );
}

/**
 * The items as the list shows them. They come in the buckets' order, those nearest today first within a bucket: the
 * latest of what is over, the soonest of what is to come. A bucket can ask for the furthest first instead. Items beyond a bucket's reach, or in a bucket left out of the
 * order, are dropped, and what the limit cuts off is counted. `names` are the buckets' headings when the list sets
 * none. On a card with several lists (`whole`) a list is one group, as the card's headings are then the lists.
 */
export function arrange(
    items: Item[],
    list: ListConfig,
    now: number,
    names: Record<Bucket, string>,
    { timeZone, whole = false }: { timeZone?: string; whole?: boolean } = {},
): Arranged {
    const today = zoneDay(now, timeZone);
    const order = list.order?.length ? list.order : BUCKETS;
    const placed: Array<{ item: Placed; index: number; near: number; undated: boolean }> = [];
    items.forEach((item, index) => {
        const bucket = bucketOf(item, today, timeZone);
        const days = span(item, timeZone);
        const away = !days || bucket === "now" ? 0 : bucket === "before" ? today - days[1] : days[0] - today;
        const reach = list[bucket]?.days;
        if (!order.includes(bucket) || (reach != null && away > reach)) {
            return;
        }
        // Within a bucket: what is over by its end, the latest first, the rest by their start, the soonest first. A bucket
        // may turn that round. Items with no date come after the dated ones either way, in the source's order.
        const nearest = bucket === "before" ? -(item.end ?? item.start)!.time : ((item.start ?? item.end)?.time ?? 0);
        const near = list[bucket]?.farthest_first ? -nearest : nearest;
        placed.push({ item: { ...item, bucket, tone: list[bucket]?.tone ?? "plain" }, index, near: days ? near : 0, undated: !days });
    });
    placed.sort(
        (a, b) =>
            order.indexOf(a.item.bucket) - order.indexOf(b.item.bucket) ||
            Number(a.undated) - Number(b.undated) ||
            a.near - b.near ||
            a.index - b.index,
    );
    const shown = (list.limit ? placed.slice(0, list.limit) : placed).map(({ item }) => item);

    const grouping = whole ? "none" : (list.group ?? "time");
    const groups: Group[] = [];
    if (grouping === "none") {
        groups.push({ key: "all", tone: "plain", items: shown });
    } else {
        for (const item of shown) {
            const key = grouping === "time" ? item.bucket : (item.group ?? "");
            let group = groups.find((g) => g.key === key);
            if (!group) {
                const name = grouping === "time" ? list[item.bucket]?.name || names[item.bucket] : item.group;
                group = { key, name, tone: grouping === "time" ? item.tone : "plain", items: [] };
                groups.push(group);
            }
            group.items.push(item);
        }
    }
    return { groups: groups.filter((group) => group.items.length > 0), hidden: placed.length - shown.length };
}
