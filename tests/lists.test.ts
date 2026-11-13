import { describe, expect, it } from "vitest";

import type { HassEntity } from "../src/hass";
import {
    arrange,
    bucketOf,
    calendarEntities,
    calendarItems,
    calendarWindow,
    colorOf,
    cssColor,
    dig,
    isCalendarList,
    isTodoList,
    parseWhen,
    plainText,
    readItems,
    todoItems,
    validList,
    zoneDay,
} from "../src/lists";
import type { Bucket, Item, ListConfig } from "../src/types";

const entity = (state: string, attributes: Record<string, unknown> = {}): HassEntity => ({
    entity_id: "sensor.chores",
    state,
    last_changed: "2026-03-10T08:00:00Z",
    attributes,
});

const NAMES: Record<Bucket, string> = { before: "Earlier", now: "Now", after: "Coming", done: "Done" };
// Noon on 10 March 2026 in UTC, so the day is the same in any zone the tests run in.
const NOW = Date.UTC(2026, 2, 10, 12);
const UTC = { timeZone: "UTC" };

const item = (title: string, start?: string, end?: string, more: Partial<Item> = {}): Item => ({
    key: title,
    title,
    start: parseWhen(start),
    end: parseWhen(end),
    ...more,
});

describe("dig", () => {
    it("follows a dotted path into objects and lists, and gives up quietly", () => {
        const value = { data: { items: [{ name: "a" }, { name: "b" }] } };
        expect(dig(value, "data.items.1.name")).toBe("b");
        expect(dig(value, "data.missing.name")).toBeUndefined();
        expect(dig(value, undefined)).toBe(value);
        expect(dig(value, "")).toBe(value);
    });
});

describe("parseWhen", () => {
    it("reads a day, in ISO or Finnish form, as a whole day", () => {
        expect(parseWhen("2026-03-01")).toEqual({ time: Date.UTC(2026, 2, 1), allDay: true });
        expect(parseWhen("1.3.2026")).toEqual({ time: Date.UTC(2026, 2, 1), allDay: true });
    });

    it("reads a time with its date, and seconds or milliseconds since the epoch, as an instant", () => {
        expect(parseWhen("2026-03-01T10:30:00Z")).toEqual({ time: Date.UTC(2026, 2, 1, 10, 30), allDay: false });
        expect(parseWhen(1_772_361_000)).toEqual({ time: 1_772_361_000_000, allDay: false });
        expect(parseWhen(1_772_361_000_000)).toEqual({ time: 1_772_361_000_000, allDay: false });
    });

    it("takes nothing else for a date: no year, no such day, no text at all", () => {
        expect(parseWhen("Wed, Oct 21 07:06 AM")).toBeUndefined();
        expect(parseWhen("2026-02-31")).toBeUndefined();
        expect(parseWhen("soon")).toBeUndefined();
        expect(parseWhen(null)).toBeUndefined();
        expect(parseWhen(NaN)).toBeUndefined();
    });
});

describe("plainText", () => {
    it("drops the tags, reads the entities and keeps paragraphs apart", () => {
        expect(plainText("<p>01.03.2026&ndash;02.03.2026</p>\r\n<p>Road closed <b>all day</b>.</p>")).toBe(
            "01.03.2026–02.03.2026 Road closed all day.",
        );
        expect(plainText("  plain   text\n here ")).toBe("plain text here");
        expect(plainText("Fish &amp; chips")).toBe("Fish & chips");
    });
});

describe("readItems", () => {
    const tasks = [
        { name: "Water the plants", due: "2026-03-08", who: "Matti", emoji: "🌿" },
        { name: "Dishes", due: "2026-03-10", who: "Maija" },
    ];
    const fields = { title: "name", start: "due", label: "who", icon: "emoji" };

    it("reads a list of objects in an attribute, by the keys the list maps", () => {
        const items = readItems(entity("2", { tasks }), { entity: "sensor.chores", attribute: "tasks", fields });
        expect(items).toEqual([
            {
                key: `Water the plants|${Date.UTC(2026, 2, 8)}|`,
                title: "Water the plants",
                start: { time: Date.UTC(2026, 2, 8), allDay: true },
                end: undefined,
                label: "Matti",
                icon: "🌿",
                link: undefined,
                group: undefined,
            },
            expect.objectContaining({ title: "Dishes", label: "Maija", icon: undefined }),
        ]);
    });

    it("reads its own field names when the list maps none", () => {
        const items = readItems(
            entity("1", { entries: [{ id: "a1", title: "One", text: "<p>Body</p>", link: "https://example.com/1" }] }),
            {
                entity: "sensor.chores",
                attribute: "entries",
            },
        );
        expect(items).toEqual([expect.objectContaining({ key: "a1", title: "One", text: "Body", link: "https://example.com/1" })]);
    });

    it("reads a list nested deeper, with paths into each item", () => {
        const answer = { features: [{ attributes: { title: "Bridge works", from: 1_772_323_200_000 } }] };
        const items = readItems(entity("1", { answer }), {
            entity: "sensor.chores",
            attribute: "answer",
            path: "features",
            fields: { title: "attributes.title", start: "attributes.from" },
        });
        expect(items).toEqual([expect.objectContaining({ title: "Bridge works", start: { time: 1_772_323_200_000, allDay: false } })]);
    });

    it("reads an object keyed by id, each key its item's id", () => {
        const items = readItems(entity("2", { parcels: { JJFI0001: { title: "Shoes" }, JJFI0002: { title: "Books", id: "own" } } }), {
            entity: "sensor.chores",
            attribute: "parcels",
        });
        expect(items?.map((i) => [i.key, i.title])).toEqual([
            ["JJFI0001", "Shoes"],
            ["own", "Books"],
        ]);
    });

    it("reads JSON text, in an attribute or in the state", () => {
        const json = JSON.stringify([{ title: "From text" }]);
        expect(readItems(entity("1", { raw: json }), { entity: "sensor.chores", attribute: "raw" })?.[0].title).toBe("From text");
        expect(readItems(entity(json), { entity: "sensor.chores" })?.[0].title).toBe("From text");
    });

    it("takes a list of plain texts as titles", () => {
        expect(
            readItems(entity("2", { names: ["Milk", "Bread"] }), { entity: "sensor.chores", attribute: "names" })?.map((i) => i.title),
        ).toEqual(["Milk", "Bread"]);
    });

    it("leaves out items without a title, and links that aren't web addresses", () => {
        const entries = [{ text: "no title" }, { title: "Bad link", link: "javascript:alert(1)" }, { title: "Relative", link: "/local/x" }];
        const items = readItems(entity("3", { entries }), { entity: "sensor.chores", attribute: "entries" });
        expect(items?.map((i) => [i.title, i.link])).toEqual([
            ["Bad link", undefined],
            ["Relative", undefined],
        ]);
    });

    it("keeps items with the same key apart", () => {
        const names = ["Milk", "Bread", "Milk", "Milk"];
        expect(readItems(entity("4", { names }), { entity: "sensor.chores", attribute: "names" })?.map((i) => i.key)).toEqual([
            "Milk||",
            "Bread||",
            "Milk|| #2",
            "Milk|| #3",
        ]);
        const entries = [
            { id: "a", title: "One" },
            { id: "a", title: "Two" },
        ];
        expect(readItems(entity("2", { entries }), { entity: "sensor.chores", attribute: "entries" })?.map((i) => i.key)).toEqual([
            "a",
            "a #2",
        ]);
    });

    it("is undefined when there is nothing to read", () => {
        expect(readItems(undefined, { entity: "sensor.chores", attribute: "tasks" })).toBeUndefined();
        expect(readItems(entity("2", {}), { entity: "sensor.chores", attribute: "tasks" })).toBeUndefined();
        expect(readItems(entity("unavailable"), { entity: "sensor.chores" })).toBeUndefined();
        expect(readItems(entity("2", { tasks: "not json" }), { entity: "sensor.chores", attribute: "tasks" })).toBeUndefined();
        expect(readItems(entity("2", { tasks }), { entity: "sensor.chores", attribute: "tasks", path: "no.such" })).toBeUndefined();
    });
});

describe("to-do lists", () => {
    it("are entities in the to-do domain with no attribute", () => {
        expect(isTodoList({ entity: "todo.chores" })).toBe(true);
        expect(isTodoList({ entity: "todo.chores", attribute: "items" })).toBe(false);
        expect(isTodoList({ entity: "sensor.chores" })).toBe(false);
    });

    it("read open items by when they are due and done ones by when they were ticked", () => {
        const items = todoItems([
            { uid: "1", summary: " Dishes ", status: "needs_action", due: "2026-03-12", description: "Both sinks." },
            { uid: "2", summary: "Laundry", status: "completed", due: "2026-03-01", completed: "2026-03-09T18:00:00+00:00" },
            { uid: "3", summary: "Fix the gate", status: "needs_action", due: "2026-03-10T15:00:00+02:00", description: " " },
            { uid: "4", summary: "", status: "needs_action" },
        ]);
        expect(items).toEqual([
            { key: "1", uid: "1", title: "Dishes", done: false, text: "Both sinks.", start: { time: Date.UTC(2026, 2, 12), allDay: true } },
            { key: "2", uid: "2", title: "Laundry", done: true, start: { time: Date.UTC(2026, 2, 9, 18), allDay: false } },
            { key: "3", uid: "3", title: "Fix the gate", done: false, start: { time: Date.UTC(2026, 2, 10, 13), allDay: false } },
        ]);
    });
});

describe("calendars", () => {
    it("are calendar entities with no attribute, with the calendars merged into them", () => {
        expect(isCalendarList({ entity: "calendar.home" })).toBe(true);
        expect(isCalendarList({ entity: "calendar.home", attribute: "events" })).toBe(false);
        expect(calendarEntities({ entity: "calendar.home", entities: ["calendar.holidays", "calendar.home"] })).toEqual([
            "calendar.home",
            "calendar.holidays",
        ]);
    });

    it("are asked for over their groups' reach, a day more at each end, a year each way when no reach is set", () => {
        expect(calendarWindow({ entity: "calendar.home" }, NOW, "UTC")).toEqual({
            start: "2025-03-09T00:00:00.000Z",
            end: "2027-03-12T00:00:00.000Z",
        });
        expect(calendarWindow({ entity: "calendar.home", before: { days: 7 }, after: { days: 3 } }, NOW, "UTC")).toEqual({
            start: "2026-03-02T00:00:00.000Z",
            end: "2026-03-15T00:00:00.000Z",
        });
        // The days and the limit are limits of their own: a limit doesn't widen days that are set.
        expect(calendarWindow({ entity: "calendar.home", limit: 50, after: { days: 5 } }, NOW, "UTC").end).toBe("2026-03-17T00:00:00.000Z");
        // A group left out of the order isn't asked for.
        expect(calendarWindow({ entity: "calendar.home", order: ["now"], after: { days: 7 } }, NOW, "UTC").end).toBe(
            "2026-03-12T00:00:00.000Z",
        );
    });

    it("end a whole day on the day itself, and tell a repeating event's times apart", () => {
        const items = calendarItems(
            [
                { summary: "Independence Day", start: "2026-12-06", end: "2026-12-07", all_day: true, uid: "h1" },
                {
                    summary: "Choir",
                    start: "2026-03-10T18:00:00+02:00",
                    end: "2026-03-10T19:30:00+02:00",
                    uid: "c",
                    recurrence_id: "20260310",
                    location: "Town hall",
                },
                {
                    summary: "Choir",
                    start: "2026-03-17T18:00:00+02:00",
                    end: "2026-03-17T19:30:00+02:00",
                    uid: "c",
                    recurrence_id: "20260317",
                },
                { summary: "Trip", start: "2026-03-20", end: "2026-03-23", description: "<p>Up north.</p>" },
                { summary: " ", start: "2026-03-20", end: "2026-03-21" },
            ],
            "calendar.home",
        );
        expect(items.map((i) => [i.title, i.start, i.end])).toEqual([
            ["Independence Day", { time: Date.UTC(2026, 11, 6), allDay: true }, { time: Date.UTC(2026, 11, 6), allDay: true }],
            ["Choir", { time: Date.UTC(2026, 2, 10, 16), allDay: false }, { time: Date.UTC(2026, 2, 10, 17, 30), allDay: false }],
            ["Choir", { time: Date.UTC(2026, 2, 17, 16), allDay: false }, { time: Date.UTC(2026, 2, 17, 17, 30), allDay: false }],
            ["Trip", { time: Date.UTC(2026, 2, 20), allDay: true }, { time: Date.UTC(2026, 2, 22), allDay: true }],
        ]);
        expect(new Set(items.map((i) => i.key)).size).toBe(4);
        expect(items[1].label).toBe("Town hall");
        expect(items[3].text).toBe("Up north.");
    });

    it("take a colour of their own when merged, and their list's otherwise", () => {
        const list = { entity: "calendar.home", color: "blue", entities: ["calendar.work", { entity: "calendar.holidays", color: "red" }] };
        expect(calendarEntities(list)).toEqual(["calendar.home", "calendar.work", "calendar.holidays"]);
        expect(colorOf(list, "calendar.holidays")).toBe("red");
        expect(colorOf(list, "calendar.work")).toBe("blue");
        expect(colorOf({ entity: "calendar.home" }, "calendar.home")).toBeUndefined();
        expect(validList(list)).toBe(true);
        expect(validList({ entity: "calendar.home", entities: [{ entity: "calendar.x", color: 3 }] } as never)).toBe(false);
    });

    it("read Home Assistant's own colours from the theme, and any other as CSS", () => {
        expect(cssColor("red")).toBe("var(--red-color)");
        expect(cssColor("#ff8800")).toBe("#ff8800");
        expect(cssColor(undefined)).toBeUndefined();
    });

    it("take more entities only on a calendar's list", () => {
        expect(validList({ entity: "calendar.home", entities: ["calendar.holidays"] })).toBe(true);
        expect(validList({ entity: "sensor.chores", entities: ["calendar.holidays"] })).toBe(false);
        expect(validList({ entity: "calendar.home", entities: ["sensor.chores"] })).toBe(false);
    });
});

describe("bucketOf", () => {
    const today = zoneDay(NOW, "UTC");

    it("puts a single day before, on or after today", () => {
        expect(bucketOf(item("a", "2026-03-09"), today, "UTC")).toBe("before");
        expect(bucketOf(item("a", "2026-03-10"), today, "UTC")).toBe("now");
        expect(bucketOf(item("a", "2026-03-11"), today, "UTC")).toBe("after");
    });

    it("keeps a period going on from its first day to its last", () => {
        expect(bucketOf(item("a", "2026-03-08", "2026-03-10"), today, "UTC")).toBe("now");
        expect(bucketOf(item("a", "2026-03-10", "2026-03-12"), today, "UTC")).toBe("now");
        expect(bucketOf(item("a", "2026-03-07", "2026-03-09"), today, "UTC")).toBe("before");
        expect(bucketOf(item("a", "2026-03-11", "2026-03-12"), today, "UTC")).toBe("after");
    });

    it("goes by the day in the given time zone for an instant", () => {
        // 23:30 UTC on the 9th is already the 10th in Helsinki.
        const late = item("a", "2026-03-09T23:30:00Z");
        expect(bucketOf(late, today, "UTC")).toBe("before");
        expect(bucketOf(late, zoneDay(NOW, "Europe/Helsinki"), "Europe/Helsinki")).toBe("now");
    });

    it("takes an item with no date as going on, and one with only an end by that", () => {
        expect(bucketOf(item("a"), today, "UTC")).toBe("now");
        expect(bucketOf(item("a", undefined, "2026-03-01"), today, "UTC")).toBe("before");
    });
});

describe("arrange", () => {
    const list: ListConfig = { entity: "sensor.chores" };
    const items = [
        item("old", "2026-01-05"),
        item("coming late", "2026-04-01"),
        item("yesterday", "2026-03-09"),
        item("today", "2026-03-10"),
        item("coming soon", "2026-03-12"),
    ];
    const titles = (arranged: ReturnType<typeof arrange>) => arranged.groups.map((g) => [g.name, g.items.map((i) => i.title)]);

    it("groups by time, each bucket nearest today first", () => {
        expect(titles(arrange(items, list, NOW, NAMES, UTC))).toEqual([
            ["Earlier", ["yesterday", "old"]],
            ["Now", ["today"]],
            ["Coming", ["coming soon", "coming late"]],
        ]);
    });

    it("takes the buckets' order, names and tones from the list, and leaves out a bucket not in the order", () => {
        const arranged = arrange(
            items,
            { ...list, order: ["now", "after"], now: { name: "Today", tone: "highlight" }, after: { tone: "dimmed" } },
            NOW,
            NAMES,
            UTC,
        );
        expect(titles(arranged)).toEqual([
            ["Today", ["today"]],
            ["Coming", ["coming soon", "coming late"]],
        ]);
        expect(arranged.groups.map((g) => g.tone)).toEqual(["highlight", "dimmed"]);
        expect(arranged.groups[1].items[0].tone).toBe("dimmed");
        expect(arranged.hidden).toBe(0);
    });

    it("puts done items in a bucket of their own, dimmed, the latest first, within its reach", () => {
        const todos = [
            item("open", "2026-03-08"),
            item("done long ago", "2026-02-01", undefined, { done: true }),
            item("done undated", undefined, undefined, { done: true }),
            item("done yesterday", "2026-03-09", undefined, { done: true }),
        ];
        const arranged = arrange(todos, list, NOW, NAMES, UTC);
        expect(titles(arranged)).toEqual([
            ["Earlier", ["open"]],
            ["Done", ["done yesterday", "done long ago", "done undated"]],
        ]);
        expect(arranged.groups[1].tone).toBe("dimmed");
        expect(titles(arrange(todos, { ...list, done: { days: 7, tone: "plain" } }, NOW, NAMES, UTC))[1]).toEqual([
            "Done",
            ["done yesterday", "done undated"],
        ]);
        expect(titles(arrange(todos, { ...list, order: ["before", "now", "after"] }, NOW, NAMES, UTC))).toEqual([["Earlier", ["open"]]]);
    });

    it("shows at most its past limit of what is over, the latest, and fills the rest of the total with what is to come", () => {
        const many = [
            item("long ago", "2026-01-01"),
            item("last week", "2026-03-03"),
            item("yesterday", "2026-03-09"),
            item("tomorrow", "2026-03-11"),
            item("next week", "2026-03-17"),
            item("in a month", "2026-04-10"),
            item("later", "2026-05-01"),
        ];
        const two = arrange(many, { ...list, limit: 5, past_limit: 2 }, NOW, NAMES, UTC);
        expect(titles(two)).toEqual([
            ["Earlier", ["yesterday", "last week"]],
            ["Coming", ["tomorrow", "next week", "in a month"]],
        ]);
        expect(two.hidden).toBe(2);
        // A hard limit: with only one item to come, 2 + 1, not more of the past.
        const few = arrange(many.slice(0, 4), { ...list, limit: 5, past_limit: 2 }, NOW, NAMES, UTC);
        expect(titles(few)).toEqual([
            ["Earlier", ["yesterday", "last week"]],
            ["Coming", ["tomorrow"]],
        ]);
        // 0 shows nothing that is over. Unset, the total alone decides, in the list's order.
        expect(titles(arrange(many, { ...list, limit: 3, past_limit: 0 }, NOW, NAMES, UTC))).toEqual([
            ["Coming", ["tomorrow", "next week", "in a month"]],
        ]);
        expect(titles(arrange(many, { ...list, limit: 3 }, NOW, NAMES, UTC))).toEqual([
            ["Earlier", ["yesterday", "last week", "long ago"]],
        ]);
    });

    it("never shows more than 100 items, nor asks a calendar for more than 365 days either way", () => {
        const lots = Array.from({ length: 150 }, (_, i) => item(`item ${i}`, "2026-03-20"));
        const arranged = arrange(lots, { ...list, limit: 0 }, NOW, NAMES, UTC);
        expect(arranged.groups.flatMap((g) => g.items)).toHaveLength(100);
        expect(arranged.hidden).toBe(50);
        expect(calendarWindow({ entity: "calendar.home", before: { days: 5000 }, after: { days: 5000 } }, NOW, "UTC")).toEqual({
            start: "2025-03-09T00:00:00.000Z",
            end: "2027-03-12T00:00:00.000Z",
        });
    });

    it("groups by month in the order of the days, past months first, named by the card", () => {
        const months = arrange(
            [
                item("April", "2026-04-02"),
                item("March late", "2026-03-20"),
                item("No date"),
                item("February", "2026-02-27"),
                item("March", "2026-03-10"),
            ],
            { ...list, group: "month" },
            NOW,
            NAMES,
            { timeZone: "UTC", monthName: (year, month) => `${month + 1}.${year}` },
        );
        expect(titles(months)).toEqual([
            ["2.2026", ["February"]],
            ["3.2026", ["March", "March late"]],
            ["4.2026", ["April"]],
            [undefined, ["No date"]],
        ]);
        // The time groups still decide each item's tone.
        expect(months.groups[1].items[0].tone).toBe("plain");
    });

    it("turns a bucket round when it asks for the furthest first", () => {
        const arranged = arrange(items, { ...list, before: { farthest_first: true }, after: { farthest_first: true } }, NOW, NAMES, UTC);
        expect(titles(arranged)).toEqual([
            ["Earlier", ["old", "yesterday"]],
            ["Now", ["today"]],
            ["Coming", ["coming late", "coming soon"]],
        ]);
    });

    it("drops what is beyond a bucket's reach, without counting it as cut off", () => {
        const arranged = arrange(items, { ...list, before: { days: 7 }, after: { days: 7 } }, NOW, NAMES, UTC);
        expect(titles(arranged)).toEqual([
            ["Earlier", ["yesterday"]],
            ["Now", ["today"]],
            ["Coming", ["coming soon"]],
        ]);
        expect(arranged.hidden).toBe(0);
    });

    it("cuts to the limit in the buckets' order and counts the rest", () => {
        const arranged = arrange(items, { ...list, order: ["now", "after", "before"], limit: 4 }, NOW, NAMES, UTC);
        expect(titles(arranged)).toEqual([
            ["Now", ["today"]],
            ["Coming", ["coming soon", "coming late"]],
            ["Earlier", ["yesterday"]],
        ]);
        expect(arranged.hidden).toBe(1);
    });

    it("is one list without headings when not grouped, still in the buckets' order with their tones", () => {
        const arranged = arrange(items, { ...list, group: "none", before: { tone: "warning" } }, NOW, NAMES, UTC);
        expect(titles(arranged)).toEqual([[undefined, ["yesterday", "old", "today", "coming soon", "coming late"]]]);
        expect(arranged.groups[0].items.map((i) => i.tone)).toEqual(["warning", "warning", "plain", "plain", "plain"]);
    });

    it("groups by a key in the order its values first come up, those without one together", () => {
        const people = [
            item("a", "2026-03-12", undefined, { group: "Maija" }),
            item("b", "2026-03-10", undefined, { group: "Matti" }),
            item("c", "2026-03-11"),
            item("d", "2026-03-11", undefined, { group: "Maija" }),
        ];
        expect(titles(arrange(people, { ...list, group: "key" }, NOW, NAMES, UTC))).toEqual([
            ["Matti", ["b"]],
            [undefined, ["c"]],
            ["Maija", ["d", "a"]],
        ]);
    });

    it("is one group on a card with several lists, whatever its grouping", () => {
        expect(titles(arrange(items, list, NOW, NAMES, { ...UTC, whole: true }))).toEqual([
            [undefined, ["yesterday", "old", "today", "coming soon", "coming late"]],
        ]);
    });

    it("puts items with no date after the dated ones going on, whichever way the bucket is turned", () => {
        const mixed = [
            item("no date"),
            item("since yesterday", "2026-03-09", "2026-03-11"),
            item("today", "2026-03-10"),
            item("no date either"),
        ];
        const expected = [[undefined, ["since yesterday", "today", "no date", "no date either"]]];
        expect(titles(arrange(mixed, { ...list, group: "none" }, NOW, NAMES, UTC))).toEqual(expected);
        const turned = [[undefined, ["today", "since yesterday", "no date", "no date either"]]];
        expect(titles(arrange(mixed, { ...list, group: "none", now: { farthest_first: true } }, NOW, NAMES, UTC))).toEqual(turned);
    });

    it("keeps the source's order for items with no dates", () => {
        expect(titles(arrange([item("b"), item("a"), item("c")], { ...list, group: "none" }, NOW, NAMES, UTC))).toEqual([
            [undefined, ["b", "a", "c"]],
        ]);
    });
});

describe("validList", () => {
    it("wants an entity, and known values where a value is given", () => {
        expect(validList({ entity: "sensor.chores" })).toBe(true);
        expect(validList({ entity: "sensor.chores", group: "key", limit: 5, order: ["now"], after: { days: 7, tone: "dimmed" } })).toBe(
            true,
        );
        expect(validList({})).toBe(false);
        expect(validList("sensor.chores")).toBe(false);
        expect(validList({ entity: "sensor.chores", group: "person" })).toBe(false);
        expect(validList({ entity: "sensor.chores", limit: -1 })).toBe(false);
        expect(validList({ entity: "sensor.chores", order: ["later"] })).toBe(false);
        expect(validList({ entity: "sensor.chores", before: { tone: "red" } })).toBe(false);
        expect(validList({ entity: "sensor.chores", before: { farthest_first: true } })).toBe(true);
        expect(validList({ entity: "sensor.chores", before: { farthest_first: "yes" } })).toBe(false);
    });

    it("wants texts where a text belongs, as a number there would break the reading", () => {
        expect(validList({ entity: "sensor.chores", attribute: "tasks", path: "data.items", fields: { title: "name" } })).toBe(true);
        expect(validList({ entity: "sensor.chores", attribute: null, fields: { title: null } })).toBe(true);
        expect(validList({ entity: "sensor.chores", path: 1 })).toBe(false);
        expect(validList({ entity: "sensor.chores", attribute: 5 })).toBe(false);
        expect(validList({ entity: "sensor.chores", fields: { title: 1 } })).toBe(false);
        expect(validList({ entity: "sensor.chores", fields: "title" })).toBe(false);
    });
});
