# Changelog

## [0.2.0] - 2025-10-07

### Added - TypeScript Rewrite
- ✨ **Full TypeScript support** with comprehensive type definitions
- 📊 **Severity levels** - Issues categorized as CRITICAL, HIGH, MEDIUM, LOW
- 🎨 **Colored console output** - Beautiful formatting with ANSI colors
- 📝 **JSON output option** - Use `--json` flag for structured output
- 🔍 **Enhanced parsing** - Better extraction of issues from Codex output
- 📋 **Improved CLI** - Added `--verbose`, `--config`, `--help` flags
- ✅ **Comprehensive tests** - Unit and integration tests in TypeScript
- 📊 **Summary statistics** - Issue counts by severity level
- 🎯 **Better error handling** - Graceful handling of missing configs and errors
- 📦 **Type declarations** - Full `.d.ts` files for library usage

### Changed
- Migrated from JavaScript to TypeScript
- Updated build system to use `tsc`
- Improved output formatting with sections and colors
- Better structured result objects with typed interfaces
- Enhanced test coverage with dedicated unit tests

### Improved
- More robust parsing of Codex output
- Better detection of safe endpoints
- Clearer separation of concerns (types, colors, formatter, parser)
- Modular code structure for easier maintenance

## [0.1.0] - Initial Release

### Added
- Basic tenant isolation detection for FastAPI apps
- Integration with Codex SDK
- Configuration file support
- Test fixtures
- Basic integration tests
