import { createSignal } from "solid-js";

import { registerSW } from "virtual:pwa-register";

type MaybeApply = (() => void) | undefined;
const [pendingUpdate, setPendingUpdate] = createSignal<MaybeApply>(undefined);

export { pendingUpdate };

// only in dev: call window.__simulateUpdate({ version: 'X' }) from renderer console
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as any).__simulateUpdate = (info: any = { version: "DEV-TEST" }) => {
    setPendingUpdate(() => {
      return () => {
        (window as any).native.send("restart-app", info);
      };
    });
  };
}

if (typeof window !== "undefined" && (window as any).native && typeof (window as any).native.on === "function") {
  (window as any).native.on("update-downloaded", (_evt: any, info: any) => {
    setPendingUpdate(() => {
      return () => {
        (window as any).native.send("restart-app", info);
      };
    });
  });
}

// Web (PWA) path: register service worker and expose an "apply update" function
if (typeof window !== "undefined" && import.meta.env.PROD && typeof registerSW === "function") {
  const updateSW = registerSW({
    onNeedRefresh() {
      // expose a callable that applies the new service worker when invoked
      setPendingUpdate(() => {
        return () => {
          // request the service worker to apply and reload
          void updateSW(true);
        };
      });
    },
    onOfflineReady() {
      console.info("Ready to work offline =)");
    },
    onRegistered(r) {
      // Poll for updates every hour
      setInterval(() => r!.update(), 36e5);
    },
  });
}



/* if (import.meta.env.PROD) {
  const updateSW = registerSW({
    onNeedRefresh() {
      setPendingUpdate(() => void updateSW(true));
    },
    onOfflineReady() {
      console.info("Ready to work offline =)");
      // toast to users
    },
    onRegistered(r) {
      // registration = r;

      // Check for updates every hour
      setInterval(() => r!.update(), 36e5);
    },
  });
}
 */