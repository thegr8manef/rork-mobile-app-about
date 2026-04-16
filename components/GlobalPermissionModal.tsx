import React, { useEffect, useState, useCallback } from "react";
import PermissionModal, {
  type PermissionModalVariant } from "@/components/PermissionModal";
import { registerPermissionModalListener } from "@/utils/permissionModalController";

type ModalState = {
  visible: boolean;
  variant: PermissionModalVariant;
  resolve: ((result: "allow" | "deny" | "settings") => void) | null;
};

export default function GlobalPermissionModal() {
  const [state, setState] = useState<ModalState>({
    visible: false,
    variant: "request",
    resolve: null });

  useEffect(() => {
    const unregister = registerPermissionModalListener((request) => {
      if (request) {
        setState({
          visible: true,
          variant: request.variant,
          resolve: request.resolve });
      } else {
        setState((prev) => ({ ...prev, visible: false }));
      }
    });
    return unregister;
  }, []);

  const handleResult = useCallback(
    (result: "allow" | "deny" | "settings") => {
      setState((prev) => ({ ...prev, visible: false }));
      setTimeout(() => {
        state.resolve?.(result);
      }, 300);
    },
    [state.resolve],
  );

  return (
    <PermissionModal
      visible={state.visible}
      variant={state.variant}
      onAllow={() => handleResult("allow")}
      onDeny={() => handleResult("deny")}
      onOpenSettings={() => handleResult("settings")}
      onClose={() => handleResult("deny")}
    />
  );
}
