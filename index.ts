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

import definePlugin from "@utils/types";
import { GuildStore, React, UserStore } from "@webpack/common";

import { ManycordUnifiedSettings } from "./components/UnifiedSettings";
import { SUPPORT_GUILD_ID } from "./constants";
import { patchManifest } from "./patches";
import { settings } from "./settings";
import { startUpdateCheck, stopUpdateCheck } from "./updateCheck";

const DISCORD_INVITE = "https://discord.gg/sKTrAMctcy";
const INVITE_JOINED_KEY = "zpt0-discord-invite-joined";

let inviteHandled = false;

function isValidMaxAccounts(value: unknown): value is number {
    return (
        typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0
    );
}

// localStorage is not available in every context Vencord runs plugins in
// (for example, a restricted window or the splash screen). Guard every access
// so a missing/denied storage never prevents the plugin from starting.
function getInviteJoined(): string | null {
    try {
        return globalThis.localStorage?.getItem(INVITE_JOINED_KEY) ?? null;
    } catch {
        return null;
    }
}

function markInviteJoined(): void {
    try {
        globalThis.localStorage?.setItem(INVITE_JOINED_KEY, "1");
    } catch {}
}

/** Real guild membership is the source of truth; localStorage alone is not reliable. */
function isInSupportServer(): boolean {
    try {
        if (GuildStore?.getGuild?.(SUPPORT_GUILD_ID)) return true;
        return Boolean(GuildStore?.getGuilds?.()?.[SUPPORT_GUILD_ID]);
    } catch {
        return false;
    }
}

function isLoggedIn(): boolean {
    try {
        return Boolean(UserStore?.getCurrentUser?.());
    } catch {
        return false;
    }
}

/**
 * Members never see the invite at all. The localStorage dedupe key is only a
 * fallback for users who are genuinely not in the support server yet.
 */
function maybeOpenInvite(): void {
    if (inviteHandled) return;

    if (isInSupportServer()) {
        inviteHandled = true;
        return;
    }

    // Discord fills its guild stores on CONNECTION_OPEN. Before that an empty
    // guild list would look like "not a member" even for actual members.
    if (!isLoggedIn()) return;

    inviteHandled = true;
    let opened = false;

    if (settings.store.discordServerJoin) {
        try {
            if (!getInviteJoined()) {
                window.open(DISCORD_INVITE, "_blank");
                markInviteJoined();
            }
        } catch {
        } finally {
            opened = true;
        }
    }

    if (settings.store.goToUpdateChannel && !opened && !getInviteJoined()) {
        try {
            window.open(DISCORD_INVITE, "_blank");
        } catch {}
    }
}

export default definePlugin({
    name: "Manycord",
    description:
        "Remove or customize the five-account limit in Discord's built-in account switcher.",
    authors: [
        {
            id: 299670891875270656n,
            name: "zpt0.dev",
        },
    ],
    tags: ["Utility"],
    settings,
    settingsAboutComponent: () => React.createElement(ManycordUnifiedSettings),
    patches: patchManifest.toVencordPatches("Manycord"),
    getMaxAccounts(): number {
        const value: unknown = settings.store.maxAccounts;
        if (!isValidMaxAccounts(value)) return Infinity;
        return value === 0 ? Infinity : value;
    },
    flux: {
        CONNECTION_OPEN() {
            maybeOpenInvite();
        },
    },
    start() {
        startUpdateCheck();
        maybeOpenInvite();
    },
    stop(): Promise<void> {
        inviteHandled = false;
        return stopUpdateCheck();
    },
});
