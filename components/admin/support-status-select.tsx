"use client";

import * as React from "react";

import { useT } from "@/components/i18n-provider";

type SupportStatus = "none" | "pending" | "active" | "closed";

type Action = (formData: FormData) => void | Promise<void>;

export function SupportStatusSelect({
  action,
  value,
}: {
  action: Action;
  value: SupportStatus;
}) {
  const t = useT();
  const formRef = React.useRef<HTMLFormElement | null>(null);

  return (
    <form ref={formRef} action={action}>
      <select
        name="supportStatus"
        defaultValue={value}
        onChange={() => formRef.current?.requestSubmit()}
        className="h-7 rounded-[min(var(--radius-md),12px)] border border-input bg-transparent px-2 text-[0.8rem] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        <option value="none">{t("supportStatus.none")}</option>
        <option value="pending">{t("supportStatus.pending")}</option>
        <option value="active">{t("supportStatus.active")}</option>
        <option value="closed">{t("supportStatus.closed")}</option>
      </select>
    </form>
  );
}
