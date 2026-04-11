import { PageHeader } from "@/components/layout/page-header";
import { TagRulesManager } from "@/components/settings/tag-rules-manager";
import { listTagRules } from "@/lib/data/tag-rules";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const rules = await listTagRules();

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Automation and rule settings"
        description="Manage rule-based auto-tagging so future scans can apply tags automatically using your filename, folder, and library matching rules."
      />

      <TagRulesManager rules={rules} />
    </div>
  );
}
