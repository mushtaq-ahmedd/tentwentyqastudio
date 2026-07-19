"use client";

import * as React from "react";

/**
 * Single client-side UI store for: the fixed header's page-specific content, and every
 * modal/confirm-dialog's open/closed state. Mirrors the prototype's single mutable STATE
 * object (shared/state.js) translated into React context — one source of truth instead of
 * ad-hoc useState scattered per page.
 */

export type HeaderPill = { label: string; tone?: "default" | "warn" };

export type ModalName =
  | "create-project"
  | "add-environment"
  | "edit-environment"
  | "upload-knowledge-source"
  | "invite-user"
  | "connect-figma";

export type HeaderAction = {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  modal?: ModalName;
};

export type HeaderConfig = {
  title: string;
  pills?: HeaderPill[];
  action?: HeaderAction;
  backHref?: string;
  backLabel?: string;
};

export type ConfirmConfig = {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
};

type ModalState = { name: ModalName; payload?: Record<string, unknown> } | null;

type UIState = {
  header: HeaderConfig;
  setHeader: (config: HeaderConfig) => void;
  modal: ModalState;
  openModal: (name: ModalName, payload?: Record<string, unknown>) => void;
  closeModal: () => void;
  confirm: ConfirmConfig | null;
  openConfirm: (config: ConfirmConfig) => void;
  closeConfirm: () => void;
};

const UIContext = React.createContext<UIState | null>(null);

const DEFAULT_HEADER: HeaderConfig = { title: "" };

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeader] = React.useState<HeaderConfig>(DEFAULT_HEADER);
  const [modal, setModal] = React.useState<ModalState>(null);
  const [confirm, setConfirm] = React.useState<ConfirmConfig | null>(null);

  const openModal = React.useCallback(
    (name: ModalName, payload?: Record<string, unknown>) => setModal({ name, payload }),
    []
  );
  const closeModal = React.useCallback(() => setModal(null), []);
  const openConfirm = React.useCallback((config: ConfirmConfig) => setConfirm(config), []);
  const closeConfirm = React.useCallback(() => setConfirm(null), []);

  const value = React.useMemo(
    () => ({ header, setHeader, modal, openModal, closeModal, confirm, openConfirm, closeConfirm }),
    [header, modal, confirm, openModal, closeModal, openConfirm, closeConfirm]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = React.useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}

/**
 * Pages call this once to declare the fixed header's title/pills/action for as long as
 * they're mounted. Dependency array is deliberately primitive-only (icon/href/modal name
 * are stable per page) so this never loops.
 */
export function usePageHeader(config: HeaderConfig) {
  const { setHeader } = useUI();
  const pillsKey = JSON.stringify(config.pills ?? []);
  React.useEffect(() => {
    setHeader(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.title,
    config.backHref,
    config.backLabel,
    pillsKey,
    config.action?.label,
    config.action?.href,
    config.action?.modal,
  ]);
}
