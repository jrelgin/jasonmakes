"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const INTRO_DELAY_MS = 1800;
const INTRO_ANIMATION_MS = 1500;

export default function DailyProfilePanel({
  blurb,
  children,
}: {
  blurb: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const dialogId = useId();
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const closePanel = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => {
      const focusTarget = previouslyFocusedRef.current ?? triggerRef.current;
      focusTarget?.focus();
    }, 0);
  }, []);

  const openPanel = useCallback(() => {
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : triggerRef.current;
    setOpen(true);
  }, []);

  const togglePanel = useCallback(() => {
    if (!ready) return;

    if (open) {
      closePanel();
    } else {
      openPanel();
    }
  }, [closePanel, open, openPanel, ready]);

  const trapFocus = useCallback((event: KeyboardEvent) => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((element) => element.offsetParent !== null);

    if (focusable.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
      }

      if (event.key === "Tab") {
        trapFocus(event);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePanel, open, trapFocus]);

  useLayoutEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      setReady(true);
      setEntered(true);
      return;
    }

    const readyTimer = window.setTimeout(() => {
      setReady(true);
    }, INTRO_DELAY_MS);

    const enteredTimer = window.setTimeout(() => {
      setEntered(true);
    }, INTRO_DELAY_MS + INTRO_ANIMATION_MS);

    return () => {
      window.clearTimeout(readyTimer);
      window.clearTimeout(enteredTimer);
    };
  }, []);

  return (
    <div
      className="daily-profile-shell"
      data-entered={entered}
      data-open={open}
      data-ready={ready}
    >
      {open && (
        <button
          type="button"
          className="daily-profile-backdrop"
          aria-label="Close profile details"
          onClick={closePanel}
          tabIndex={-1}
        />
      )}

      <aside
        className="daily-profile-panel"
        data-open={open}
        aria-label="Daily profile"
      >
        <div className="daily-profile-glass-line" aria-hidden="true" />
        <figure className="daily-profile-blurb">
          <blockquote>{blurb}</blockquote>
        </figure>

        <div className="daily-profile-actions">
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-controls={dialogId}
            disabled={!ready}
            onClick={togglePanel}
            className="daily-profile-trigger"
          >
            What is this daily current?
          </button>
        </div>

        {open && (
          <dialog
            ref={dialogRef}
            id={dialogId}
            open
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="daily-profile-dialog"
          >
            <div className="daily-profile-dialog__header">
              <h2 id={titleId}>Below the surface</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={closePanel}
                className="daily-profile-close"
              >
                Close
              </button>
            </div>
            <div className="daily-profile-dialog__body">{children}</div>
          </dialog>
        )}
      </aside>
    </div>
  );
}
