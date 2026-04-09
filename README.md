# VaultFrame v2

VaultFrame v2 is a self-hosted media library app built with Next.js, TypeScript, Tailwind, Prisma, PostgreSQL, and Docker Compose.

See [CHANGELOG.md](./CHANGELOG.md) for the v2 change summary.

## What It Does

- Save library folders in PostgreSQL
- Browse allowed server folders with a server-side chooser
- Scan libraries recursively for video files
- Persist media records and missing-file status
- Generate poster thumbnails with FFmpeg
- Browse media with search, filters, and sorting

## Environment

Copy `.env.example` to `.env` and adjust values as needed.

- `DATABASE_URL`: PostgreSQL connection string used by Prisma
- `POSTGRES_DB`: database name for Docker Compose
- `POSTGRES_USER`: database user for Docker Compose
- `POSTGRES_PASSWORD`: database password for Docker Compose
- `APP_PORT`: published app port
- `ALLOWED_MEDIA_ROOTS`: colon-separated absolute server paths the folder chooser can browse
- `APP_DATA_DIR`: app-owned persistent data directory for generated assets like thumbnails

Example:

```env
ALLOWED_MEDIA_ROOTS="/media:/mnt/storage:/library"
APP_DATA_DIR="/app/data"
```

## Docker Compose

Start the app and database:

```bash
docker compose up --build
```

Then open:

```text
http://localhost:3000
```

## Volumes

- `postgres_data`: PostgreSQL data
- `app_data`: generated app data, including thumbnails

If your media lives on the host, mount those folders into the `app` container and include the mounted container paths in `ALLOWED_MEDIA_ROOTS`.

Example idea:

```yaml
services:
  app:
    volumes:
      - /host/media:/media:ro
      - app_data:/app/data
```

## Scan Workflow

1. Add a library with the folder chooser
2. Save the library
3. Click `Scan` on the Libraries page
4. Media records are upserted into PostgreSQL
5. Missing files stay in the database and are marked as missing
6. Poster thumbnails are generated when FFmpeg can read the video

## Notes

- FFmpeg is installed in the app container
- Thumbnails are stored under `/app/data/thumbnails`
- The folder chooser only browses paths inside `ALLOWED_MEDIA_ROOTS`
