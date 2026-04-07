"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Folder, FolderOpen, LoaderCircle, RefreshCw, X } from "lucide-react";
import type { FolderBrowseResponse } from "@/lib/server/folder-browser";

type FolderChooserModalProps = {
  open: boolean;
  initialPath?: string;
  onClose: () => void;
  onSelect: (path: string) => void;
};

export function FolderChooserModal({
  open,
  initialPath,
  onClose,
  onSelect,
}: FolderChooserModalProps) {
  const [data, setData] = useState<FolderBrowseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [requestPath, setRequestPath] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setRequestPath(initialPath?.trim() ? initialPath.trim() : null);
  }, [initialPath, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadFolders() {
      setLoading(true);
      setError(null);

      try {
        const params = requestPath ? `?path=${encodeURIComponent(requestPath)}` : "";
        const response = await fetch(`/api/folders${params}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as FolderBrowseResponse | { error?: string };

        if (!response.ok || hasError(payload)) {
          throw new Error(hasError(payload) ? payload.error : "Unable to browse folders.");
        }

        const folderPayload = payload as FolderBrowseResponse;

        if (!cancelled) {
          setData(folderPayload);
          setSelectedPath(folderPayload.mode === "folder" ? folderPayload.currentPath : null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setData(null);
          setSelectedPath(null);
          setError(loadError instanceof Error ? loadError.message : "Unable to browse folders.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadFolders();

    return () => {
      cancelled = true;
    };
  }, [open, requestPath]);

  const canConfirm = useMemo(
    () => Boolean(data && data.mode === "folder" && selectedPath),
    [data, selectedPath],
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#090c11] shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent">Choose folder</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Browse allowed server directories
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Only directories inside configured allowed roots are visible here.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-slate-400 transition hover:text-white"
            aria-label="Close folder chooser"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-[420px] min-w-0 flex-1 flex-col px-6 py-5">
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current selection</p>
            <p className="mt-2 break-all text-sm text-white">
              {selectedPath || "Choose a root or folder to continue"}
            </p>
          </div>

          {data?.mode === "folder" ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {data.breadcrumbs.map((breadcrumb, index) => (
                <button
                  key={breadcrumb.path}
                  type="button"
                  onClick={() => setRequestPath(breadcrumb.path)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-slate-500" /> : null}
                  <span>{breadcrumb.name}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setRequestPath(data?.mode === "folder" && data.canGoUp ? data.parentPath : null)
              }
              disabled={!data || data.mode !== "folder" || !data.canGoUp || loading}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Go Up
            </button>

            <button
              type="button"
              onClick={() =>
                setRequestPath(
                  data?.mode === "folder" ? data.currentPath : requestPath ?? initialPath?.trim() ?? null,
                )
              }
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-surface/80">
            {loading ? (
              <div className="flex h-full items-center justify-center gap-3 text-slate-300">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                <span>Loading folders...</span>
              </div>
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <p className="text-lg font-medium text-white">{error}</p>
                <button
                  type="button"
                  onClick={() => setRequestPath(requestPath)}
                  className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Try again
                </button>
              </div>
            ) : data?.mode === "roots" ? (
              <div className="max-h-[52vh] overflow-y-auto p-3">
                {data.roots.length === 0 ? (
                  <div className="flex h-full items-center justify-center px-6 text-center">
                    <p className="max-w-lg text-sm leading-7 text-slate-400">
                      {data.message || "No allowed roots are available."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {data.roots.map((root) => (
                      <button
                        key={root.path}
                        type="button"
                        onClick={() => setRequestPath(root.path)}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-accent/30 hover:bg-accent/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                            <FolderOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{root.name}</p>
                            <p className="mt-1 text-sm text-slate-400">{root.path}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : data?.mode === "folder" ? (
              <div className="max-h-[52vh] overflow-y-auto p-3">
                <button
                  type="button"
                  onClick={() => setSelectedPath(data.currentPath)}
                  className={`mb-3 flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                    selectedPath === data.currentPath
                      ? "border-accent/30 bg-accent/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Select current folder</p>
                    <p className="mt-1 break-all text-sm text-slate-400">{data.currentPath}</p>
                  </div>
                </button>

                {data.folders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-slate-400">
                    {data.message || "No subfolders found."}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {data.folders.map((folder) => (
                      <div
                        key={folder.path}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-4 transition ${
                          selectedPath === folder.path
                            ? "border-accent/30 bg-accent/10"
                            : "border-white/10 bg-white/[0.03]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedPath(folder.path)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.04] text-slate-300">
                            <Folder className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">{folder.name}</p>
                            <p className="mt-1 truncate text-sm text-slate-400">{folder.path}</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRequestPath(folder.path)}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-5">
          <p className="text-sm text-slate-400">
            {selectedPath ? `Selected: ${selectedPath}` : "Select the current folder or a highlighted child folder."}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedPath) {
                  onSelect(selectedPath);
                  onClose();
                }
              }}
              disabled={!canConfirm}
              className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use selected folder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function hasError(payload: FolderBrowseResponse | { error?: string }): payload is { error: string } {
  return typeof (payload as { error?: string }).error === "string";
}
