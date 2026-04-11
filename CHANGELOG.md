# Changelog

## v2.1.0 - Unreleased

### Added

- Storyboard preview frame generation for videos using FFmpeg
- Adaptive storyboard frame counts based on video duration
- Clickable storyboard frames that start playback from the selected point
- Folder breadcrumb labels across the media browser and detail view
- Media duration and file-size metadata in the browser and detail panels
- Remembered media search, filter, and sort selections across visits
- Library scan queueing so only one scan runs at a time and the rest continue automatically

### Changed

- Desktop media cards now use storyboard frames for richer hover previews
- In-card video playback sizing is more phone-friendly on mobile screens
- Media detail playback now starts at the poster size and can be expanded on demand
- Scan progress persistence is throttled to reduce database churn on large libraries
- App branding and documentation now reflect the v2.1 release
- Library scans now queue behind the active scan instead of running in parallel

### Fixed

- Libraries now surface storage-unavailable warnings when the mounted media path cannot be reached
- Scan actions now stop early with a clear error when storage is offline or the library is disabled
- Media cards and detail pages now show clearer offline and missing-state badges

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
