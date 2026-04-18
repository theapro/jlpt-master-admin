"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ClickableTableRowProps = React.ComponentProps<typeof TableRow> & {
  href: string;
};

const isInteractive = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("a,button,input,textarea,select,option"));
};

export function ClickableTableRow({
  href,
  className,
  onClick,
  onKeyDown,
  ...props
}: ClickableTableRowProps) {
  const router = useRouter();

  return (
    <TableRow
      {...props}
      role="link"
      tabIndex={0}
      className={cn("cursor-pointer", className)}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (isInteractive(e.target)) return;
        router.push(href);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        router.push(href);
      }}
    />
  );
}
