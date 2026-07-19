"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateSettingsAction } from "@/app/actions/settings";
import type { PlatformSettings } from "@/lib/types";

export function PlatformSettingsForm({ settings }: { settings: PlatformSettings }) {
  const router = useRouter();
  const [screenshotQuality, setScreenshotQuality] = React.useState(settings.screenshotQuality);
  const [defaultTimeoutSeconds, setDefaultTimeoutSeconds] = React.useState(String(settings.defaultTimeoutSeconds));
  const [retryCount, setRetryCount] = React.useState(String(settings.retryCount));
  const [defaultViewport, setDefaultViewport] = React.useState(settings.defaultViewport);
  const [pending, setPending] = React.useState(false);

  async function handleSave() {
    const timeout = Number(defaultTimeoutSeconds);
    const retries = Number(retryCount);
    if (!Number.isFinite(timeout) || timeout <= 0) {
      toast.error("Default Timeout must be a positive number of seconds.");
      return;
    }
    if (!Number.isFinite(retries) || retries < 0) {
      toast.error("Retry Count must be zero or a positive number.");
      return;
    }
    setPending(true);
    const result = await updateSettingsAction({
      aiProvider: settings.aiProvider,
      aiDefaultModel: settings.aiDefaultModel,
      screenshotQuality,
      defaultTimeoutSeconds: timeout,
      retryCount: retries,
      defaultViewport,
    });
    setPending(false);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardTitle>General</CardTitle>
          <CardContent className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label>Display Name</Label>
              <Input defaultValue={settings.displayName} disabled />
              <p className="text-xs text-text-secondary">Editing your own display name isn&apos;t supported yet.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Default Environment</Label>
              <Select defaultValue={settings.defaultEnvironmentName} disabled>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={settings.defaultEnvironmentName}>{settings.defaultEnvironmentName}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Theme</Label>
              <Select defaultValue={settings.theme} disabled>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Light">Light</SelectItem>
                  <SelectItem value="Dark">Dark</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-text-secondary">No per-user preferences table exists yet — these three fields are display-only.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>AI</CardTitle>
          <CardContent className="flex flex-col gap-2.5 text-[13px]">
            <div className="flex justify-between"><span className="text-text-secondary">Active Provider</span><span>{settings.aiProvider}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Connection Status</span><Badge variant={settings.aiConnectionStatus === "Connected" ? "accepted" : "critical"}>{settings.aiConnectionStatus}</Badge></div>
            <div className="flex justify-between"><span className="text-text-secondary">API Key Status</span><Badge variant={settings.aiApiKeyStatus === "Valid" ? "accepted" : "critical"}>{settings.aiApiKeyStatus}</Badge></div>
            <div className="flex justify-between"><span className="text-text-secondary">Default Model</span><span className="font-mono-tabular font-mono">{settings.aiDefaultModel}</span></div>
            <p className="text-xs text-text-secondary">
              Reflects whether <code>ANTHROPIC_API_KEY</code> is configured server-side — set via
              environment variable, not this page.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardTitle>Engines</CardTitle>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Screenshot Quality</Label>
            <Select
              value={screenshotQuality}
              onValueChange={(v) => v && setScreenshotQuality(v as "High" | "Medium")}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Default Timeout (seconds)</Label>
            <Input
              type="number"
              value={defaultTimeoutSeconds}
              onChange={(e) => setDefaultTimeoutSeconds(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Retry Count</Label>
            <Input type="number" value={retryCount} onChange={(e) => setRetryCount(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Default Viewport</Label>
            <Select value={defaultViewport} onValueChange={(v) => setDefaultViewport(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Desktop (1440x900)">Desktop (1440x900)</SelectItem>
                <SelectItem value="Laptop (1280x800)">Laptop (1280x800)</SelectItem>
                <SelectItem value="Tablet (768x1024)">Tablet (768x1024)</SelectItem>
                <SelectItem value="Mobile (375x667)">Mobile (375x667)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardContent className="flex justify-end pt-0">
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
