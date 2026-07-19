"use client";

import { usePageHeader, type HeaderConfig } from "./ui-provider";

/** Lets Server Component pages declare the fixed header's content without becoming client themselves. */
export function SetHeader(config: HeaderConfig) {
  usePageHeader(config);
  return null;
}
