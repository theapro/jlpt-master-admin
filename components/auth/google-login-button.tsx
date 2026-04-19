"use client";

import { useEffect, useRef, useTransition } from "react";
import { FaGoogle } from "react-icons/fa";

import { googleLoginAction } from "@/app/login/actions";

declare global {
  interface Window {
    google?: unknown;
  }
}

type GoogleIdResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleIdResponse) => void;
    ux_mode?: "popup" | "redirect";
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme?: string;
      size?: string;
      width?: number;
      text?: string;
      shape?: string;
    }
  ) => void;
};

function getGoogleId(): GoogleAccountsId | null {
  const g = window.google as any;
  return g?.accounts?.id ?? null;
}

let scriptPromise: Promise<void> | null = null;

function loadGoogleScript() {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject();

    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function GoogleLoginButton({ next }: { next: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const lastWidth = useRef<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;
    let observer: ResizeObserver | null = null;

    const getWidth = () => {
      const el = ref.current;
      if (!el) return null;

      const w = Math.floor(el.clientWidth);
      if (!w) return null;

      return Math.min(400, Math.max(120, w));
    };

    const render = () => {
      if (cancelled) return;

      const google = getGoogleId();
      const container = ref.current;

      if (!google || !container) return;

      const width = getWidth();
      if (!width) return;

      if (lastWidth.current === width && container.childElementCount > 0) {
        return;
      }

      lastWidth.current = width;
      container.innerHTML = "";

      google.renderButton(container, {
        theme: "filled_blue",
        size: "large",
        width,
        text: "continue_with",
        shape: "rectangular",
      });
    };

    loadGoogleScript()
      .then(() => {
        if (cancelled) return;

        const google = getGoogleId();
        if (!google) return;

        google.initialize({
          client_id: clientId,
          ux_mode: "popup",
          callback: ({ credential }) => {
            if (!credential) return;

            startTransition(() => {
              googleLoginAction(credential, next);
            });
          },
        });

        render();

        if (ref.current && "ResizeObserver" in window) {
          observer = new ResizeObserver(render);
          observer.observe(ref.current);
        } else {
          window.addEventListener("resize", render);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener("resize", render);
    };
  }, [clientId, next]);

  if (!clientId) return null;

  return (
    <div className="group relative mx-auto h-11 w-full max-w-100">
      <div
        className={`absolute inset-0 flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-all duration-200 
        group-hover:border-slate-300 group-hover:bg-slate-50 
        ${isPending ? "opacity-60" : "opacity-100"}`}
      >
        <FaGoogle className="" />
        <span>Google orqali davom etish</span>
      </div>

      <div
        ref={ref}
        className="absolute inset-0 z-10 cursor-pointer opacity-[0.001] 
        [&_div]:w-full! [&_iframe]:h-full! [&_iframe]:w-full!"
      />

      {isPending && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/60">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}