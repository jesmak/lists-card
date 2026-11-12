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

    it("says how many items its limit left out", async () => {
        const element = await card(hassWith(chores), { lists: [{ ...CHORES, limit: 1 }] });
        expect(texts(element, ".ti")).toEqual(["Water the plants"]);
        expect(texts(element, ".more")).toEqual(["+ 2 more"]);
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

    it("is a range for a period", async () => {
        const [range] = texts(await dated([{ title: "Works", start: "2020-03-30", end: "2020-04-02" }]), ".when");
        expect(range).toMatch(/^3\/30\/2020\s*–\s*4\/2\/2020$/);
    });

    it("is in the timeline's badge: the day, the month, and the year when it isn't this year", async () => {
        const old = await timeline([{ title: "Old", start: "2020-03-01" }]);
        expect(texts(old, ".badge > *")).toEqual(["1", "Mar", "2020"]);
        // The badge says it all, so the text under the title doesn't repeat it.
        expect(texts(old, ".lb")).toEqual([]);
        expect(texts(await timeline([{ title: "This year", start: midsummer }]), ".badge > *")).toHaveLength(2);
    });

    it("is a period's days in the badge within one month, and its range under the title across two", async () => {
        const within = await timeline([{ title: "Works", start: "2020-03-01", end: "2020-03-03" }]);
        expect(texts(within, ".badge .day")).toEqual(["1–3"]);
        expect(texts(within, ".lb")).toEqual([]);
        const across = await timeline([{ title: "Works", start: "2020-03-30", end: "2020-04-02", who: "x" }]);
        expect(texts(across, ".badge .day")).toEqual(["30"]);
        expect(texts(across, ".lb")[0]).toMatch(/3\/30\/2020\s*–\s*4\/2\/2020/);
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
});
