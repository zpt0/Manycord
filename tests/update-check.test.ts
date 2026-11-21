import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    checkForUpdates,
    compareVersions,
    startUpdateCheck,
    stopUpdateCheck,
} from "../updateCheck";
import { ResourceScope } from "../foundation/core/lifecycle";

describe("Manycord never opens the browser for updates", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        (globalThis as any).window = { open: vi.fn() };
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({ ok: true, json: async () => ({ tag_name: "v9.9.9" }) }))
        );
    });

    afterEach(async () => {
        await stopUpdateCheck();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it("does not schedule a startup check", async () => {
        startUpdateCheck();

        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(10_000);

        expect(fetch).not.toHaveBeenCalled();
        expect(window.open).not.toHaveBeenCalled();
    });

    it("stays inert when checkForUpdates is called directly", async () => {
        await checkForUpdates(new ResourceScope());

        expect(fetch).not.toHaveBeenCalled();
        expect(window.open).not.toHaveBeenCalled();
    });

    it("stop is safe when no check is active", async () => {
        await expect(stopUpdateCheck()).resolves.toBeUndefined();
        expect(window.open).not.toHaveBeenCalled();
    });

    it("preserves dot-number version comparison", () => {
        expect(compareVersions("0.1.3", "0.1.2")).toBe(1);
        expect(compareVersions("0.1.2", "0.1.2")).toBe(0);
        expect(compareVersions("0.1.1", "0.1.2")).toBe(-1);
        expect(compareVersions("v0.2", "0.1.9")).toBe(1);
        expect(compareVersions("0.1", "0.1.0")).toBe(0);
    });
});
