import { SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderCard } from "@/components/ui/placeholder-card";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="System settings placeholder"
        description="Settings will hold allowed library roots, scanning behavior, and playback preferences once those features are introduced."
      />

      <PlaceholderCard
        title="Configuration surface reserved"
        body="Environment-driven PostgreSQL and app settings are in place now, while user-facing controls arrive in a later phase."
        meta="Phase 1 scaffold"
        action={
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
        }
      />
    </div>
  );
}
