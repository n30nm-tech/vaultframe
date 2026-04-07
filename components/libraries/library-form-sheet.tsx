"use client";

import { useActionState, useEffect, useState } from "react";
import { FolderOpen, Pencil, X } from "lucide-react";
import type { Library } from "@prisma/client";
import {
  createLibraryAction,
  type LibraryActionState,
  updateLibraryAction,
} from "@/app/libraries/actions";
import { FolderChooserModal } from "@/components/libraries/folder-chooser-modal";

type LibraryFormSheetProps = {
  library?: Library;
  open: boolean;
  onClose: () => void;
};

const initialState: LibraryActionState = {
  success: false,
};

export function LibraryFormSheet({ library, open, onClose }: LibraryFormSheetProps) {
  const isEditing = Boolean(library);
  const action = isEditing ? updateLibraryAction : createLibraryAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [enabled, setEnabled] = useState(library?.enabled ?? true);
  const [pathValue, setPathValue] = useState(library?.path ?? "");
  const [chooserOpen, setChooserOpen] = useState(false);
  const [manualEditEnabled, setManualEditEnabled] = useState(false);

  useEffect(() => {
    setEnabled(library?.enabled ?? true);
    setPathValue(library?.path ?? "");
    setManualEditEnabled(false);
  }, [library]);

  useEffect(() => {
    if (state.success) {
      setChooserOpen(false);
      onClose();
    }
  }, [onClose, state.success]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#0a0d12] shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent">
              {isEditing ? "Edit library" : "Add library"}
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              {isEditing ? "Update saved library" : "Save a new library"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Choose a folder from the server-side browser, then save the library configuration.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-slate-400 transition hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="flex flex-1 flex-col px-6 py-6">
          {isEditing ? <input type="hidden" name="id" value={library?.id} /> : null}
          <input type="hidden" name="enabled" value={String(enabled)} />

          <div className="space-y-5">
            <Field
              label="Library name"
              name="name"
              placeholder="Main archive"
              defaultValue={library?.name ?? ""}
              error={state.fields?.name}
            />

            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">Library folder</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Use the server-side folder browser as the primary way to pick a media root.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setChooserOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
                >
                  <FolderOpen className="h-4 w-4" />
                  Choose Folder
                </button>
              </div>

              <input type="hidden" name="path" value={pathValue} />

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Selected path</span>
                <input
                  value={pathValue}
                  readOnly={!manualEditEnabled}
                  onChange={(event) => setPathValue(event.target.value)}
                  placeholder="No folder selected yet"
                  className="w-full rounded-2xl border border-white/10 bg-[#0c1016] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-accent/40 focus:bg-white/[0.05] read-only:cursor-default read-only:text-slate-300"
                />
              </label>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Manual editing is available as an advanced fallback.
                </p>
                <button
                  type="button"
                  onClick={() => setManualEditEnabled((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {manualEditEnabled ? "Lock path field" : "Edit manually"}
                </button>
              </div>

              {state.fields?.path ? (
                <span className="mt-3 block text-sm text-rose-300">{state.fields.path}</span>
              ) : null}
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <div>
                <p className="font-medium text-white">Enabled</p>
                <p className="mt-1 text-sm text-slate-400">
                  Disabled libraries stay saved but are excluded from future scan workflows.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => setEnabled((current) => !current)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                  enabled ? "bg-accent" : "bg-white/10"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                    enabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>

          {state.error ? (
            <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {state.error}
            </div>
          ) : null}
          {state.message ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {state.message}
            </div>
          ) : null}

          <div className="mt-auto flex items-center justify-end gap-3 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Saving..." : isEditing ? "Save changes" : "Add library"}
            </button>
          </div>
        </form>
      </div>

      <FolderChooserModal
        open={chooserOpen}
        initialPath={pathValue}
        onClose={() => setChooserOpen(false)}
        onSelect={(selectedPath) => {
          setPathValue(selectedPath);
          setManualEditEnabled(false);
        }}
      />
    </div>
  );
}

type FieldProps = {
  label: string;
  name: string;
  placeholder: string;
  defaultValue: string;
  error?: string;
};

function Field({ label, name, placeholder, defaultValue, error }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-accent/40 focus:bg-white/[0.05]"
      />
      {error ? <span className="mt-2 block text-sm text-rose-300">{error}</span> : null}
    </label>
  );
}
