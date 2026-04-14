import { PageHeader } from "@/components/layout/page-header";
import { SystemStatusPanel } from "@/components/settings/system-status-panel";
import { TagRulesManager } from "@/components/settings/tag-rules-manager";
import { getSettingsOverview } from "@/lib/data/settings";
import { listTagRules } from "@/lib/data/tag-rules";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [rules, overview] = await Promise.all([listTagRules(), getSettingsOverview()]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="System and automation settings"
        description="Check the current app environment and manage the rule-based tagging workflows that run during scans."
      />

      <SystemStatusPanel overview={overview} />
      <TagRulesManager rules={rules} />
    </div>
  );
}
