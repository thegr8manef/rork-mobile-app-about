import type { PermissionModalVariant } from "@/components/PermissionModal";

type ModalRequest = {
  variant: PermissionModalVariant;
  resolve: (result: "allow" | "deny" | "settings") => void;
};

type Listener = (request: ModalRequest | null) => void;

let currentListener: Listener | null = null;

export function registerPermissionModalListener(listener: Listener) {
  currentListener = listener;
  return () => {
    if (currentListener === listener) {
      currentListener = null;
    }
  };
}

export function showPermissionModal(
  variant: PermissionModalVariant,
): Promise<"allow" | "deny" | "settings"> {
  return new Promise((resolve) => {
    if (!currentListener) {
      console.warn("[PermissionModal] No listener registered, falling back to deny");
      resolve("deny");
      return;
    }
    currentListener({ variant, resolve });
  });
}

export function hidePermissionModal() {
  currentListener?.(null);
}
