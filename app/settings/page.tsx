import { PageHeader } from "@/components/layout/page-header";
import { AuthSettingsPanel } from "@/components/settings/auth-settings-panel";
import { SystemStatusPanel } from "@/components/settings/system-status-panel";
import { TagRulesManager } from "@/components/settings/tag-rules-manager";
import { getSettingsOverview } from "@/lib/data/settings";
import { getAuthOverview, requirePageAuth } from "@/lib/server/auth";
import { listTagRules } from "@/lib/data/tag-rules";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams?: Promise<{
    auth?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  await requirePageAuth("/settings");
  const params = searchParams ? await searchParams : undefined;
  const [rules, overview, authOverview] = await Promise.all([
    listTagRules(),
    getSettingsOverview(),
    getAuthOverview(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="System and automation settings"
        description="Check the current app environment and manage the rule-based tagging workflows that run during scans."
      />

      <SystemStatusPanel overview={overview} />
      <AuthSettingsPanel overview={authOverview} status={params?.auth} />
      <TagRulesManager rules={rules} />
    </div>
  );
}
