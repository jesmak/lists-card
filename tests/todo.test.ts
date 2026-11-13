import { describe, expect, it } from "vitest";

import { draftOf, moveTarget, saveData } from "../src/todo";
import type { TodoItem } from "../src/types";

const ALL = 127;
const item = (uid: string, more: Partial<TodoItem> = {}): TodoItem => ({ uid, summary: uid, status: "needs_action", ...more });

describe("draftOf", () => {
    it("splits a due time into its day and time", () => {
        expect(draftOf("todo.a", item("x", { due: "2026-03-10T08:30:00+02:00", description: "Text" }))).toEqual({
            entity: "todo.a",
            uid: "x",
            title: "x",
            text: "Text",
            day: "2026-03-10",
            time: "08:30",
        });
        expect(draftOf("todo.a", item("y", { due: "2026-03-10" }))).toMatchObject({ day: "2026-03-10", time: "" });
    });
});

describe("saveData", () => {
    const draft = { entity: "todo.a", title: " Dishes ", text: "", day: "", time: "" };

    it("sends a new item's title, and a description and a day only when there are some", () => {
        expect(saveData(draft, ALL)).toEqual({ item: "Dishes" });
        expect(saveData({ ...draft, text: "Both", day: "2026-03-10" }, ALL)).toEqual({
            item: "Dishes",
            description: "Both",
            due_date: "2026-03-10",
        });
    });

    it("sends a time with its day, and a list that takes only times gets the day's midnight", () => {
        expect(saveData({ ...draft, day: "2026-03-10", time: "08:30" }, ALL)).toMatchObject({ due_datetime: "2026-03-10 08:30:00" });
        expect(saveData({ ...draft, day: "2026-03-10" }, 1 | 32)).toMatchObject({ due_datetime: "2026-03-10 00:00:00" });
        expect(saveData({ ...draft, day: "2026-03-10", time: "08:30" }, 1 | 16)).toMatchObject({ due_date: "2026-03-10" });
    });

    it("renames an item, and takes away a description and a day it had", () => {
        const before = item("x", { due: "2026-03-10", description: "Old" });
        expect(saveData({ ...draft, uid: "x" }, ALL, before)).toEqual({ item: "x", rename: "Dishes", description: "", due_date: null });
    });

    it("leaves out what the list doesn't support", () => {
        expect(saveData({ ...draft, text: "Both", day: "2026-03-10" }, 1 | 4)).toEqual({ item: "Dishes" });
    });
});

describe("moveTarget", () => {
    // Dated and done items are in the list but not moved by hand.
    const list = [item("a"), item("d", { due: "2026-03-10" }), item("b"), item("x", { status: "completed" }), item("c")];

    it("moves down after the next item without a day", () => {
        expect(moveTarget(list, "a", "down")).toBe("b");
        expect(moveTarget(list, "c", "down")).toBeNull();
    });

    it("moves up before the previous one, after whatever is before that one, or to the top", () => {
        expect(moveTarget(list, "c", "up")).toBe("d");
        expect(moveTarget(list, "b", "up")).toBeUndefined();
        expect(moveTarget(list, "a", "up")).toBeNull();
    });

    it("doesn't move a dated or a done item", () => {
        expect(moveTarget(list, "d", "up")).toBeNull();
        expect(moveTarget(list, "x", "down")).toBeNull();
    });
});
