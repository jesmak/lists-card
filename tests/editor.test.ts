import { describe, expect, it } from "vitest";

import { configFromForm, formData, tidyList } from "../src/editor";
import type { ListsCardConfig } from "../src/types";

const TYPE = "custom:lists-card";

describe("formData", () => {
    it("shows the defaults a configuration leaves out, for the card and for each list", () => {
        const data = formData({ type: TYPE, title: null as unknown as string, lists: [{ entity: "sensor.chores", limit: 3 }] });
        expect(data).toMatchObject({ layout: "rows", text: "clamp", headings: "plain" });
        expect(data).not.toHaveProperty("title");
        expect(data.lists).toEqual([{ entity: "sensor.chores", group: "time", limit: 3, order: ["before", "now", "after", "done"] }]);
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
        expect(configFromForm(formData(config) as unknown as ListsCardConfig)).toEqual(config);
    });
});
