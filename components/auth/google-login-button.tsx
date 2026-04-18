"use client";

import { useEffect, useRef, useTransition } from "react";

import { googleLoginAction } from "@/app/login/actions";

declare global {
  interface Window {
    google?: unknown;
  }
}

type GoogleIdResponse = {
  credential?: unknown;
};

type GoogleIdInitializeOptions = {
  client_id: string;
  callback: (response: GoogleIdResponse) => void;
  ux_mode?: "popup" | "redirect";
};

type GoogleIdRenderButtonOptions = {
  theme?: string;
  size?: string;
  width?: number;
  text?: string;
  shape?: string;
};

type GoogleAccountsId = {
  initialize: (options: GoogleIdInitializeOptions) => void;
  renderButton: (
    parent: HTMLElement,
    options: GoogleIdRenderButtonOptions,
  ) => void;
};

type GoogleNamespace = {
  accounts?: {
    id?: GoogleAccountsId;
  };
};

function getGoogle(): GoogleNamespace | null {
  const value = window.google;
  if (!value || typeof value !== "object") return null;
  return value as GoogleNamespace;
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (existing) {
      if (getGoogle()?.accounts?.id) return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google script")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export function GoogleLoginButton({ next }: { next: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPending, startTransition] = useTransition();

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled) return;

        const googleId = getGoogle()?.accounts?.id;
        if (!googleId || !containerRef.current) return;

        containerRef.current.innerHTML = "";

        googleId.initialize({
          client_id: clientId,
          callback: (response: GoogleIdResponse) => {
            const credential = response?.credential;
            if (typeof credential !== "string" || credential.length === 0)
              return;

            startTransition(() => {
              googleLoginAction(credential, next);
            });
          },
          ux_mode: "popup",
        });

        googleId.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "signin_with",
          shape: "rectangular",
        });
      })
      .catch(() => {
        // ignore - we'll simply not render the button
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, next]);

  if (!clientId) return null;

  return (
    <div className={isPending ? "pointer-events-none opacity-60" : ""}>
      <div ref={containerRef} />
    </div>
  );
}
