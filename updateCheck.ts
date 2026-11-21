/*
 * Manycord, a Vencord plugin that removes Discord's five-account switcher limit
 * Copyright (c) 2026 zpt0.dev
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * MIT License for more details.
 *
 * You should have received a copy of the MIT License
 * along with this program. If not, see <https://opensource.org/licenses/MIT>.
 */

import { PLUGIN_VERSION, UPDATE_CHECK_ENABLED, UPDATE_CHECK_URL } from "./constants";
import { ResourceScope } from "./foundation/core/lifecycle";

const STARTUP_DELAY_MS = 5000;
const REQUEST_TIMEOUT_MS = 5000;
const STARTUP_TIMER_ID = "update-check:startup";
const REQUEST_TIMER_ID = "update-check:request";

type TimeoutHandle = ReturnType<typeof setTimeout>;

let scope: ResourceScope | null = null;

function registerTimeout(
    activeScope: ResourceScope,
    id: string,
    callback: () => void,
    delay: number
): TimeoutHandle {
    const handle = setTimeout(callback, delay);
    activeScope.register(id, handle, (value) => clearTimeout(value), { replace: true });
    return handle;
}

async function clearManagedTimeout(activeScope: ResourceScope, id: string): Promise<void> {
    if (!activeScope.has(id)) return;
    const handle = activeScope.get<TimeoutHandle>(id);
    if (handle !== undefined) clearTimeout(handle);
    await activeScope.dispose(id, "scope-reset");
}

/** Starts the optional update check with a foundation-owned resource scope. */
export function startUpdateCheck(): void {
    if (scope) void stopUpdateCheck();

    const activeScope = new ResourceScope();
    scope = activeScope;
    if (!UPDATE_CHECK_ENABLED) return;

    registerTimeout(
        activeScope,
        STARTUP_TIMER_ID,
        () => {
            void checkForUpdates(activeScope);
        },
        STARTUP_DELAY_MS
    );
}

/** Cancels the startup delay and any in-flight request timeout. */
export async function stopUpdateCheck(): Promise<void> {
    const activeScope = scope;
    scope = null;
    if (!activeScope) return;
    await activeScope.disposeAll("shutdown");
}

/** Preserves the original update-check behavior, with all timers owned by `activeScope`. */
export async function checkForUpdates(activeScope: ResourceScope): Promise<void> {
    if (!UPDATE_CHECK_ENABLED || activeScope.isDisposed) return;

    try {
        const controller = new AbortController();
        registerTimeout(
            activeScope,
            REQUEST_TIMER_ID,
            () => controller.abort(),
            REQUEST_TIMEOUT_MS
        );

        const response = await fetch(UPDATE_CHECK_URL, {
            signal: controller.signal,
            headers: { Accept: "application/vnd.github.v3+json" },
        });

        await clearManagedTimeout(activeScope, REQUEST_TIMER_ID);
        if (!response.ok || activeScope.isDisposed) return;

        const data = (await response.json()) as { tag_name?: unknown; name?: unknown };
        if (activeScope.isDisposed) return;

        let latestVersion = String(data.tag_name || data.name || "");
        latestVersion = latestVersion.replace(/^v/i, "").trim();
        if (!latestVersion) return;

        // Never open a browser tab. Version drift is preserved intentionally,
        // so this check stays inert even when a newer release tag is returned.
        void compareVersions(latestVersion, PLUGIN_VERSION);
    } catch {}
}

/** Dot-number comparison, unchanged from the original plugin. */
export function compareVersions(a: string, b: string): number {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] ?? 0;
        const y = pb[i] ?? 0;
        if (x > y) return 1;
        if (x < y) return -1;
    }
    return 0;
}
