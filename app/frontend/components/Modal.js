import React, { useEffect, useState } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  showCancel = true,
}) {
  const [visible, setVisible] = useState(open);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => setActive(true));
    } else if (visible) {
      setActive(false);
      const t = setTimeout(() => setVisible(false), 220);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  const overlayCls = `fixed inset-0 flex items-center justify-center z-50 bg-black transition-opacity duration-200 ${
    active ? "bg-opacity-40 opacity-100" : "bg-opacity-0 opacity-0"
  }`;

  const panelCls = `bg-white rounded p-4 w-full max-w-3xl transform transition-all duration-200 ease-out ${
    active ? "opacity-100 scale-100" : "opacity-0 scale-95"
  }`;

  const onOverlayClick = (e) => {
    if (e.target === e.currentTarget && onClose) onClose();
  };

  return (
    <div className={overlayCls} onClick={onOverlayClick}>
      <div
        className={panelCls}
        style={{ maxHeight: "85vh", overflow: "hidden" }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">{title}</h3>
          <div className="flex items-center gap-2">
            {showCancel && (
              <button onClick={onClose} className="text-gray-600 px-2 py-1">
                ✕
              </button>
            )}
          </div>
        </div>

        <div style={{ maxHeight: "65vh", overflowY: "auto" }} className="pr-2">
          {children}
        </div>

        {showCancel && (
          <div className="mt-4 flex justify-end">
            <button
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
