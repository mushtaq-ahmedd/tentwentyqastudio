import type { Metadata } from "next";
import { SetHeader } from "@/components/shell/set-header";
import { PlatformSettingsForm } from "@/components/settings/platform-settings-form";
import { settingsApi } from "@/lib/api";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const res = await settingsApi.fetchSettings();
  if (!res.success) throw new Error(res.error.message);

  return (
    <>
      <SetHeader title="Settings" />
      <PlatformSettingsForm settings={res.data} />
    </>
  );
}
