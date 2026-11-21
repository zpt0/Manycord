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

import { OptionType } from "@utils/types";

import { defineFoundationSettings } from "./foundation/settings/definition";
import type { FoundationSettingMeta } from "./foundation/settings/types";

function meta(
    section: FoundationSettingMeta["section"],
    order: number,
    readPaths: readonly string[],
    docs?: string
): FoundationSettingMeta {
    return { section, order, changeMode: "live", readPaths, docs };
}

export const definition = defineFoundationSettings("Manycord", {
    discordServerJoin: {
        description: "Join the Discord support server once",
        default: true,
        type: OptionType.BOOLEAN,
        foundation: meta("Behavior", 10, ["index.ts"], "Preserved legacy setting."),
    },
    goToUpdateChannel: {
        description: "Navigate to the updates channel on start",
        default: true,
        type: OptionType.BOOLEAN,
        foundation: meta("Behavior", 11, ["index.ts"], "Preserved legacy setting."),
    },
    maxAccounts: {
        description: "Number of accounts that can be added, or 0 for no limit",
        default: 0,
        type: OptionType.NUMBER,
        min: 0,
        restartNeeded: true,
        isValid(value): boolean | string {
            if (
                typeof value !== "number" ||
                !Number.isFinite(value) ||
                !Number.isInteger(value) ||
                value < 0
            ) {
                return "Enter a whole number of accounts, or 0 for no limit.";
            }
            return true;
        },
        foundation: {
            section: "Behavior",
            order: 12,
            changeMode: "restart",
            readPaths: ["index.ts"],
            docs: "Preserved legacy setting. 0 means Infinity; negative, fractional, and non-finite values are rejected.",
        },
    },
});

export const settings = definition.settings;
