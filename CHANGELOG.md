# Changelog

## 2.0.1

This release cleans VibeForge up into a sharper CLI.

### Changed

- Version is consistent across package metadata, CLI output, dashboard branding, and built files.
- The public command list was trimmed to commands that are useful and maintained.
- README and command docs were rewritten in a practical, human tone.
- Added a full usage guide at `docs/guide.md`.
- Added `npm run release:check` for format, lint, typecheck, test, and build verification.
- Added npm `files` metadata so publishing ships only the package surface that matters.

### Removed

Removed old command modules that made the tool feel messy or duplicated better workflows:

- `alias`
- `blueprint`
- `branch-context`
- `compare`
- `deps`
- `inbox`
- `prompt-wizard`
- `rollback`
- `scaffold`
- `stats`
- `tag`

Also removed the old dashboard prompt-engineer and statistics pages.

### Fixed

- Dashboard file preview validates requested paths before reading files.
- Prompt file loading no longer allows files outside the workspace.
