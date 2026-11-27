# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-11-27

### Fixed

- Discord no longer opens a browser tab with our support-server invite on every start for accounts that are already in that server. The old localStorage dedupe flag was not reliable enough to prevent it.
- Membership is now checked against Discord's guild list (`1508481905291558942`); existing members are never shown the invite, no matter what any stored flag says.
- Invite handling waits for `CONNECTION_OPEN` so the guild list is loaded before deciding, and the membership check always wins over the stored dedupe key.

### Changed

- Plugin version and release tag aligned at `0.1.1`.

## [0.1.0] - 2026-11-09

### Added

- Initial release of Manycord, a Vencord userplugin that removes Discord's five-account switcher limit.
- Patches that lift the hardcoded account-count restrictions in Discord's account switcher.
- Configurable `Max Accounts` setting; set it to `0` for unlimited accounts.
- Discord-style plugin icon.
- CI workflow with typecheck, lint and formatting checks.
- Type stubs and `tsconfig.template.json` for standalone type-checking.

[0.1.1]: https://github.com/zpt0/manycord/releases/tag/v0.1.1
[0.1.0]: https://github.com/zpt0/manycord/releases/tag/v0.1.0
