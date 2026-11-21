import { afterEach } from "vitest";

import { __settingsStore, __webpackSearchResults, toasts } from "./vencord-mocks";

afterEach(() => {
    __settingsStore.reset();
    toasts.length = 0;
    for (const key of Object.keys(__webpackSearchResults)) delete __webpackSearchResults[key];
});
