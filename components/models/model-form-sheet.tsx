"use client";

import { useActionState, useEffect, useState } from "react";
import { FolderOpen, Pencil, X } from "lucide-react";
import { createModelAction, type ModelActionState } from "@/app/models/actions";
import { FolderChooserModal } from "@/components/libraries/folder-chooser-modal";

type ModelFormSheetProps = {
  open: boolean;
  onClose: () => void;
};

const initialState: ModelActionState = {
  success: false,
};

export function ModelFormSheet({ open, onClose }: ModelFormSheetProps) {
  const [state, formAction, pending] = useActionState(createModelAction, initialState);
  const [enabled, setEnabled] = useState(true);
  const [pathValue, setPathValue] = useState("");
  const [chooserOpen, setChooserOpen] = useState(false);
  const [manualEditEnabled, setManualEditEnabled] = useState(false);
  const [importMode, setImportMode] = useState<"single" | "subfolders">("single");

  useEffect(() => {
    if (!open) {
      setEnabled(true);
      setPathValue("");
      setManualEditEnabled(false);
      setImportMode("single");
    }
  }, [open]);

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
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
      <div className="flex h-full justify-end sm:p-4">
        <div className="flex h-full w-full flex-col bg-[#0a0d12] shadow-2xl sm:max-w-xl sm:rounded-[32px] sm:border sm:border-white/10 sm:shadow-panel">
          <div className="flex items-start justify-between border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-accent">Add model</p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                Create a separate model gallery
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Pick one folder for a model. Everything inside that folder and its subfolders will
                be curated into a separate photo and video gallery.
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

          <form action={formAction} className="flex flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            <input type="hidden" name="enabled" value={String(enabled)} />
            <input type="hidden" name="path" value={pathValue} />
            <input type="hidden" name="importMode" value={importMode} />

            <div className="space-y-5">
              <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-slate-200">Import mode</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Create one model from the selected folder, or create one model per first-level
                  subfolder and import everything recursively underneath each one.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setImportMode("single")}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      importMode === "single"
                        ? "border-accent/30 bg-accent/10"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <p className="font-medium text-white">Single model</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Use one chosen folder as one model gallery.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode("subfolders")}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      importMode === "subfolders"
                        ? "border-accent/30 bg-accent/10"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <p className="font-medium text-white">One per subfolder</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Create a model from each first-level subfolder under the chosen parent.
                    </p>
                  </button>
                </div>
              </div>

              <Field
                label="Model name"
                name="name"
                placeholder="Leave blank to use the folder name"
                defaultValue=""
                error={state.fields?.name}
                helperText={
                  importMode === "subfolders"
                    ? "Each created model will use its subfolder name automatically."
                    : "Optional. If you leave this empty, the folder name will be used."
                }
                disabled={importMode === "subfolders"}
              />

              <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Model folder</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Use the server-side folder browser to choose the main model folder. The app
                      will ingest both photos and videos recursively underneath it.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChooserOpen(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong sm:w-auto"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Choose Folder
                  </button>
                </div>

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

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
                    Disabled models stay saved but can be hidden from later automation.
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
                {state.duplicates && state.duplicates.length > 0 ? (
                  <div className="mt-3 space-y-1 text-xs text-rose-100/90">
                    {state.duplicates.slice(0, 8).map((duplicatePath) => (
                      <div key={duplicatePath} className="break-all">
                        {duplicatePath}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            {state.message ? (
              <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {state.message}
                {state.duplicates && state.duplicates.length > 0 ? (
                  <div className="mt-3 space-y-1 text-xs text-emerald-100/90">
                    {state.duplicates.slice(0, 8).map((duplicatePath) => (
                      <div key={duplicatePath} className="break-all">
                        {duplicatePath}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:mt-auto sm:flex-row sm:items-center sm:justify-end">
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
                {pending ? "Importing..." : "Create model"}
              </button>
            </div>
          </form>
        </div>
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
  helperText?: string;
  disabled?: boolean;
};

function Field({ label, name, placeholder, defaultValue, error, helperText, disabled = false }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-accent/40 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
      />
      {helperText ? <span className="mt-2 block text-sm text-slate-400">{helperText}</span> : null}
      {error ? <span className="mt-2 block text-sm text-rose-300">{error}</span> : null}
    </label>
  );
}
