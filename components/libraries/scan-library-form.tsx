"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ScanSearch } from "lucide-react";
import { scanLibraryAction, type LibraryActionState } from "@/app/libraries/actions";

type ScanLibraryFormProps = {
  libraryId: string;
};

const initialState: LibraryActionState = {
  success: false,
};

export function ScanLibraryForm({ libraryId }: ScanLibraryFormProps) {
  const [state, formAction] = useActionState(scanLibraryAction, initialState);

  return (
    <div className="min-w-[220px]">
      <form action={formAction}>
        <input type="hidden" name="id" value={libraryId} />
        <ScanSubmitButton />
      </form>
      {state.error ? (
        <p className="mt-2 text-xs leading-5 text-rose-300">{state.error}</p>
      ) : null}
      {state.message ? (
        <p className="mt-2 text-xs leading-5 text-emerald-300">{state.message}</p>
      ) : null}
    </div>
  );
}

function ScanSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-2.5 text-sm font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <ScanSearch className="h-4 w-4" />
      {pending ? "Starting..." : "Scan"}
    </button>
  );
}
