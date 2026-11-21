import { OptionType } from "@utils/types";
import { describe, expect, it } from "vitest";

import { definition, settings } from "../settings";

const LEGACY_SETTINGS: Record<
    string,
    {
        type: OptionType;
        default: unknown;
        description: string;
        restartNeeded?: boolean;
        min?: number;
    }
> = {
    discordServerJoin: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Join the Discord support server once",
    },
    goToUpdateChannel: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Navigate to the updates channel on start",
    },
    maxAccounts: {
        type: OptionType.NUMBER,
        default: 0,
        description: "Number of accounts that can be added, or 0 for no limit",
        restartNeeded: true,
        min: 0,
    },
};

const FOUNDATION_KEYS = [
    "foundationBridgeEnabled",
    "foundationDiagnosticsEnabled",
    "foundationLogLevel",
];

describe("Manycord settings compatibility", () => {
    it("exports the foundation definition as the live Vencord settings object", () => {
        expect(settings).toBe(definition.settings);
        expect(settings.def).toBe(definition.definition);
        expect(definition.pluginName).toBe("Manycord");
    });

    it("preserves the three legacy settings exactly", () => {
        expect(Object.keys(LEGACY_SETTINGS)).toHaveLength(3);
        for (const [key, expected] of Object.entries(LEGACY_SETTINGS)) {
            const actual = definition.definition[key] as any;
            expect(actual, `missing ${key}`).toBeDefined();
            expect(actual.type, `${key}.type`).toBe(expected.type);
            expect(actual.default, `${key}.default`).toBe(expected.default);
            expect(actual.description, `${key}.description`).toBe(expected.description);
            if (expected.restartNeeded !== undefined) {
                expect(actual.restartNeeded, `${key}.restartNeeded`).toBe(expected.restartNeeded);
            }
            if (expected.min !== undefined) expect(actual.min, `${key}.min`).toBe(expected.min);
        }
    });

    it("adds only the reserved foundation settings", () => {
        expect(definition.keys).toHaveLength(6);
        for (const key of FOUNDATION_KEYS) expect(definition.keys).toContain(key);
        expect((definition.definition.foundationBridgeEnabled as any).default).toBe(false);
        expect((definition.definition.foundationDiagnosticsEnabled as any).default).toBe(false);
        expect((definition.definition.foundationLogLevel as any).type).toBe(OptionType.SELECT);
        expect((definition.definition.foundationLogLevel as any).options).toEqual(
            expect.arrayContaining([expect.objectContaining({ value: "warn", default: true })])
        );
    });

    it("does not adopt the orphan showUpdateNotifications setting", () => {
        expect(definition.keys).not.toContain("showUpdateNotifications");
    });

    it("validates numeric maxAccounts values", () => {
        const maxAccounts = definition.definition.maxAccounts as any;
        expect(maxAccounts.isValid.call(definition.settings, 0)).toBe(true);
        expect(maxAccounts.isValid.call(definition.settings, 12)).toBe(true);
        expect(maxAccounts.isValid.call(definition.settings, -1)).not.toBe(true);
        expect(maxAccounts.isValid.call(definition.settings, 1.5)).not.toBe(true);
        expect(maxAccounts.isValid.call(definition.settings, Number.NaN)).not.toBe(true);
        expect(maxAccounts.isValid.call(definition.settings, "5")).not.toBe(true);
    });

    it("records foundation metadata for every setting", () => {
        for (const key of definition.keys) {
            const meta = definition.metadata[key];
            expect(meta, `metadata for ${key}`).toBeDefined();
            expect(meta.section.length).toBeGreaterThan(0);
            expect(meta.readPaths.length).toBeGreaterThan(0);
        }
        expect(definition.metadata.maxAccounts.changeMode).toBe("restart");
    });

    it("keeps the compatibility changeMode aligned with restartNeeded", () => {
        expect(definition.definition.maxAccounts.restartNeeded).toBe(true);
        expect(definition.metadata.maxAccounts.changeMode).toBe("restart");
    });
});
