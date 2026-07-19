import { SetHeader } from "@/components/shell/set-header";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { settingsApi } from "@/lib/api";

export default async function SettingsPage() {
  const res = await settingsApi.fetchSettings();
  if (!res.success) throw new Error(res.error.message);
  const s = res.data;

  return (
    <>
      <SetHeader title="Settings" />
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardTitle>General</CardTitle>
          <CardContent className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label>Display Name</Label>
              <Input defaultValue={s.displayName} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Default Environment</Label>
              <Select defaultValue={s.defaultEnvironmentName}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={s.defaultEnvironmentName}>{s.defaultEnvironmentName}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Theme</Label>
              <Select defaultValue={s.theme}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Light">Light</SelectItem>
                  <SelectItem value="Dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>AI</CardTitle>
          <CardContent className="flex flex-col gap-2.5 text-[13px]">
            <div className="flex justify-between"><span className="text-text-secondary">Active Provider</span><span>{s.aiProvider}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Connection Status</span><Badge variant={s.aiConnectionStatus === "Connected" ? "accepted" : "critical"}>{s.aiConnectionStatus}</Badge></div>
            <div className="flex justify-between"><span className="text-text-secondary">API Key Status</span><Badge variant={s.aiApiKeyStatus === "Valid" ? "accepted" : "critical"}>{s.aiApiKeyStatus}</Badge></div>
            <div className="flex justify-between"><span className="text-text-secondary">Default Model</span><span className="font-mono-tabular font-mono">{s.aiDefaultModel}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardTitle>Engines</CardTitle>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Screenshot Quality</Label>
            <Select defaultValue={s.screenshotQuality}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Default Timeout</Label>
            <Input defaultValue={`${s.defaultTimeoutSeconds}s`} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Retry Count</Label>
            <Input defaultValue={String(s.retryCount)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Default Viewport</Label>
            <Select defaultValue={s.defaultViewport}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={s.defaultViewport}>{s.defaultViewport}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
