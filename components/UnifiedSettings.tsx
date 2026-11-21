import { Card } from "@components/Card";
import { Paragraph } from "@components/Paragraph";

import { GITHUB_RELEASE_URL, PLUGIN_AUTHOR, PLUGIN_VERSION, UPDATE_CHECK_URL } from "../constants";
import type { UpdateTarget } from "../foundation/core/updates";
import {
    FoundationAuthorPanel,
    FoundationLogViewer,
    FoundationPatchStatus,
    FoundationUpdatePanel,
} from "../foundation/ui/components";
import { patchManifest } from "../patches";
import {
    type SettingFieldDefinition,
    SettingsApp,
    type UnifiedSettingsConfig,
    resetSettingKeys,
} from "../platform/settings";
import { definition, settings } from "../settings";

function field(
    key: string,
    label: string,
    description: string,
    info: string,
    extra: Partial<SettingFieldDefinition> = {}
): SettingFieldDefinition {
    return { key, label, description, info, ...extra };
}

const ALL_KEYS = Object.keys(definition.definition);

const UPDATE_TARGETS: readonly UpdateTarget[] = [
    {
        pluginName: "Manycord",
        version: PLUGIN_VERSION,
        checkUrl: UPDATE_CHECK_URL,
        releasesUrl: GITHUB_RELEASE_URL,
        changelogUrl: "https://github.com/zpt0/Manycord/blob/main/CHANGELOG.md",
    },
];

function ManycordAbout() {
    return (
        <Card className="vc-platform-settings-group-card">
            <div className="vc-platform-settings-about-stack">
                <Paragraph>
                    Removes the five-account switcher limit. Automatic release popups stay disabled;
                    the Updates tab checks the release feed only when you ask and never opens a
                    browser tab by itself.
                </Paragraph>
                <Paragraph>
                    The shared settings shell is identical to Clonecord and Questcord so navigation,
                    badges, info popovers and confirmation dialogs behave the same way.
                </Paragraph>
                <FoundationAuthorPanel authors={[PLUGIN_AUTHOR]} />
            </div>
        </Card>
    );
}

export const config: UnifiedSettingsConfig = {
    pluginName: "Manycord",
    version: PLUGIN_VERSION,
    tagline: "Use more than five accounts in Discord's built-in account switcher.",
    license: "MIT · zpt0.dev",
    sourceUrl: "https://github.com/zpt0/Manycord",
    updates: UPDATE_TARGETS,
    settings,
    definition: definition.definition,
    categories: [
        {
            id: "essential",
            title: "Essential",
            description: "The account limit control.",
            groups: [
                {
                    id: "manycord-limit",
                    title: "Account switcher",
                    fields: [
                        field(
                            "maxAccounts",
                            "Maximum accounts",
                            "Number of accounts that can be added, or 0 for no limit.",
                            "0 means unlimited. Whole numbers of 0 or greater are accepted. The change applies after a Discord restart.",
                            { width: "full", badge: "Restart", badgeTone: "warning" }
                        ),
                    ],
                },
            ],
        },
        {
            id: "general",
            title: "General",
            description: "Community and update-channel preferences.",
            groups: [
                {
                    id: "manycord-community",
                    title: "Community",
                    fields: [
                        field(
                            "discordServerJoin",
                            "Join support server",
                            "Join the Discord support server once.",
                            "Stored once per browser profile; after the first join Manycord stops prompting."
                        ),
                        field(
                            "goToUpdateChannel",
                            "Updates channel",
                            "Navigate to the updates channel on start.",
                            "Only used when the support server has not already been joined."
                        ),
                    ],
                },
            ],
        },
        {
            id: "updates",
            title: "Updates",
            description: "Release feed status and the current changelog.",
            groups: [
                {
                    id: "manycord-release-feed",
                    title: "Release feed",
                    description: "Checks GitHub Releases on demand and links to the changelog.",
                    render: () => <FoundationUpdatePanel targets={UPDATE_TARGETS} />,
                },
            ],
        },
        {
            id: "advanced",
            title: "Advanced",
            description: "Reset control for saved settings.",
            groups: [
                {
                    id: "manycord-reset",
                    title: "Reset",
                    description:
                        "The reset action asks for confirmation before changing saved values.",
                    actions: [
                        {
                            id: "reset-all-settings",
                            label: "Reset all settings",
                            description: "Restore every Manycord setting to its shipped default.",
                            info: "The one-time invite marker in localStorage is not changed.",
                            variant: "dangerSecondary",
                            run: () => resetSettingKeys(settings, definition.definition, ALL_KEYS),
                        },
                    ],
                },
            ],
        },
        {
            id: "developer",
            title: "Developer",
            description: "Foundation bridge, diagnostics and log verbosity.",
            groups: [
                {
                    id: "manycord-foundation",
                    title: "Foundation",
                    fields: [
                        field(
                            "foundationDiagnosticsEnabled",
                            "Diagnostics",
                            "Record and log foundation diagnostic events.",
                            "Records lifecycle and bridge events. This does not change the account switcher patch."
                        ),
                        field(
                            "foundationLogLevel",
                            "Log level",
                            "Minimum severity written to the Vencord log.",
                            "Warn is the shipped default. Debug is only useful together with diagnostic reporting.",
                            { width: "full" }
                        ),
                        field(
                            "foundationBridgeEnabled",
                            "Bridge",
                            "Allow registration with the optional plugin bridge.",
                            "Off by default. Manycord works without any other plugin.",
                            { badge: "Off by default", width: "full" }
                        ),
                    ],
                },
                {
                    id: "manycord-patch-status",
                    title: "Patch status",
                    description: "Load-time match status for every manifest patch.",
                    render: () => (
                        <FoundationPatchStatus
                            manifest={patchManifest}
                            pluginName="Manycord"
                            version={PLUGIN_VERSION}
                        />
                    ),
                },
                {
                    id: "manycord-log-viewer",
                    title: "Log viewer",
                    description: "Recent FoundationLogger entries with a level filter.",
                    render: FoundationLogViewer,
                },
            ],
        },
        {
            id: "about",
            title: "About",
            description: "Version, license and shared-ecosystem information.",
            groups: [
                {
                    id: "manycord-about",
                    title: "Manycord",
                    render: ManycordAbout,
                },
            ],
        },
    ],
};

export function ManycordUnifiedSettings() {
    return <SettingsApp config={config} />;
}
