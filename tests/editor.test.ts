import { describe, expect, it } from "vitest";

import {
    configFromForm,
    formData,
    listFormData,
    listFromForm,
    listKind,
    listSchema,
    newList,
    notListAttributes,
    tidyList,
} from "../src/editor";
import type { ListsCardConfig } from "../src/types";

const TYPE = "custom:lists-card";

describe("formData", () => {
    it("shows the defaults a configuration leaves out, and leaves the lists to their own section", () => {
        const data = formData({ type: TYPE, title: null as unknown as string, lists: [{ entity: "sensor.chores", limit: 3 }] });
        expect(data).toMatchObject({ layout: "rows", text: "clamp", headings: "plain", editing: "full" });
        expect(data).not.toHaveProperty("title");
        expect(data).not.toHaveProperty("lists");
    });
});

describe("a list's page", () => {
    const names = (schema: Array<{ name: string }>) => schema.map((entry) => entry.name);
    const text = (key: string) => key;

    it("knows a list's kind by its entity, an attribute making any entity's list one of keys", () => {
        expect(listKind({ entity: "calendar.home" })).toBe("calendar");
        expect(listKind({ entity: "todo.chores" })).toBe("todo");
        expect(listKind({ entity: "sensor.chores", attribute: "tasks" })).toBe("attribute");
        expect(listKind({ entity: "todo.chores", attribute: "items" })).toBe("attribute");
    });

    it("has only the fields its kind can use", () => {
        const calendar = names(listSchema("calendar", text));
        expect(calendar).toContain("entities");
        expect(calendar).not.toContain("attribute");
        expect(calendar).not.toContain("fields");
        expect(calendar).not.toContain("done");
        const todo = names(listSchema("todo", text));
        expect(todo).toContain("done");
        expect(todo).not.toContain("entities");
        const attribute = names(listSchema("attribute", text));
        expect(attribute).toEqual(expect.arrayContaining(["attribute", "path", "fields"]));
        expect(attribute).not.toContain("entities");
    });

    it("offers grouping by key only where the items have keys, and by month everywhere", () => {
        const groupings = (kind: "calendar" | "attribute") =>
            (
                listSchema(kind, text).find((entry) => entry.name === "group") as unknown as {
                    selector: { select: { options: Array<{ value: string }> } };
                }
            ).selector.select.options.map((option) => option.value);
        expect(groupings("calendar")).toEqual(["time", "month", "none"]);
        expect(groupings("attribute")).toEqual(["time", "key", "month", "none"]);
    });

    it("offers the picked entity's attributes that can hold a list, and hides the rest", () => {
        expect(
            notListAttributes({
                friendly_name: "Chores",
                icon: "mdi:broom",
                count: 3,
                tasks: [{ title: "Dishes" }],
                answer: { features: [] },
                as_json: '[{"title": "Laundry"}]',
                not_json: "[nope",
            }),
        ).toEqual(["friendly_name", "icon", "count", "not_json"]);
        const attribute = listSchema("attribute", text, ["friendly_name"]).find((entry) => entry.name === "attribute") as unknown as {
            selector: { attribute: { hide_attributes: string[] } };
            context: { filter_entity: string };
        };
        expect(attribute.selector.attribute.hide_attributes).toEqual(["friendly_name"]);
        expect(attribute.context.filter_entity).toBe("entity");
    });

    it("shows the earlier and coming groups' days as the page's own fields, and writes them back into the groups", () => {
        const list = { entity: "calendar.home", before: { name: "Past", days: 3 }, after: { days: 60 } };
        expect(listFormData(list)).toMatchObject({ days_back: 3, days_ahead: 60 });
        expect(listFromForm({ ...listFormData(list), days_back: null, days_ahead: 90 })).toMatchObject({
            before: { name: "Past" },
            after: { days: 90 },
        });
        expect(tidyList(listFromForm({ ...listFormData(list), days_back: null, days_ahead: null }))).toEqual({
            entity: "calendar.home",
            before: { name: "Past" },
        });
        // Only the done group keeps a reach of its own in its form.
        const days = (name: string) =>
            Object.keys(
                (listSchema("todo", text).find((entry) => entry.name === name) as unknown as { selector: { object: { fields: object } } })
                    .selector.object.fields,
            );
        expect(days("after")).not.toContain("days");
        expect(days("done")).toContain("days");
    });

    it("starts a calendar added in the editor with 30 days ahead in its config, and other lists with nothing", () => {
        expect(newList("calendar.home")).toEqual({ entity: "calendar.home", before: { days: 0 }, after: { days: 30 } });
        expect(listFormData(newList("calendar.home"))).toMatchObject({ days_back: 0, days_ahead: 30 });
        // A 0 is a value of its own, and stays in the config.
        expect(tidyList(newList("calendar.home"))).toEqual({ entity: "calendar.home", before: { days: 0 }, after: { days: 30 } });
        expect(newList("todo.chores")).toEqual({ entity: "todo.chores" });
        expect(newList("sensor.chores")).toEqual({ entity: "sensor.chores" });
    });

    it("shows the time groups its kind has as the default order", () => {
        expect(listFormData({ entity: "calendar.home" }).order).toEqual(["before", "now", "after"]);
        expect(listFormData({ entity: "todo.chores" }).order).toEqual(["before", "now", "after", "done"]);
    });
});

describe("tidyList", () => {
    it("keeps what is set and drops blanks and defaults", () => {
        expect(
            tidyList({
                entity: "sensor.chores",
                attribute: "tasks",
                path: "",
                name: undefined,
                fields: { title: "name", text: "", start: undefined },
                group: "time",
                limit: 0,
                order: ["before", "now", "after", "done"],
                before: { name: "", tone: "plain", farthest_first: false },
                now: { name: "Today", tone: "highlight" },
                after: { days: 0, farthest_first: true },
                done: { tone: "dimmed" },
                empty: "",
            }),
        ).toEqual({
            entity: "sensor.chores",
            attribute: "tasks",
            fields: { title: "name" },
            now: { name: "Today", tone: "highlight" },
            after: { days: 0, farthest_first: true },
        });
    });

    it("keeps a done bucket's tone only when it isn't dimmed, which is that bucket's default", () => {
        expect(tidyList({ entity: "todo.chores", done: { tone: "plain" } })).toEqual({ entity: "todo.chores", done: { tone: "plain" } });
        expect(tidyList({ entity: "todo.chores", before: { tone: "dimmed" } })).toEqual({
            entity: "todo.chores",
            before: { tone: "dimmed" },
        });
    });

    it("drops the order a calendar's page shows by default, which has no done group", () => {
        expect(tidyList({ entity: "calendar.home", order: ["before", "now", "after"] })).toEqual({ entity: "calendar.home" });
        // On a to-do list the same order leaves the done items out.
        expect(tidyList({ entity: "todo.chores", order: ["before", "now", "after"] })).toEqual({
            entity: "todo.chores",
            order: ["before", "now", "after"],
        });
    });

    it("writes a merged calendar with no colour as its name alone, and one with a colour in full", () => {
        expect(
            tidyList({ entity: "calendar.home", entities: [{ entity: "calendar.work" }, { entity: "calendar.holidays", color: "red" }] }),
        ).toEqual({ entity: "calendar.home", entities: ["calendar.work", { entity: "calendar.holidays", color: "red" }] });
        expect(listFormData({ entity: "calendar.home", entities: ["calendar.work"] }).entities).toEqual([{ entity: "calendar.work" }]);
    });

    it("shows a group holding only its days as unset, as the days are fields of the page, and keeps them on the way back", () => {
        const list = { entity: "calendar.home", before: { days: 0 }, after: { days: 30, name: "Soon" } };
        const data = listFormData(list);
        expect(data.before).toBeUndefined();
        expect(data.after).toEqual({ name: "Soon" });
        expect(tidyList(listFromForm(data))).toEqual(list);
    });

    it("asks for a limit of 1 to 100, starting empty", () => {
        const limit = JSON.stringify(listSchema("attribute", (key) => key, [])).match(
            /"name":"limit","selector":\{"number":\{[^}]*\}/,
        )?.[0];
        expect(limit).toContain('"min":1');
        expect(limit).toContain('"max":100');
        expect(listFormData({ entity: "sensor.chores" }).limit).toBeUndefined();
    });

    it("keeps a past limit of 0, which shows no past items", () => {
        expect(tidyList({ entity: "calendar.home", past_limit: 0 })).toEqual({ entity: "calendar.home", past_limit: 0 });
        expect(tidyList({ entity: "calendar.home", past_limit: undefined })).toEqual({ entity: "calendar.home" });
    });

    it("keeps hide_more only when it is on", () => {
        expect(tidyList({ entity: "sensor.chores", limit: 3, hide_more: true })).toEqual({
            entity: "sensor.chores",
            limit: 3,
            hide_more: true,
        });
        expect(tidyList({ entity: "sensor.chores", hide_more: false })).toEqual({ entity: "sensor.chores" });
    });

    it("keeps the other calendars, but not the list's own entity among them", () => {
        expect(tidyList({ entity: "calendar.home", entities: ["calendar.home", "calendar.holidays", ""] })).toEqual({
            entity: "calendar.home",
            entities: ["calendar.holidays"],
        });
        expect(tidyList({ entity: "calendar.home", entities: [] })).toEqual({ entity: "calendar.home" });
    });

    it("keeps a grouping, a limit and an order that aren't the defaults", () => {
        expect(tidyList({ entity: "sensor.chores", group: "key", limit: 5, order: ["now", "after"] })).toEqual({
            entity: "sensor.chores",
            group: "key",
            limit: 5,
            order: ["now", "after"],
        });
    });
});

describe("configFromForm", () => {
    it("writes a configuration as short as one written by hand", () => {
        const form = {
            type: TYPE,
            title: "",
            icon: "mdi:format-list-bulleted",
            layout: "rows",
            text: "fold",
            headings: "plain",
            row_step: "full",
            lists: [{ entity: "sensor.chores", group: "time", limit: 0, order: ["before", "now", "after", "done"] }, { entity: "" }],
        } as unknown as ListsCardConfig;
        expect(configFromForm(form)).toEqual({
            type: TYPE,
            icon: "mdi:format-list-bulleted",
            text: "fold",
            lists: [{ entity: "sensor.chores" }],
        });
    });

    it("goes round: a form filled from a configuration writes the same one back", () => {
        const config: ListsCardConfig = {
            type: TYPE,
            title: "Home",
            layout: "timeline",
            lists: [{ entity: "sensor.chores", attribute: "tasks", fields: { start: "due" }, after: { days: 7 }, order: ["now", "after"] }],
        };
        const form = {
            ...formData(config),
            lists: config.lists.map((list) => listFromForm(listFormData(list))),
        } as unknown as ListsCardConfig;
        expect(configFromForm(form)).toEqual(config);
    });
});
