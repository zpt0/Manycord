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

import { definePatchManifest } from "./foundation/core/patches";

/**
 * The original Manycord patches, expressed through the copied foundation
 * manifest. Find strings, regexes, replacements, and flags are unchanged.
 */
export const patchManifest = definePatchManifest([
    {
        id: "account-switcher-sync-token",
        description: "Lift the five-account limit in the account-switcher token path",
        module: "multiAccountUsers",
        patch: {
            find: "pushSyncToken:null}),",
            replacement: [
                {
                    match: /(\).length>)5/,
                    replace: "$1$self.getMaxAccounts()",
                },
                {
                    match: /(\i.splice\()5/,
                    replace: "$1$self.getMaxAccounts()",
                },
            ],
        },
        expectations: {
            find: { min: 1, max: 1 },
            replacements: { min: 1, max: 1 },
        },
    },
    {
        id: "account-switcher-render",
        description: "Lift the five-account limit in the account-switcher render path",
        module: "AccountSwitcher",
        patch: {
            find: "getCurrentUser(),multiAccountUsers",
            replacement: [
                {
                    match: /(maxNumAccounts:)5/,
                    replace: "$1$self.getMaxAccounts()",
                },
                {
                    match: /(\i.length(?:<|>=))5/g,
                    replace: "$1$self.getMaxAccounts()",
                },
            ],
        },
        expectations: {
            find: { min: 1, max: 1 },
            replacements: { min: 1, max: 1 },
        },
    },
]);
