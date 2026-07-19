import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VALIDATION_TYPES } from "@/lib/types";

const DEFAULT_ENABLED: Record<string, boolean> = {
  "UI Validation": true,
  "Figma Comparison": true,
  "Content Validation": false,
  "Grammar Validation": true,
  "Functional Validation": false,
};

export default function ProjectTestingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardTitle>General</CardTitle>
          <CardContent className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label>Default Browser</Label>
              <Select defaultValue="Chromium">
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chromium">Chromium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Viewport</Label>
              <Select defaultValue="Desktop (1440x900)">
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Desktop (1440x900)">Desktop (1440×900)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Timeout</Label>
              <Input defaultValue="30s" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Retry Count</Label>
              <Input defaultValue="2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Enabled Validation Types</CardTitle>
          <CardContent className="flex flex-col">
            {VALIDATION_TYPES.map((type) => (
              <div key={type} className="flex items-start gap-2.5 border-b border-border-default py-2.5 last:border-0">
                <Checkbox defaultChecked={DEFAULT_ENABLED[type]} />
                <span className="text-[13.5px] font-medium">{type}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardTitle>Ignore Rules</CardTitle>
        <CardContent>
          <div className="mb-3 flex gap-2">
            <Input placeholder="e.g. /admin, .cookie-banner" className="flex-1" />
          </div>
          <div className="flex flex-wrap gap-2">
            {["/admin", "Cookie Banner", "Chat Widget", "Dynamic Timestamp"].map((rule) => (
              <span key={rule} className="rounded bg-bg-surface px-2 py-0.5 text-[10.5px] text-text-secondary ring-1 ring-border-default">
                {rule}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
