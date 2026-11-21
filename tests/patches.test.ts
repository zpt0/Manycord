import { describe, expect, it } from "vitest";

import { patchManifest } from "../patches";
import { runPatchFixture } from "../foundation/core/patches";

// The foundation fixture runner treats string `find` values as regex source.
// Manycord's original find strings contain regex-significant characters, so the
// exact strings are asserted above and escaped only for fixture execution.
function fixtureEntry(index: number) {
    const entry = patchManifest.entries[index];
    const find = entry.patch.find;
    const findSource = typeof find === "string" ? find : find.source;
    const escapedFind = new RegExp(findSource.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    return { ...entry, patch: { ...entry.patch, find: escapedFind } };
}

describe("Manycord patch manifest", () => {
    it("emits the two original Vencord patches without manifest metadata", () => {
        const patches = patchManifest.toVencordPatches("Manycord") as any[];
        expect(patches).toHaveLength(2);

        for (const patch of patches) {
            expect(patch.plugin).toBe("Manycord");
            expect(Object.keys(patch)).not.toContain("id");
            expect(Object.keys(patch)).not.toContain("description");
            expect(Object.keys(patch)).not.toContain("module");
            expect(Object.keys(patch)).not.toContain("expectations");
        }

        expect(patches[0].find).toBe("pushSyncToken:null}),");
        expect(patches[0].noWarn).toBeUndefined();
        expect(patches[0].replacement).toHaveLength(2);
        expect(patches[0].replacement[0].match.source).toBe(/(\).length>)5/.source);
        expect(patches[0].replacement[0].replace).toBe("$1$self.getMaxAccounts()");
        expect(patches[0].replacement[1].match.source).toBe(/(\i.splice\()5/.source);
        expect(patches[0].replacement[1].replace).toBe("$1$self.getMaxAccounts()");

        expect(patches[1].find).toBe("getCurrentUser(),multiAccountUsers");
        expect(patches[1].noWarn).toBeUndefined();
        expect(patches[1].replacement).toHaveLength(2);
        expect(patches[1].replacement[0].match.source).toBe(/(maxNumAccounts:)5/.source);
        expect(patches[1].replacement[0].replace).toBe("$1$self.getMaxAccounts()");
        expect(patches[1].replacement[1].match.source).toBe(/(\i.length(?:<|>=))5/g.source);
        expect(patches[1].replacement[1].replace).toBe("$1$self.getMaxAccounts()");
    });

    it("matches and transforms the token-path fixture", () => {
        const source = `const marker="pushSyncToken:null}),";
if(getAccounts()).length>5){accounts.splice(5,1);}`;
        const expectedOutput = `const marker="pushSyncToken:null}),";
if(getAccounts()).length>Manycord.getMaxAccounts()){accounts.splice(Manycord.getMaxAccounts(),1);}`;

        const result = runPatchFixture(fixtureEntry(0), {
            name: "account switcher token path",
            source,
            expectedOutput,
            options: { pluginPath: "Manycord" },
        });

        expect(result.ok, result.issues.join("; ")).toBe(true);
        expect(result.findMatches).toBe(1);
        expect(result.replacementMatches).toEqual([1, 1]);
        expect(result.output).toBe(expectedOutput);
    });

    it("matches and transforms the render-path fixture", () => {
        const source = `const users=[getCurrentUser(),multiAccountUsers];
const cfg={maxNumAccounts:5};
if(users.length>=5){render(users);}`;
        const expectedOutput = `const users=[getCurrentUser(),multiAccountUsers];
const cfg={maxNumAccounts:Manycord.getMaxAccounts()};
if(users.length>=Manycord.getMaxAccounts()){render(users);}`;

        const result = runPatchFixture(fixtureEntry(1), {
            name: "account switcher render path",
            source,
            expectedOutput,
            options: { pluginPath: "Manycord" },
        });

        expect(result.ok, result.issues.join("; ")).toBe(true);
        expect(result.findMatches).toBe(1);
        expect(result.replacementMatches).toEqual([1, 1]);
        expect(result.output).toBe(expectedOutput);
    });
});
