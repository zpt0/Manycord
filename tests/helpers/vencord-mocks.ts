export enum OptionType {
    STRING = 0,
    NUMBER = 1,
    BIGINT = 2,
    BOOLEAN = 3,
    SELECT = 4,
    SLIDER = 5,
    COMPONENT = 6,
    CUSTOM = 7,
}

export default function definePlugin(plugin: any): any {
    return plugin;
}

class MockSettingsStore {
    plain: any = { plugins: {} };
    store: any = {};
    private listeners = new Map<string, Set<(data: unknown, path: string) => void>>();

    addChangeListener(path: string, cb: (data: unknown, path: string) => void): void {
        this.addListener(path, cb);
    }

    removeChangeListener(path: string, cb: (data: unknown, path: string) => void): void {
        this.removeListener(path, cb);
    }

    addPrefixChangeListener(prefix: string, cb: (data: unknown, path: string) => void): void {
        this.addListener(prefix, cb);
    }

    removePrefixChangeListener(prefix: string, cb: (data: unknown, path: string) => void): void {
        this.removeListener(prefix, cb);
    }

    addGlobalChangeListener(cb: (data: unknown, path: string) => void): void {
        this.addListener("*", cb);
    }

    removeGlobalChangeListener(cb: (data: unknown, path: string) => void): void {
        this.removeListener("*", cb);
    }

    markAsChanged(): void {}

    emit(path: string): void {
        for (const [prefix, callbacks] of this.listeners) {
            if (prefix !== "*" && path !== prefix && !path.startsWith(`${prefix}.`)) continue;
            for (const cb of Array.from(callbacks)) cb(this.plain, path);
        }
    }

    reset(): void {
        this.plain = { plugins: {} };
        this.store = {};
        this.listeners.clear();
    }

    private addListener(prefix: string, cb: (data: unknown, path: string) => void): void {
        const callbacks = this.listeners.get(prefix) ?? new Set();
        callbacks.add(cb);
        this.listeners.set(prefix, callbacks);
    }

    private removeListener(prefix: string, cb: (data: unknown, path: string) => void): void {
        this.listeners.get(prefix)?.delete(cb);
    }
}

export const __settingsStore = new MockSettingsStore();

export const SettingsStore = __settingsStore;

export function useSettings(): any {
    return __settingsStore.plain;
}

export function setPluginSettings(pluginName: string, values: Record<string, unknown>): void {
    __settingsStore.plain.plugins[pluginName] = { ...values };
    __settingsStore.emit(`plugins.${pluginName}`);
}

export function definePluginSettings(def: any): any {
    return {
        def,
        store: {},
        plain: {},
        pluginName: "",
        use: () => ({}),
        withPrivateSettings() {
            return this;
        },
    };
}

export class Logger {
    constructor(
        readonly name: string,
        readonly color?: string
    ) {}
    debug(..._args: unknown[]) {}
    info(..._args: unknown[]) {}
    warn(..._args: unknown[]) {}
    error(..._args: unknown[]) {}
}

export const DataStore = {
    get: async () => undefined,
    set: async () => undefined,
    delete: async () => undefined,
    del: async () => undefined,
    keys: async () => [],
    entries: async () => [],
};

export function find(_filter: (module: unknown) => boolean): unknown {
    return undefined;
}

export const __webpackSearchResults: Record<string, Record<number, unknown>> = {};
export function search(...code: Array<string | RegExp>): Record<number, unknown> {
    return __webpackSearchResults[code.map((entry) => String(entry)).join("|")] ?? {};
}

export function findByPropsLazy(..._props: string[]): any {
    return {};
}

function passthrough(name: string) {
    const Component = (props: any) => props?.children ?? null;
    Component.displayName = name;
    return Component;
}

export const Card = passthrough("Card");
export const Heading = passthrough("Heading");
export const Paragraph = passthrough("Paragraph");
export const Text = passthrough("Text");
export const Switch = passthrough("Switch");
export const Button = passthrough("Button");
export const FavoriteButton = passthrough("FavoriteButton");
export const GithubButton = passthrough("GithubButton");
export const Modal = passthrough("Modal");
export const ConfirmModal = passthrough("ConfirmModal");
export const Select = passthrough("Select");
export const Slider = passthrough("Slider");
export const ColorPicker = passthrough("ColorPicker");

export const React = {
    createElement: (type: unknown, props: any, ...children: unknown[]) => ({
        type,
        props,
        children,
    }),
    useState: (initial: unknown) => [initial, () => {}],
    useCallback: (fn: unknown) => fn,
    useEffect: () => {},
    useRef: (initial: unknown) => ({ current: initial }),
    useMemo: (fn: () => unknown) => fn(),
};

export const ReactDOM = {
    createPortal: (children: unknown) => children,
};

export function openModal(_render: unknown): string {
    return "modal";
}

export function closeModal(_key: string): void {}

export function closeAllModals(): void {}

export const toasts: Record<string, unknown>[] = [];
export function showToast(toast: Record<string, unknown>): void {
    toasts.push(toast);
}

export const __contributorModalUsers: unknown[] = [];
export function openContributorModal(user: unknown): void {
    __contributorModalUsers.push(user);
}

export const UserStore = {
    getCurrentUser: () => undefined,
    getUser: (_id: string) => undefined,
    getUsers: () => ({}) as Record<string, any>,
};

export function waitFor(
    _filter: (module: unknown) => boolean,
    _callback: (module: unknown) => void
): void {}
