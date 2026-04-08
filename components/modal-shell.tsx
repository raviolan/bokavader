"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalShellProps = {
  children: ReactNode;
  onClose: () => void;
  panelClassName?: string;
  panelStyle?: CSSProperties;
};

export function ModalShell({ children, onClose, panelClassName, panelStyle }: ModalShellProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      aria-modal="true"
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
    >
      <div className={["modal-panel", panelClassName].filter(Boolean).join(" ")} style={panelStyle}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
