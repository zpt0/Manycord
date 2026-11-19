import { React } from "@webpack/common";

import { GITHUB_RELEASE_URL, PLUGIN_VERSION, UPDATE_CHECK_URL } from "../constants";

function compareVersions(a: string, b: string): number {
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

export function VersionDisplay() {
    const [status, setStatus] = React.useState<string | null>(null);
    const [busy, setBusy] = React.useState(false);

    const check = React.useCallback(async () => {
        if (!UPDATE_CHECK_URL) {
            setStatus("No update URL configured");
            return;
        }

        setBusy(true);
        setStatus("Checking...");

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(UPDATE_CHECK_URL, {
                signal: controller.signal,
                headers: { Accept: "application/vnd.github.v3+json" },
            });
            clearTimeout(timeout);

            if (!response.ok) {
                setStatus(response.status === 404 ? "No public release feed (local build)" : "Check failed");
                return;
            }

            const data = await response.json();
            const raw = (data?.tag_name || data?.name || "").toString();
            const latest = raw.replace(/^v/i, "").trim();
            if (!latest) {
                setStatus("No public release feed (local build)");
                return;
            }

            setStatus(
                compareVersions(latest, PLUGIN_VERSION) > 0
                    ? `Update available: v${latest}`
                    : "You're up to date!"
            );
        } catch {
            setStatus("Check failed");
        } finally {
            setBusy(false);
        }
    }, []);

    return (
        <div>
            <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF" }}>Manycord</div>
                <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
                    Version: <span style={{ color: "#FFFFFF", fontWeight: 600 }}>v{PLUGIN_VERSION}</span>
                    {status != null && <> • {status}</>}
                </div>
            </div>
            <button
                onClick={check}
                disabled={busy}
                style={{
                    background: "var(--brand-experiment, #5865f2)",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.6 : 1,
                }}
            >
                {busy ? "Checking..." : "Check for Updates"}
            </button>
            {GITHUB_RELEASE_URL && (
                <div style={{ marginTop: 8 }}>
                    <a
                        href={GITHUB_RELEASE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--brand-experiment, #5865f2)", fontSize: 13 }}
                    >
                        View Releases
                    </a>
                </div>
            )}
        </div>
    );
}
