export type PlatformSettings = {
  displayName: string;
  defaultProjectId: string;
  defaultEnvironmentName: string;
  theme: "Light" | "Dark";
  aiProvider: string;
  aiConnectionStatus: "Connected" | "Disconnected";
  aiApiKeyStatus: "Valid" | "Invalid" | "Missing";
  aiDefaultModel: string;
  screenshotQuality: "High" | "Medium";
  defaultTimeoutSeconds: number;
  retryCount: number;
  defaultViewport: string;
};
