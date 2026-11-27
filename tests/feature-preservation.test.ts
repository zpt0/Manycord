import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string): string {
    return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("Manycord feature preservation", () => {
    it("preserves plugin identity, license, and metadata", () => {
        const pkg = JSON.parse(source("package.json"));
        expect(pkg.name).toBe("manycord");
        expect(pkg.version).toBe("0.1.1");
        expect(pkg.license).toBe("MIT");

        const index = source("index.ts");
        for (const text of [
            'name: "Manycord"',
            '"Remove or customize the five-account limit in Discord\'s built-in account switcher."',
            "id: 299670891875270656n",
            'name: "zpt0.dev"',
            'tags: ["Utility"]',
        ]) {
            expect(index, text).toContain(text);
        }
    });

    it("keeps version sources aligned at 0.1.1", () => {
        expect(source("constants.ts")).toContain('export const PLUGIN_VERSION = "0.1.1";');
        expect(source("package.json")).toContain('"version": "0.1.1"');
        expect(source("CHANGELOG.md")).toContain("## [0.1.1]");
        expect(source("CHANGELOG.md")).not.toContain("## [0.1.5]");
        expect(source("CHANGELOG.md")).not.toContain("## [0.1.6]");
    });

    it("preserves update-check and invite constants", () => {
        const constants = source("constants.ts");
        const index = source("index.ts");
        expect(constants).toContain('export const GITHUB_REPO = "zpt0/Manycord";');
        expect(constants).toContain("/releases/latest");
        expect(index).toContain('const DISCORD_INVITE = "https://discord.gg/sKTrAMctcy";');
        expect(index).toContain('const INVITE_JOINED_KEY = "zpt0-discord-invite-joined";');
        expect(index).toContain('window.open(DISCORD_INVITE, "_blank")');
    });

    it("never auto-opens the release page", () => {
        expect(source("constants.ts")).toContain("export const UPDATE_CHECK_ENABLED = false;");
        expect(source("updateCheck.ts")).not.toContain("window.open(GITHUB_RELEASE_URL");
    });

    it("preserves the exact patch anchors and replacement target", () => {
        const patches = source("patches.ts");
        for (const text of [
            '"pushSyncToken:null}),"',
            "/(\\).length>)5/",
            "/(\\i.splice\\()5/",
            '"getCurrentUser(),multiAccountUsers"',
            "/(maxNumAccounts:)5/",
            "/(\\i.length(?:<|>=))5/g",
            '"$1$self.getMaxAccounts()"',
        ]) {
            expect(patches, text).toContain(text);
        }
        expect(source("index.ts")).toContain("getMaxAccounts(): number");
    });

    it("keeps the lightweight foundation surface", () => {
        const index = source("index.ts");
        const settings = source("settings.ts");
        expect(settings).toContain('defineFoundationSettings("Manycord"');
        expect(settings).not.toContain("showUpdateNotifications");
        expect(index).not.toContain("managedStyle");
        expect(index).toContain(
            "settingsAboutComponent: () => React.createElement(ManycordUnifiedSettings)"
        );
        expect(index).not.toContain("pluginRuntime");
        expect(index).not.toContain('from "./foundation"');
        expect(index).not.toContain('from "./foundation/ui');
    });

    it("retains the MIT license notice for copied foundation code", () => {
        const license = source("foundation/LICENSE");
        expect(license).toContain("MIT License");
        expect(license).toContain("Permission is hereby granted, free of charge");
    });
});
