"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Bot, Trash2 } from "lucide-react";
import {
  createTagRuleAction,
  deleteTagRuleAction,
  toggleTagRuleEnabledAction,
  type TagRuleActionState,
} from "@/app/settings/actions";
import type { TagRuleRecord } from "@/lib/data/tag-rules";

type TagRulesManagerProps = {
  rules: TagRuleRecord[];
};

const initialState: TagRuleActionState = {
  success: false,
};

export function TagRulesManager({ rules }: TagRulesManagerProps) {
  const [state, formAction] = useActionState(createTagRuleAction, initialState);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-surface/80 p-6 shadow-panel">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-white">Auto-tag rules</h3>
            <p className="text-sm text-slate-400">
              Rules apply during scans and add tags when a filename, folder path, or library name matches.
            </p>
          </div>
        </div>

        <form action={formAction} className="mt-6 grid gap-4 lg:grid-cols-2">
          <Field label="Rule name">
            <input
              type="text"
              name="name"
              placeholder="Example: OF folder"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/40"
            />
          </Field>

          <Field label="Tag to apply">
            <input
              type="text"
              name="tagName"
              placeholder="example-tag"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/40"
            />
          </Field>

          <Field label="Match this field">
            <select
              name="target"
              defaultValue="FILE_NAME"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
            >
              <option value="FILE_NAME">Filename</option>
              <option value="FOLDER_PATH">Folder path</option>
              <option value="LIBRARY_NAME">Library name</option>
            </select>
          </Field>

          <Field label="Match mode">
            <select
              name="matchMode"
              defaultValue="CONTAINS"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
            >
              <option value="CONTAINS">Contains</option>
              <option value="EQUALS">Equals</option>
            </select>
          </Field>

          <Field label="Pattern">
            <input
              type="text"
              name="pattern"
              placeholder="Example: bigtit"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/40"
            />
          </Field>

          <Field label="Enabled">
            <select
              name="enabled"
              defaultValue="true"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </Field>

          <div className="lg:col-span-2">
            <AddRuleButton />
          </div>
        </form>

        {state.error ? <p className="mt-4 text-sm text-rose-300">{state.error}</p> : null}
        {state.message ? <p className="mt-4 text-sm text-emerald-300">{state.message}</p> : null}
      </section>

      <section className="rounded-[32px] border border-white/10 bg-surface/80 p-6 shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight text-white">Saved rules</h3>
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {rules.length} total
          </span>
        </div>

        {rules.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No rules yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{rule.name}</p>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                          rule.enabled
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                            : "border-slate-400/20 bg-slate-400/10 text-slate-300"
                        }`}
                      >
                        {rule.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      If <span className="text-slate-200">{formatTarget(rule.target)}</span>{" "}
                      {rule.matchMode === "CONTAINS" ? "contains" : "equals"}{" "}
                      <span className="text-slate-200">{rule.pattern}</span>, apply{" "}
                      <span className="text-slate-200">{rule.tagName}</span>.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <form action={toggleTagRuleEnabledAction}>
                      <input type="hidden" name="id" value={rule.id} />
                      <input type="hidden" name="enabled" value={String(!rule.enabled)} />
                      <ActionButton label={rule.enabled ? "Disable" : "Enable"} />
                    </form>
                    <form action={deleteTagRuleAction}>
                      <input type="hidden" name="id" value={rule.id} />
                      <ActionButton label="Delete" danger icon={<Trash2 className="h-4 w-4" />} />
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
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

function AddRuleButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Create Rule"}
    </button>
  );
}

function ActionButton({
  label,
  danger,
  icon,
}: {
  label: string;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
        danger
          ? "border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
          : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white"
      }`}
    >
      {icon}
      {pending ? "Working..." : label}
    </button>
  );
}

function formatTarget(value: string) {
  if (value === "FILE_NAME") {
    return "filename";
  }

  if (value === "FOLDER_PATH") {
    return "folder path";
  }

  return "library name";
}
