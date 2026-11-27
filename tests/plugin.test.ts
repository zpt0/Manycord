import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import plugin from "../index";
import { settings } from "../settings";
import { __guildStoreState, UserStore } from "./helpers/vencord-mocks";

const DISCORD_INVITE = "https://discord.gg/sKTrAMctcy";
const INVITE_JOINED_KEY = "zpt0-discord-invite-joined";
const SUPPORT_GUILD_ID = "1508481905291558942";

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
        __guildStoreState.guilds = {};
        vi.spyOn(UserStore, "getCurrentUser").mockReturnValue({ id: "test-user" } as any);
        Object.assign(settings.store, {
            discordServerJoin: true,
            goToUpdateChannel: true,
            maxAccounts: 0,
        });
    });

    afterEach(async () => {
        await plugin.stop!();
        vi.useRealTimers();
        vi.restoreAllMocks();
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

    it("never opens the invite when already a member of the support server", () => {
        __guildStoreState.guilds = { [SUPPORT_GUILD_ID]: { id: SUPPORT_GUILD_ID } };

        plugin.start!();

        expect(window.open).not.toHaveBeenCalled();
        expect(localStorage.getItem).not.toHaveBeenCalled();
        expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it("never opens the invite on reconnect when the user joined the server meanwhile", () => {
        vi.spyOn(UserStore, "getCurrentUser").mockReturnValue(undefined as any);
        plugin.start!();
        expect(window.open).not.toHaveBeenCalled();

        __guildStoreState.guilds = { [SUPPORT_GUILD_ID]: { id: SUPPORT_GUILD_ID } };
        plugin.flux!.CONNECTION_OPEN();

        expect(window.open).not.toHaveBeenCalled();
        expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it("waits for connection before deciding when the user is not yet logged in", () => {
        vi.spyOn(UserStore, "getCurrentUser").mockReturnValue(undefined as any);
        plugin.start!();
        expect(window.open).not.toHaveBeenCalled();

        // CONNECTION_OPEN means Discord populated the user and guild stores.
        vi.spyOn(UserStore, "getCurrentUser").mockReturnValue({ id: "test-user" } as any);
        plugin.flux!.CONNECTION_OPEN();

        expect(window.open).toHaveBeenCalledWith(DISCORD_INVITE, "_blank");
        expect(window.open).toHaveBeenCalledTimes(1);
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
