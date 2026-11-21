import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import plugin from "../index";
import { settings } from "../settings";

const DISCORD_INVITE = "https://discord.gg/sKTrAMctcy";
const INVITE_JOINED_KEY = "zpt0-discord-invite-joined";

describe("Manycord plugin behavior", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({ ok: false }))
        );
        vi.stubGlobal("localStorage", {
            getItem: vi.fn(() => null),
            setItem: vi.fn(),
        });
        vi.stubGlobal("window", { open: vi.fn() });
        Object.assign(settings.store, {
            discordServerJoin: true,
            goToUpdateChannel: true,
            maxAccounts: 0,
        });
    });

    afterEach(async () => {
        await plugin.stop!();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it("preserves plugin metadata exactly", () => {
        expect(plugin.name).toBe("Manycord");
        expect(plugin.description).toBe(
            "Remove or customize the five-account limit in Discord's built-in account switcher."
        );
        expect(plugin.authors).toEqual([{ id: 299670891875270656n, name: "zpt0.dev" }]);
        expect(plugin.tags).toEqual(["Utility"]);
        expect(plugin.settings).toBe(settings);
    });

    it("maps 0 to Infinity and preserves positive account limits", () => {
        settings.store.maxAccounts = 0;
        expect(plugin.getMaxAccounts()).toBe(Infinity);

        settings.store.maxAccounts = 7;
        expect(plugin.getMaxAccounts()).toBe(7);

        settings.store.maxAccounts = -2;
        expect(plugin.getMaxAccounts()).toBe(Infinity);
    });

    it("opens the shared invite once and records the dedupe key", () => {
        plugin.start!();

        expect(window.open).toHaveBeenCalledWith(DISCORD_INVITE, "_blank");
        expect(window.open).toHaveBeenCalledTimes(1);
        expect(localStorage.setItem).toHaveBeenCalledWith(INVITE_JOINED_KEY, "1");
        expect(localStorage.getItem).toHaveBeenCalledWith(INVITE_JOINED_KEY);
    });

    it("falls back to the invite when server join is disabled and the key is absent", () => {
        settings.store.discordServerJoin = false;
        plugin.start!();

        expect(window.open).toHaveBeenCalledWith(DISCORD_INVITE, "_blank");
        expect(window.open).toHaveBeenCalledTimes(1);
        expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it("does not reopen when the shared dedupe key is already set", () => {
        (localStorage.getItem as any).mockReturnValue("1");
        settings.store.discordServerJoin = false;
        plugin.start!();

        expect(window.open).not.toHaveBeenCalled();
    });

    it("swallows popup failures from the first invite attempt", () => {
        (window.open as any).mockImplementation(() => {
            throw new Error("blocked");
        });
        settings.store.goToUpdateChannel = false;

        expect(() => plugin.start!()).not.toThrow();
        expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it("starts without throwing when localStorage is unavailable", () => {
        vi.stubGlobal("localStorage", undefined);

        expect(() => plugin.start!()).not.toThrow();
        expect(window.open).toHaveBeenCalledWith(DISCORD_INVITE, "_blank");
    });

    it("starts without throwing when localStorage access is denied", () => {
        vi.stubGlobal("localStorage", {
            getItem: vi.fn(() => {
                throw new DOMException("Access denied", "SecurityError");
            }),
            setItem: vi.fn(() => {
                throw new DOMException("Access denied", "SecurityError");
            }),
        });

        settings.store.discordServerJoin = false;
        expect(() => plugin.start!()).not.toThrow();
        expect(window.open).toHaveBeenCalledWith(DISCORD_INVITE, "_blank");
    });

    it("does not start an update timer across repeated start and stop calls", async () => {
        plugin.start!();
        expect(vi.getTimerCount()).toBe(0);

        await plugin.stop!();
        expect(vi.getTimerCount()).toBe(0);

        plugin.start!();
        expect(vi.getTimerCount()).toBe(0);
        await plugin.stop!();
        expect(vi.getTimerCount()).toBe(0);
    });
});
