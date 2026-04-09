# Changelog

## v2.0.1 - Unreleased

### Added

- Storyboard preview frame generation for videos using FFmpeg
- Media detail storyboard strip built from generated preview frames

### Changed

- Desktop media cards now use storyboard frames for richer hover previews
- In-card video playback sizing is more phone-friendly on mobile screens

## v2.0.0 - 2026-04-09

### Added

- Persistent library management backed by PostgreSQL
- Server-side folder chooser limited to configured allowed roots
- Recursive library scanning for common video formats
- Media record persistence with missing-file tracking
- Media browser with search, filter, and sort
- Poster thumbnail generation with FFmpeg
- In-card media playback support

### Changed

- Improved mobile usability across navigation, library flows, media browsing, and modal layouts
- Updated branding and documentation to reflect the v2 release

### Fixed

- Build compatibility issues around library scan status typing
- Deployment/documentation flow for local self-hosted and Proxmox LXC setups
