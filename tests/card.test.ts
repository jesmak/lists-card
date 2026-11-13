import { afterEach, describe, expect, it, vi } from "vitest";

import type { HassEntity, HomeAssistant } from "../src/hass";
import "../src/lists-card";
import type { ListsCard } from "../src/lists-card";
import type { ListsCardConfig } from "../src/types";

/** A day `offset` days from today, as the browser's zone has it, which is the zone the card goes by here. */
function day(offset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const two = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
}

function sensor(entityId: string, name: string, attributes: Record<string, unknown>): HassEntity {
    return { entity_id: entityId, state: "0", last_changed: "", attributes: { friendly_name: name, ...attributes } };
}

const chores = sensor("sensor.chores", "Chores", {
    tasks: [
        { title: "Water the plants", due: day(-3), who: "Matti", icon: "🌿" },
        { title: "Dishes", due: day(0), who: "Maija", icon: "mdi:silverware" },
        { title: "Laundry", due: day(2), who: "Matti" },
    ],
});

const notices = sensor("sensor.notices", "Notices", {
    entries: [
        { title: "Road works", start: day(-1), end: day(1), text: "<p>The bridge is closed.</p>", link: "https://example.com/works" },
        { title: "Market day", start: day(5), text: "Stalls on the square.", link: "javascript:alert(1)" },
    ],
});

const hassWith = (...states: HassEntity[]): HomeAssistant => ({
    states: Object.fromEntries(states.map((s) => [s.entity_id, s])),
    language: "en",
});

const CHORES = { entity: "sensor.chores", attribute: "tasks", fields: { start: "due", label: "who" } };

async function card(hass: HomeAssistant, config: Partial<ListsCardConfig>): Promise<ListsCard> {
    const element = document.createElement("lists-card") as ListsCard;
    element.setConfig({ type: "custom:lists-card", lists: [], ...config });
    element.hass = hass;
    document.body.append(element);
    await element.updateComplete;
    return element;
}

const texts = (element: ListsCard, selector: string) =>
    [...element.shadowRoot!.querySelectorAll(selector)].map((e) => e.textContent!.replace(/\s+/g, " ").trim());

afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
});

describe("one list", () => {
    it("is grouped by time under the buckets' names, with their tones", async () => {
        const element = await card(hassWith(chores), {
            title: "Home",
            lists: [{ ...CHORES, before: { name: "Late", tone: "warning" }, now: { name: "Today", tone: "highlight" } }],
        });
        expect(texts(element, ".gh")).toEqual(["Late", "Today", "Coming"]);
        expect(texts(element, ".ti")).toEqual(["Water the plants", "Dishes", "Laundry"]);
        expect(texts(element, ".lb")).toEqual(["Matti", "Maija", "Matti"]);
        expect([...element.shadowRoot!.querySelectorAll(".item")].map((e) => e.className)).toEqual([
            "item rows tone-warning",
            "item rows tone-highlight",
            "item rows tone-plain",
        ]);
        // The first group's tone says it matters, so the pill counts it by name.
        expect(texts(element, ".pill")).toEqual(["1 late"]);
    });

    it("shows an icon's name as an icon and anything else as text", async () => {
        const element = await card(hassWith(chores), { lists: [CHORES] });
        expect(element.shadowRoot!.querySelector(".ic ha-icon")?.getAttribute("icon")).toBe("mdi:silverware");
        expect(texts(element, ".ic .emoji")).toEqual(["🌿"]);
    });

    it("has no headings when not grouped, and counts its items beside the title", async () => {
        const element = await card(hassWith(chores), { title: "Home", lists: [{ ...CHORES, group: "none" }] });
        expect(texts(element, ".gh")).toEqual([]);
        expect(texts(element, ".pill")).toEqual(["3"]);
    });

    it("says how many items its limit left out, opens them on a tap and shuts them on another", async () => {
        const element = await card(hassWith(chores), { lists: [{ ...CHORES, limit: 1 }] });
        expect(texts(element, ".ti")).toEqual(["Water the plants"]);
        expect(texts(element, ".more")).toEqual(["+ 2 more"]);
        element.shadowRoot!.querySelector<HTMLButtonElement>("button.more")!.click();
        await element.updateComplete;
        expect(texts(element, ".ti")).toEqual(["Water the plants", "Dishes", "Laundry"]);
        expect(texts(element, ".more")).toEqual(["Show less"]);
        element.shadowRoot!.querySelector<HTMLButtonElement>("button.more")!.click();
        await element.updateComplete;
        expect(texts(element, ".ti")).toEqual(["Water the plants"]);
    });

    it("says nothing of what its limit left out when told to hide it", async () => {
        const element = await card(hassWith(chores), { lists: [{ ...CHORES, limit: 1, hide_more: true }] });
        expect(texts(element, ".ti")).toEqual(["Water the plants"]);
        expect(element.shadowRoot!.querySelector(".more")).toBeNull();
    });

    it("says so when the list is empty, in the list's own words when it has them", async () => {
        const empty = sensor("sensor.chores", "Chores", { tasks: [] });
        expect(texts(await card(hassWith(empty), { lists: [CHORES] }), ".empty")).toEqual(["Nothing on the list."]);
        expect(texts(await card(hassWith(empty), { lists: [{ ...CHORES, empty: "All done." }] }), ".empty")).toEqual(["All done."]);
    });

    it("says which entity it couldn't read a list from", async () => {
        const element = await card(hassWith(), { lists: [CHORES] });
        expect(texts(element, ".empty")).toEqual(["No list found in sensor.chores."]);
    });
});

describe("several lists", () => {
    it("are a group each, under the list's name, and an empty one says so in its place", async () => {
        const element = await card(hassWith(chores, sensor("sensor.notices", "Notices", { entries: [] })), {
            lists: [
                { ...CHORES, name: "Home" },
                { entity: "sensor.notices", attribute: "entries" },
            ],
        });
        expect(texts(element, ".gh")).toEqual(["Home", "Notices"]);
        expect(texts(element, ".grp:first-child .ti")).toEqual(["Water the plants", "Dishes", "Laundry"]);
        expect(texts(element, ".grp:last-child .empty")).toEqual(["Nothing on the list."]);
    });
});

describe("an item's text and link", () => {
    const list = { entity: "sensor.notices", attribute: "entries" };

    it("is shown whole with nothing to tap", async () => {
        const element = await card(hassWith(notices), { text: "full", lists: [list] });
        expect(texts(element, ".tx")).toEqual(["The bridge is closed.", "Stalls on the square."]);
        expect(element.shadowRoot!.querySelector(".cover")).toBeNull();
    });

    it("is folded away until a tap opens the item", async () => {
        const element = await card(hassWith(notices), { text: "fold", lists: [list] });
        const item = element.shadowRoot!.querySelector(".item")!;
        const cover = item.querySelector<HTMLButtonElement>(".cover")!;
        expect(cover.getAttribute("aria-expanded")).toBe("false");
        expect(item.querySelector(".fold")!.classList.contains("open")).toBe(false);
        cover.click();
        await element.updateComplete;
        expect(cover.getAttribute("aria-expanded")).toBe("true");
        expect(item.querySelector(".fold")!.classList.contains("open")).toBe(true);
    });

    it("has its folds foldable headings too", async () => {
        const element = await card(hassWith(notices), { headings: "fold", lists: [list] });
        const heading = element.shadowRoot!.querySelector<HTMLButtonElement>(".gh.folding")!;
        expect(texts(element, ".gh .count")).toEqual(["1", "1"]);
        heading.click();
        await element.updateComplete;
        expect(heading.getAttribute("aria-expanded")).toBe("false");
        expect(heading.nextElementSibling!.hasAttribute("inert")).toBe(true);
    });

    it("gets a link of its own, opened in a new tab without a referrer", async () => {
        const element = await card(hassWith(notices), { lists: [list] });
        const links = [...element.shadowRoot!.querySelectorAll<HTMLAnchorElement>("a.src")];
        expect(links).toHaveLength(1);
        expect([links[0].getAttribute("target"), links[0].getAttribute("rel")]).toEqual(["_blank", "noreferrer"]);
    });
});

describe("the rows' right edge", () => {
    const entries = [
        { title: "With a text", start: "2020-03-01", text: "Short." },
        { title: "Plain", start: "2020-03-02" },
        { title: "With a link", start: "2020-03-03", link: "https://example.com/a" },
    ];
    const rows = (text: "clamp" | "fold") =>
        card(hassWith(sensor("sensor.notices", "Notices", { entries })), {
            text,
            lists: [{ entity: "sensor.notices", attribute: "entries", group: "none" }],
        });
    const titleRow = (element: ListsCard, title: string) =>
        [...element.shadowRoot!.querySelectorAll(".item")]
            .find((e) => e.querySelector(".ti")!.textContent!.includes(title))!
            .querySelector(".line")!;

    it("puts a cut text's chevron at the end of the text's row, so the title's row has only the date and the link", async () => {
        const element = await rows("clamp");
        expect(titleRow(element, "With a text").querySelector(".chev")).toBeNull();
        expect(element.shadowRoot!.querySelector(".tx-row > .chev")).not.toBeNull();
        // Every title row makes the same room at its end as the one with a link's button.
        expect(element.shadowRoot!.querySelector("ha-card")!.getAttribute("style")).toContain("--lc-title-buttons: 28px");
        expect(titleRow(element, "Plain").querySelector(".act")).not.toBeNull();
    });

    it("keeps a folded text's chevron on the title's row, where it can be seen, and makes room for it on every row", async () => {
        const element = await rows("fold");
        expect(titleRow(element, "With a text").querySelector(".act .chev")).not.toBeNull();
        expect(element.shadowRoot!.querySelector("ha-card")!.getAttribute("style")).toContain("--lc-title-buttons: 28px");
    });
});

describe("when an item is", () => {
    // Whole days in a past year read the same in any zone and on any day the tests run.
    const dated = (entries: Array<Record<string, unknown>>, tone?: "warning") =>
        card(hassWith(sensor("sensor.notices", "Notices", { entries })), {
            lists: [{ entity: "sensor.notices", attribute: "entries", before: { tone } }],
        });
    const timeline = (entries: Array<Record<string, unknown>>, tone?: "warning") =>
        card(hassWith(sensor("sensor.notices", "Notices", { entries })), {
            layout: "timeline",
            lists: [{ entity: "sensor.notices", attribute: "entries", before: { tone } }],
        });
    const thisYear = new Date().getFullYear();
    // A day of this year that isn't today.
    const midsummer = day(0) === `${thisYear}-06-15` ? `${thisYear}-06-16` : `${thisYear}-06-15`;

    it("is written with its weekday, and its year only when that isn't this year", async () => {
        expect(texts(await dated([{ title: "Old", start: "2020-03-01" }]), ".when")).toEqual(["Sun, 3/1/2020"]);
        expect(texts(await dated([{ title: "This year", start: midsummer }]), ".when")[0]).toMatch(/^[A-Z][a-z]{2}, 6\/1[56]$/);
    });

    it("is today for a day that is today, and how long ago only in a bucket toned as a warning", async () => {
        const entries = [
            { title: "Now", start: day(0) },
            { title: "Late", start: day(-3) },
        ];
        expect(texts(await dated(entries, "warning"), ".when")).toEqual(["3 days ago", "today"]);
        expect(texts(await dated(entries), ".when")[0]).not.toMatch(/ago/);
    });

    it("has its weekday when it has times, as a single day does", async () => {
        const [range] = texts(await dated([{ title: "Meeting", start: "2020-03-10T14:00:00Z", end: "2020-03-10T15:00:00Z" }]), ".when");
        expect(range).toMatch(/^Tue, 3\/10\/2020/);
    });

    it("is a range for a period", async () => {
        const [range] = texts(await dated([{ title: "Works", start: "2020-03-30", end: "2020-04-02" }]), ".when");
        expect(range).toMatch(/^3\/30\/2020\s*–\s*4\/2\/2020$/);
    });

    it("is only its time under a timeline's title when it is within the badge's one day", async () => {
        const element = await timeline([
            { title: "Choir", start: "2020-03-10T18:00:00Z", end: "2020-03-10T19:30:00Z" },
            { title: "Dentist", start: "2020-03-12T08:15:00Z" },
            { title: "Night shift", start: "2020-03-14T20:00:00Z", end: "2020-03-15T06:00:00Z" },
        ]);
        const when = (title: string) =>
            [...element.shadowRoot!.querySelectorAll(".item")]
                .find((e) => e.querySelector(".ti")!.textContent!.includes(title))!
                .querySelector(".lb .when")!.textContent!;
        const [choir, dentist, night] = [when("Choir"), when("Dentist"), when("Night shift")];
        // The times in the browser's zone, with no date, as the badge has it.
        expect(choir).not.toMatch(/3\/10|2020/);
        expect(choir).toMatch(/\d:\d{2}.*–.*\d:\d{2}/);
        expect(dentist).not.toMatch(/3\/12|2020/);
        // Over two days, so the dates are written out.
        expect(night).toMatch(/2020/);
    });

    it("is in the timeline's badge: the day, the month, and the year when it isn't this year", async () => {
        const old = await timeline([{ title: "Old", start: "2020-03-01" }]);
        expect(texts(old, ".badge > :not(.acc)")).toEqual(["1", "Mar", "2020"]);
        // The badge says it all, so the text under the title doesn't repeat it.
        expect(texts(old, ".lb")).toEqual([]);
        expect(texts(await timeline([{ title: "This year", start: midsummer }]), ".badge > :not(.acc)")).toHaveLength(2);
    });

    it("is a period's days in the badge within one month, and its first and last day across two", async () => {
        const within = await timeline([{ title: "Works", start: "2020-03-01", end: "2020-03-03" }]);
        expect(texts(within, ".badge > :not(.acc)")).toEqual(["1–3", "Mar", "2020"]);
        expect(texts(within, ".lb")).toEqual([]);
        const across = await timeline([{ title: "Works", start: "2020-03-30", end: "2020-04-02" }]);
        expect(texts(across, ".badge > :not(.acc)")).toEqual(["3/30", "4/2", "2020"]);
        // The badge says it all, so nothing is written under the title.
        expect(texts(across, ".lb")).toEqual([]);
    });

    it("is under the title for a period with times, which the badge can't hold", async () => {
        const timed = await timeline([{ title: "Works", start: "2020-03-30T10:00:00Z", end: "2020-04-02T12:00:00Z" }]);
        expect(texts(timed, ".badge .end")).toEqual([]);
        expect(texts(timed, ".lb")[0]).toMatch(/2020/);
    });

    it("is said under the title in the timeline when the badge can't: today, and late under a warning", async () => {
        const element = await timeline(
            [
                { title: "Now", start: day(0) },
                { title: "Late", start: day(-3) },
            ],
            "warning",
        );
        expect(texts(element, ".lb")).toEqual(["3 days ago", "today"]);
    });

    it("moves to another group when the day changes, with no change in the entity", async () => {
        vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
        const noon = new Date();
        noon.setHours(12, 0, 0, 0);
        vi.setSystemTime(noon);
        const element = await card(hassWith(sensor("sensor.notices", "Notices", { entries: [{ title: "Due", start: day(0) }] })), {
            lists: [{ entity: "sensor.notices", attribute: "entries" }],
        });
        expect(texts(element, ".gh")).toEqual(["Now"]);
        vi.setSystemTime(noon.getTime() + 24 * 3_600_000);
        vi.advanceTimersByTime(60_000);
        await element.updateComplete;
        expect(texts(element, ".gh")).toEqual(["Earlier"]);
    });
});

describe("a to-do list", () => {
    /** A connection that hands each subscription's callback out, so a test can send the list's items. */
    function todoHass(features = 127) {
        const send = new Map<string, (message: unknown) => void>();
        const unsubscribed: string[] = [];
        const callService = vi.fn<(...args: unknown[]) => Promise<undefined>>(async () => undefined);
        const callWS = vi.fn<(...args: unknown[]) => Promise<undefined>>(async () => undefined);
        const hass: HomeAssistant = {
            ...hassWith({
                entity_id: "todo.chores",
                state: "2",
                last_changed: "",
                attributes: { friendly_name: "Chores", supported_features: features },
            }),
            connection: {
                subscribeMessage: async <T>(callback: (message: T) => void, message: Record<string, unknown>) => {
                    expect(message.type).toBe("todo/item/subscribe");
                    const entity = message.entity_id as string;
                    send.set(entity, callback as (message: unknown) => void);
                    return async () => {
                        unsubscribed.push(entity);
                    };
                },
            },
            callService,
            callWS: callWS as unknown as HomeAssistant["callWS"],
        };
        return { hass, send, unsubscribed, callService, callWS };
    }

    const ITEMS = {
        items: [
            { uid: "a", summary: "Dishes", status: "needs_action", due: day(-1) },
            { uid: "b", summary: "Laundry", status: "needs_action" },
            { uid: "c", summary: "Plants", status: "completed", completed: new Date().toISOString() },
        ],
    };

    async function todoCard(features?: number) {
        const todo = todoHass(features);
        const element = await card(todo.hass, { lists: [{ entity: "todo.chores", before: { name: "Late", tone: "warning" } }] });
        todo.send.get("todo.chores")!(ITEMS);
        await element.updateComplete;
        return { ...todo, element };
    }

    const ticks = (element: ListsCard) => [...element.shadowRoot!.querySelectorAll<HTMLElement>(".tick")];

    it("shows nothing until its items come, then each with a round tick, the done ones struck through in their own group", async () => {
        const todo = todoHass();
        const element = await card(todo.hass, { lists: [{ entity: "todo.chores" }] });
        expect(texts(element, ".item, .empty")).toEqual([]);
        todo.send.get("todo.chores")!(ITEMS);
        await element.updateComplete;
        expect(texts(element, ".gh-name")).toEqual(["Earlier", "Now", "Ticked"]);
        expect(texts(element, ".ti")).toEqual(["Dishes", "Laundry", "Plants"]);
        expect(ticks(element).map((t) => t.getAttribute("aria-checked"))).toEqual(["false", "false", "true"]);
        expect([...element.shadowRoot!.querySelectorAll(".item")].map((e) => e.className)).toEqual([
            "item can rows tone-plain",
            "item can rows tone-plain",
            "item can rows tone-dimmed done",
        ]);
    });

    it("doesn't count what is done in the pill", async () => {
        const { element } = await todoCard();
        element.setConfig({ type: "custom:lists-card", title: "Chores", lists: [{ entity: "todo.chores" }] });
        await element.updateComplete;
        expect(texts(element, ".pill")).toEqual(["2"]);
    });

    it("ticks an item done at once, and moves it to the done group only a moment later", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const { element, callService, send } = await todoCard();
        ticks(element)[0].click();
        await element.updateComplete;
        expect(callService).toHaveBeenCalledWith("todo", "update_item", { item: "a", status: "completed" }, { entity_id: "todo.chores" });
        // Home Assistant sends the list as it now is, and the ticked item keeps its place and its date until the moment is over.
        const ticked = new Date(Date.now() + 1000).toISOString();
        send.get("todo.chores")!({ items: ITEMS.items.map((i) => (i.uid === "a" ? { ...i, status: "completed", completed: ticked } : i)) });
        await element.updateComplete;
        expect(texts(element, ".gh-name")).toEqual(["Late", "Now", "Ticked"]);
        expect(texts(element, ".when")[0]).toBe("yesterday");
        expect(element.shadowRoot!.querySelectorAll(".item")[0].classList.contains("done")).toBe(true);
        vi.advanceTimersByTime(1000);
        await element.updateComplete;
        expect(texts(element, ".gh-name")).toEqual(["Now", "Ticked"]);
        expect(texts(element, ".ti")).toEqual(["Laundry", "Dishes", "Plants"]);
    });

    it("unticks a done item, and a tick undone in time leaves the item where it was", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const { element, callService } = await todoCard();
        ticks(element)[2].click();
        await element.updateComplete;
        expect(callService).toHaveBeenLastCalledWith(
            "todo",
            "update_item",
            { item: "c", status: "needs_action" },
            { entity_id: "todo.chores" },
        );
        ticks(element)[2].click();
        await element.updateComplete;
        expect(callService).toHaveBeenLastCalledWith(
            "todo",
            "update_item",
            { item: "c", status: "completed" },
            { entity_id: "todo.chores" },
        );
        vi.advanceTimersByTime(1000);
        await element.updateComplete;
        expect(texts(element, ".gh-name")).toEqual(["Late", "Now", "Ticked"]);
    });

    it("shows a tick that can't be pressed when the list can't be changed", async () => {
        const { element } = await todoCard(0);
        expect(ticks(element).map((t) => t.tagName)).toEqual(["SPAN", "SPAN", "SPAN"]);
    });

    it("puts the tick before the title in the timeline", async () => {
        const { element } = await todoCard();
        element.setConfig({ type: "custom:lists-card", layout: "timeline", lists: [{ entity: "todo.chores" }] });
        await element.updateComplete;
        expect(element.shadowRoot!.querySelectorAll(".ti .tick")).toHaveLength(3);
    });

    it("lets go of its list when it leaves the page or no longer shows it", async () => {
        const { element, unsubscribed } = await todoCard();
        element.setConfig({ type: "custom:lists-card", lists: [CHORES] });
        await element.updateComplete;
        await Promise.resolve();
        expect(unsubscribed).toEqual(["todo.chores"]);
    });

    it("says it found no list when the subscription is refused", async () => {
        const hass: HomeAssistant = {
            ...hassWith(),
            connection: { subscribeMessage: () => Promise.reject(new Error("not found")) },
        };
        const element = await card(hass, { lists: [{ entity: "todo.missing" }] });
        await new Promise((resolve) => setTimeout(resolve));
        await element.updateComplete;
        expect(texts(element, ".empty")).toEqual(["No list found in todo.missing."]);
    });
});

describe("editing a to-do list", () => {
    const LIST = {
        items: [
            { uid: "a", summary: "Dishes", status: "needs_action", due: day(-1), description: "Both sinks." },
            { uid: "b", summary: "Laundry", status: "needs_action" },
            { uid: "x", summary: "Gutters", status: "needs_action", due: day(3) },
            { uid: "c", summary: "Plants", status: "needs_action" },
            { uid: "d", summary: "Windows", status: "completed", completed: new Date().toISOString() },
            { uid: "e", summary: "Sauna", status: "completed", completed: new Date().toISOString() },
        ],
    };

    async function editable(config: Partial<ListsCardConfig> = {}, features = 127) {
        const send = new Map<string, (message: unknown) => void>();
        const callService = vi.fn<(...args: unknown[]) => Promise<undefined>>(async () => undefined);
        const callWS = vi.fn<(...args: unknown[]) => Promise<undefined>>(async () => undefined);
        const hass: HomeAssistant = {
            ...hassWith({
                entity_id: "todo.chores",
                state: "3",
                last_changed: "",
                attributes: { friendly_name: "Chores", supported_features: features },
            }),
            connection: {
                subscribeMessage: async <T>(callback: (message: T) => void, message: Record<string, unknown>) => {
                    send.set(message.entity_id as string, callback as (message: unknown) => void);
                    return async () => undefined;
                },
            },
            callService,
            callWS: callWS as unknown as HomeAssistant["callWS"],
        };
        const element = await card(hass, { title: "Chores", lists: [{ entity: "todo.chores" }], ...config });
        send.get("todo.chores")!(LIST);
        await element.updateComplete;
        return { element, callService, callWS };
    }

    const root = (element: ListsCard) => element.shadowRoot!;
    const typeInto = async (element: ListsCard, selector: string, value: string) => {
        const input = root(element).querySelector<HTMLInputElement>(selector)!;
        input.value = value;
        input.dispatchEvent(new Event("input"));
        await element.updateComplete;
    };
    const press = async (element: ListsCard, text: string) => {
        [...root(element).querySelectorAll<HTMLButtonElement>(".editor button, .gh button, .clear-row button")]
            .find((b) => b.textContent!.trim() === text)!
            .click();
        await element.updateComplete;
    };
    const openItem = async (element: ListsCard, title: string) => {
        [...root(element).querySelectorAll<HTMLButtonElement>(".cover")]
            .find((b) => b.getAttribute("aria-label")!.endsWith(title))!
            .click();
        await element.updateComplete;
    };

    it("adds an item from the header's +, with a day, and closes the editor once Home Assistant takes it", async () => {
        const { element, callService } = await editable();
        root(element).querySelector<HTMLButtonElement>(".hd-add")!.click();
        await element.updateComplete;
        expect(root(element).querySelector(".item.new .editor")).not.toBeNull();
        await typeInto(element, ".f-title", "  Vacuum ");
        await typeInto(element, ".f-day", "2026-12-01");
        await press(element, "Add");
        await new Promise((resolve) => setTimeout(resolve));
        await element.updateComplete;
        expect(callService).toHaveBeenCalledWith(
            "todo",
            "add_item",
            { item: "Vacuum", due_date: "2026-12-01" },
            { entity_id: "todo.chores" },
        );
        expect(root(element).querySelector(".editor")).toBeNull();
    });

    it("lets an open item's editor take clicks: the item isn't one whose parts let clicks through", async () => {
        const { element } = await editable();
        await openItem(element, "Laundry");
        const open = root(element).querySelector(".item.editing")!;
        expect(open.classList.contains("can")).toBe(false);
        expect(open.querySelector(".cover")).toBeNull();
    });

    it("opens an item on a tap, and saves its changes, a day taken away as null", async () => {
        const { element, callService } = await editable();
        await openItem(element, "Dishes");
        expect(root(element).querySelector<HTMLInputElement>(".f-title")!.value).toBe("Dishes");
        expect(root(element).querySelector<HTMLTextAreaElement>(".f-text")!.value).toBe("Both sinks.");
        await typeInto(element, ".f-title", "Dishes and pans");
        // The day's clear button.
        root(element).querySelector<HTMLButtonElement>(".when-row .ibtn")!.click();
        await element.updateComplete;
        await press(element, "Save");
        expect(callService).toHaveBeenLastCalledWith(
            "todo",
            "update_item",
            { item: "a", rename: "Dishes and pans", description: "Both sinks.", due_date: null },
            { entity_id: "todo.chores" },
        );
    });

    it("keeps the editor open and says so when a change doesn't go through", async () => {
        const { element, callService } = await editable();
        callService.mockRejectedValueOnce(new Error("nope"));
        await openItem(element, "Laundry");
        await press(element, "Save");
        await element.updateComplete;
        expect(texts(element, ".failed")).toEqual(["The change didn't go through. Try again."]);
    });

    it("deletes the open item", async () => {
        const { element, callService } = await editable();
        await openItem(element, "Laundry");
        await press(element, "Delete");
        expect(callService).toHaveBeenCalledWith("todo", "remove_item", { item: ["b"] }, { entity_id: "todo.chores" });
    });

    it("moves an item with no day one row up or down among those without one", async () => {
        const { element, callWS } = await editable();
        await openItem(element, "Plants");
        const buttons = () => [...root(element).querySelectorAll<HTMLButtonElement>(".btns .ibtn")];
        expect(buttons().map((b) => [b.title, b.disabled])).toEqual([
            ["Move up", false],
            ["Move down", true],
        ]);
        buttons()[0].click();
        // Before Laundry, so after Dishes, which is before it in the whole list.
        expect(callWS).toHaveBeenCalledWith({ type: "todo/item/move", entity_id: "todo.chores", uid: "c", previous_uid: "a" });
        await openItem(element, "Gutters");
        expect(buttons()).toHaveLength(0);
    });

    it("asks before it deletes what is done", async () => {
        const { element, callService } = await editable();
        await press(element, "Delete ticked");
        expect(texts(element, ".asking > span")).toEqual(["Delete 2 ticked?"]);
        await press(element, "Cancel");
        expect(callService).not.toHaveBeenCalled();
        await press(element, "Delete ticked");
        await press(element, "Delete");
        expect(callService).toHaveBeenCalledWith("todo", "remove_item", { item: ["d", "e"] }, { entity_id: "todo.chores" });
    });

    it("asks about a single done item in the singular", async () => {
        const { element } = await editable();
        element.setConfig({ type: "custom:lists-card", title: "Chores", lists: [{ entity: "todo.chores" }] });
        // Only one done item left on the list.
        (element as unknown as { todos: Map<string, unknown[]> }).todos = new Map([["todo.chores", LIST.items.slice(0, 5)]]);
        await element.updateComplete;
        await press(element, "Delete ticked");
        expect(texts(element, ".asking > span")).toEqual(["Delete the ticked item?"]);
    });

    it("shows only the fields the list supports", async () => {
        const { element } = await editable({}, 1 | 2 | 4);
        await openItem(element, "Laundry");
        expect([...root(element).querySelectorAll(".field > span")].map((e) => e.textContent)).toEqual(["Item"]);
    });

    it("only ticks with editing set to tick: no +, no editor, no deleting, a tap opens the text", async () => {
        const { element, callService } = await editable({ editing: "tick" });
        expect(root(element).querySelector(".hd-add")).toBeNull();
        expect(root(element).querySelector(".clear")).toBeNull();
        expect([...root(element).querySelectorAll(".cover")].some((b) => b.getAttribute("aria-label")!.startsWith("Edit"))).toBe(false);
        root(element).querySelector<HTMLButtonElement>("button.tick")!.click();
        expect(callService).toHaveBeenCalledWith("todo", "update_item", { item: "a", status: "completed" }, { entity_id: "todo.chores" });
    });

    it("changes nothing with editing set to none: no +, no editor, and ticks that only show", async () => {
        const { element } = await editable({ editing: "none" });
        expect(root(element).querySelector(".hd-add")).toBeNull();
        expect(root(element).querySelector(".cover")).toBeNull();
        expect(root(element).querySelector("button.tick")).toBeNull();
        expect(root(element).querySelector(".clear")).toBeNull();
    });
});

describe("a calendar", () => {
    function calendarHass(refuse: string[] = []) {
        const send = new Map<string, (message: unknown) => void>();
        const asked: Array<Record<string, unknown>> = [];
        const hass: HomeAssistant = {
            ...hassWith(sensor("calendar.home", "Home", {}), sensor("calendar.holidays", "Holidays", {})),
            connection: {
                subscribeMessage: async <T>(callback: (message: T) => void, message: Record<string, unknown>) => {
                    asked.push(message);
                    if (refuse.includes(message.entity_id as string)) {
                        throw new Error("Unknown entity");
                    }
                    send.set(message.entity_id as string, callback as (message: unknown) => void);
                    return async () => undefined;
                },
            },
        };
        return { hass, send, asked };
    }

    it("merges its calendars' events into one list once all have come, a whole day ending on the day itself", async () => {
        const { hass, send, asked } = calendarHass();
        const element = await card(hass, { lists: [{ entity: "calendar.home", entities: ["calendar.holidays"] }] });
        expect(asked.map((m) => [m.type, m.entity_id])).toEqual([
            ["calendar/event/subscribe", "calendar.home"],
            ["calendar/event/subscribe", "calendar.holidays"],
        ]);
        send.get("calendar.home")!({ events: [{ summary: "Dentist", start: `${day(2)}T09:00:00`, end: `${day(2)}T10:00:00` }] });
        await element.updateComplete;
        // Still waiting for the holidays.
        expect(texts(element, ".ti")).toEqual([]);
        send.get("calendar.holidays")!({ events: [{ summary: "Holiday", start: day(1), end: day(2), all_day: true }] });
        await element.updateComplete;
        expect(texts(element, ".ti")).toEqual(["Holiday", "Dentist"]);
        expect(element.shadowRoot!.querySelector("button.tick")).toBeNull();
    });

    it("draws the line beside each event in its calendar's colour, or the list's", async () => {
        const { hass, send } = calendarHass();
        const element = await card(hass, {
            lists: [{ entity: "calendar.home", color: "blue", entities: [{ entity: "calendar.holidays", color: "red" }] }],
        });
        send.get("calendar.home")!({ events: [{ summary: "Dentist", start: day(2), end: day(3) }] });
        send.get("calendar.holidays")!({ events: [{ summary: "Holiday", start: day(1), end: day(2) }] });
        await element.updateComplete;
        const lines = [...element.shadowRoot!.querySelectorAll(".item")].map((item) => [
            item.querySelector(".ti")!.textContent!.trim(),
            item.querySelector(".acc")!.getAttribute("style"),
        ]);
        expect(lines).toEqual([
            ["Holiday", "--lc-acc: var(--red-color)"],
            ["Dentist", "--lc-acc: var(--blue-color)"],
        ]);
    });

    it("shows what the calendars it could read hold, and says so when it could read none", async () => {
        const some = calendarHass(["calendar.holidays"]);
        const element = await card(some.hass, { lists: [{ entity: "calendar.home", entities: ["calendar.holidays"] }] });
        some.send.get("calendar.home")!({ events: [{ summary: "Dentist", start: day(2), end: day(3) }] });
        await new Promise((resolve) => setTimeout(resolve));
        await element.updateComplete;
        expect(texts(element, ".ti")).toEqual(["Dentist"]);

        const none = calendarHass(["calendar.home"]);
        const empty = await card(none.hass, { lists: [{ entity: "calendar.home" }] });
        await new Promise((resolve) => setTimeout(resolve));
        await empty.updateComplete;
        expect(texts(empty, ".empty")).toEqual(["No list found in calendar.home."]);
    });
});

describe("the spare room of a filled row", () => {
    // What filling the rows left over, as the card would measure it in a sections view.
    async function filled(config: Partial<ListsCardConfig>) {
        const element = await card(hassWith(chores), { lists: [CHORES], ...config });
        Object.assign(element as unknown as { filled: number; spare: number }, { filled: 312, spare: 24 });
        await element.updateComplete;
        return element.shadowRoot!.querySelector("ha-card")!.getAttribute("style")!;
    }

    it("goes under the header on a card with one", async () => {
        const style = await filled({ title: "Home" });
        expect(style).toContain("--lc-spare: 24px");
        expect(style).toContain("--lc-spare-bottom: 0px");
    });

    it("is split on a card with no header, so the lists stand as far from its top as from its bottom", async () => {
        const style = await filled({});
        // 12 px above the lists and 12 below, so the room is split in half.
        expect(style).toContain("--lc-spare: 12px");
        expect(style).toContain("--lc-spare-bottom: 12px");
    });
});

describe("the configuration", () => {
    const set = (config: Record<string, unknown>) => () =>
        (document.createElement("lists-card") as ListsCard).setConfig({
            type: "custom:lists-card",
            lists: [],
            ...config,
        } as ListsCardConfig);

    it("is refused with a reason when a value isn't one the card knows", () => {
        expect(set({ lists: [{ attribute: "tasks" }] })).toThrow(/Invalid configuration/);
        expect(set({ lists: "sensor.chores" })).toThrow(/Invalid configuration/);
        expect(set({ layout: "table" })).toThrow(/Invalid layout/);
        expect(set({ text: "short" })).toThrow(/Invalid text mode/);
        expect(set({ headings: "none" })).toThrow(/Invalid headings/);
        expect(set({ editing: true })).toThrow(/Invalid editing/);
    });

    it("may have no lists yet, and then says where to add one", async () => {
        const element = await card(hassWith(), {});
        expect(texts(element, ".empty")).toEqual(["No lists yet. Add one in the card's settings."]);
    });

    it("starts from the first entity that holds a list of objects with something like a title", () => {
        const stub = (customElements.get("lists-card") as unknown as typeof ListsCard).getStubConfig(
            hassWith(
                sensor("sensor.temperature", "Temperature", { options: ["a", "b"] }),
                sensor("sensor.news", "News", { items: [{ name: "One" }] }),
            ),
        );
        expect(stub).toEqual({ lists: [{ entity: "sensor.news", attribute: "items", fields: { title: "name" } }] });
    });

    it("starts from the first to-do list when no entity holds a list in an attribute", () => {
        const stub = (customElements.get("lists-card") as unknown as typeof ListsCard).getStubConfig(
            hassWith(sensor("sensor.temperature", "Temperature", {}), sensor("todo.shopping", "Shopping", {})),
        );
        expect(stub).toEqual({ lists: [{ entity: "todo.shopping" }] });
    });
});
