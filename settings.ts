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

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { VersionDisplay } from "./components/VersionDisplay";

export const settings = definePluginSettings({
    versionInfo: {
        type: OptionType.COMPONENT,
        description: "",
        component: VersionDisplay,
    },
    showUpdateNotifications: {
        type: OptionType.BOOLEAN,
        description: "Show notifications when a new version is available",
        default: true,
    },
    discordServerJoin: {
        type: OptionType.BOOLEAN,
        description: "Join the Discord support server once",
        default: true,
    },
    goToUpdateChannel: {
        type: OptionType.BOOLEAN,
        description: "Navigate to the updates channel on start",
        default: true,
    },
    maxAccounts: {
        description: "Number of accounts that can be added, or 0 for no limit",
        default: 0,
        type: OptionType.NUMBER,
        restartNeeded: true,
    },
});
