"use client";

import { useRouter } from "next/navigation";
import type {
  MediaSort,
  MediaThumbnailBadgeMode,
  MediaThumbnailDensity,
  MediaViewMode,
} from "@/lib/data/media";

type MediaFilterBarProps = {
  filters: {
    search: string;
    libraryId: string;
    missing: string;
    folder: string;
    tag: string;
    sort: MediaSort;
    view: MediaViewMode;
    thumbnailDensity: MediaThumbnailDensity;
    thumbnailBadge: MediaThumbnailBadgeMode;
    pageSize: number;
  };
  libraries: Array<{
    id: string;
    name: string;
  }>;
  folders: string[];
  tags: string[];
  pageSizeOptions: number[];
};

export function MediaFilterBar({
  filters,
  libraries,
  folders,
  tags,
  pageSizeOptions,
}: MediaFilterBarProps) {
  const router = useRouter();
  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.libraryId) ||
    filters.missing !== "all" ||
    Boolean(filters.folder) ||
    Boolean(filters.tag) ||
    filters.sort !== "updated-desc" ||
    filters.view !== "details" ||
    filters.thumbnailDensity !== "standard" ||
    filters.thumbnailBadge !== "library" ||
    filters.pageSize !== 100;

  return (
    <form
      className="rounded-[28px] border border-white/10 bg-surface/80 p-4 shadow-panel sm:rounded-[32px] sm:p-6"
      onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);
        const storedFilters = {
          search: String(formData.get("search") ?? ""),
          libraryId: String(formData.get("libraryId") ?? ""),
          missing: String(formData.get("missing") ?? "all"),
          folder: String(formData.get("folder") ?? ""),
          tag: String(formData.get("tag") ?? ""),
          sort: String(formData.get("sort") ?? "updated-desc"),
          view: String(formData.get("view") ?? "details"),
          thumbnailDensity: String(formData.get("thumbnailDensity") ?? "standard"),
          thumbnailBadge: String(formData.get("thumbnailBadge") ?? "library"),
          pageSize: Number(formData.get("pageSize") ?? 100),
        };

        document.cookie = `vaultframe-media-filters=${encodeURIComponent(JSON.stringify(storedFilters))}; Path=/; Max-Age=2592000; SameSite=Lax`;
      }}
    >
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_0.8fr]">
        <Field label="Search">
          <input
            name="search"
            defaultValue={filters.search}
            placeholder="Search title, filename, or folder"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/40"
          />
        </Field>

        <Field label="Library">
          <select
            name="libraryId"
            defaultValue={filters.libraryId}
            onChange={(event) => {
              event.currentTarget.form?.requestSubmit();
            }}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40 [&_option]:bg-[#0c1016] [&_option]:text-white"
          >
            <option value="">All libraries</option>
            {libraries.map((library) => (
              <option key={library.id} value={library.id}>
                {library.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            name="missing"
            defaultValue={filters.missing}
            onChange={(event) => {
              event.currentTarget.form?.requestSubmit();
            }}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40 [&_option]:bg-[#0c1016] [&_option]:text-white"
          >
            <option value="all">All items</option>
            <option value="available">Available only</option>
            <option value="missing">Missing only</option>
          </select>
        </Field>

        <Field label="Folder">
          <input
            name="folder"
            list="folder-options"
            defaultValue={filters.folder}
            placeholder="Any folder"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/40"
          />
          <datalist id="folder-options">
            {folders.map((folder) => (
              <option key={folder} value={folder} />
            ))}
          </datalist>
        </Field>

        <Field label="Tag">
          <input
            name="tag"
            list="tag-options"
            defaultValue={filters.tag}
            placeholder="Any tag"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/40"
          />
          <datalist id="tag-options">
            {tags.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </Field>

        <Field label="Sort">
          <select
            name="sort"
            defaultValue={filters.sort}
            onChange={(event) => {
              event.currentTarget.form?.requestSubmit();
            }}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40 [&_option]:bg-[#0c1016] [&_option]:text-white"
          >
            <option value="updated-desc">Newest updated</option>
            <option value="updated-asc">Oldest updated</option>
            <option value="created-desc">Newest added</option>
            <option value="created-asc">Oldest added</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="filename-asc">Filename A-Z</option>
            <option value="filename-desc">Filename Z-A</option>
            <option value="library-asc">Library A-Z</option>
            <option value="folder-asc">Folder A-Z</option>
            <option value="size-desc">Largest first</option>
            <option value="size-asc">Smallest first</option>
          </select>
        </Field>

        <Field label="View">
          <select
            name="view"
            defaultValue={filters.view}
            onChange={(event) => {
              event.currentTarget.form?.requestSubmit();
            }}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40 [&_option]:bg-[#0c1016] [&_option]:text-white"
          >
            <option value="details">Detailed cards</option>
            <option value="thumbnails">Thumbnail only</option>
          </select>
        </Field>

        <Field label="Thumb size">
          <select
            name="thumbnailDensity"
            defaultValue={filters.thumbnailDensity}
            onChange={(event) => {
              event.currentTarget.form?.requestSubmit();
            }}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40 [&_option]:bg-[#0c1016] [&_option]:text-white"
          >
            <option value="standard">Standard</option>
            <option value="compact">Compact</option>
          </select>
        </Field>

        <Field label="Thumb badge">
          <select
            name="thumbnailBadge"
            defaultValue={filters.thumbnailBadge}
            onChange={(event) => {
              event.currentTarget.form?.requestSubmit();
            }}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40 [&_option]:bg-[#0c1016] [&_option]:text-white"
          >
            <option value="library">Library</option>
            <option value="frames">Frames</option>
          </select>
        </Field>

        <Field label="Per page">
          <select
            name="pageSize"
            defaultValue={String(filters.pageSize)}
            onChange={(event) => {
              event.currentTarget.form?.requestSubmit();
            }}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40 [&_option]:bg-[#0c1016] [&_option]:text-white"
          >
            {pageSizeOptions.map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          {hasActiveFilters ? "Filters applied to the current media library view." : "Filter scanned media records stored in PostgreSQL."}
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              document.cookie =
                "vaultframe-media-filters=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
              router.push("/media");
              router.refresh();
            }}
            className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
          >
            Reset
          </button>
          <button
            type="submit"
            className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
          >
            Apply
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}
