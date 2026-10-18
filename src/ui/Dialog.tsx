import { useEffect, useRef, type ReactNode } from "react";
export function Dialog({
  open,
  close,
  title,
  children,
  variant = "",
}: {
  open: boolean;
  close: () => void;
  title: string;
  children: ReactNode;
  variant?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const dialog = ref.current!;
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      opener.current?.focus({ preventScroll: true });
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`panel-dialog ${variant}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current!.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            close();
        }
      }}
    >
      <div className="dialog-header">
        <h2>{title}</h2>
        <button
          className="dialog-close secondary"
          onClick={close}
          aria-label={`Chiudi ${title}`}
        >
          Chiudi <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="dialog-scroll">{open ? children : null}</div>
    </dialog>
  );
}
