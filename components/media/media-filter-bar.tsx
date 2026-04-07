import Link from "next/link";
import type { MediaSort } from "@/lib/data/media";

type MediaFilterBarProps = {
  filters: {
    search: string;
    libraryId: string;
    missing: string;
    folder: string;
    sort: MediaSort;
  };
  libraries: Array<{
    id: string;
    name: string;
  }>;
  folders: string[];
};

export function MediaFilterBar({ filters, libraries, folders }: MediaFilterBarProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.libraryId) ||
    filters.missing !== "all" ||
    Boolean(filters.folder) ||
    filters.sort !== "updated-desc";

  return (
    <form className="rounded-[32px] border border-white/10 bg-surface/80 p-6 shadow-panel">
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
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
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
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
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
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

        <Field label="Sort">
          <select
            name="sort"
            defaultValue={filters.sort}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
          >
            <option value="updated-desc">Newest updated</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="filename-asc">Filename A-Z</option>
          </select>
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          {hasActiveFilters ? "Filters applied to the current media library view." : "Filter scanned media records stored in PostgreSQL."}
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/media"
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
          >
            Reset
          </Link>
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
