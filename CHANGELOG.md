# Changelog

## v4.0.12 - Unreleased

### Added

- Per-model import controls on each individual model page so imports can be rerun without going back to the Models index

### Changed

- Model detail pages now show current import status, progress counts, and stop/re-run controls alongside the gallery
- App branding now reflects the v4.0.12 release

## v4.0.11 - Unreleased

### Changed

- Model gallery tiles now behave more naturally: photos open large on tile click, while videos preview in place on tile click and keep a dedicated fullscreen/open button
- App branding now reflects the v4.0.11 release

## v4.0.10 - Unreleased

### Added

- Settings control for locking the app automatically after a chosen period of inactivity
- Idle lock status messaging on the login page so users know why the app returned to login

### Changed

- App shell now watches for inactivity and triggers the existing safe logout flow instead of silently leaving sessions open
- Idle activity is shared across open tabs so one active tab keeps the app unlocked
- App branding now reflects the v4.0.10 release

## v4.0.9 - Unreleased

### Added

- Clear discovery-stage messaging for model imports so `0 of 0` no longer looks like a frozen job

### Changed

- Model imports now count files before generating thumbnails, so totals appear earlier and progress starts sooner
- The Models page and cards now show when an import is still discovering files instead of pretending nothing is happening

## v4.0.8 - Unreleased

### Added

- Mobile-friendly full-screen presentation for model photos and videos with inline metadata and cover selection controls

### Changed

- The model viewer now uses the full phone screen for opened assets instead of a desktop-style modal stack
- Swipe left and right is now better aligned with the mobile full-screen experience

## v4.0.7 - Unreleased

### Added

- Cancel controls for queued and actively running model imports directly from the Models UI
- A dedicated API path for safely stopping model imports without touching the main library scanner

### Changed

- Running model imports now surface a clear stopping state instead of looking frozen
- Cancelled model imports now leave a visible note on the model card so users know what happened

## v4.0.6 - Unreleased

### Added

- Stronger in-sheet feedback for bulk model imports so users can see when the app is scanning subfolders before queueing imports
- Clearer post-import guidance that model imports continue in the background after bulk creation

### Changed

- Models page now calls out failed imports separately and explains that background imports continue even if you leave the page

## v4.0.5 - Unreleased

### Added

- Compact thumbnail sizing so more media fits per row in both detailed and thumbnail views
- Thumbnail badge mode selection between library name and storyboard frame count
- Panic blur mode that can be armed from the header and triggered by the next keypress

### Changed

- Media filter controls now include thumbnail density and thumbnail badge display options

## v3.2.0 - Unreleased

### Added

- Scene scrubbing on the media detail page with a selected-scene preview
- Click-to-play from the selected storyboard scene with a dedicated action button
- Configurable media browser page sizes with 100 items per page as the default
- Route-level loading states for Dashboard, Libraries, Media, and Settings
- Settings system status panel for database, FFmpeg, FFprobe, and media-root health

### Changed

- App branding and documentation now reflect the v3.2 release
- Storyboard interaction on the detail page now behaves like a scrub timeline instead of a simple static grid
- Media browser now uses server-side paging instead of loading the whole result set at once
- Library, status, sort, view, and page-size controls on Media now apply immediately
- Running scans now clearly show when they resumed from a saved checkpoint

## v3.1.0 - Unreleased

### Added

- User-created auto-tag rules in Settings
- Rule matching against filename, folder path, and library name
- Automatic rule-based tag application during scans

### Changed

- App branding and documentation now reflect the v3.1 release
- Settings now acts as the control surface for auto-tag rules

## v3.0.0 - Unreleased

### Added

- Manual media tags with PostgreSQL persistence
- Add and remove tag actions from the media detail page
- Tag chips on media cards and detail pages
- Tag filtering in the media browser

### Changed

- App branding and documentation now reflect the v3.0 release
- Media search now also matches against tag names

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
