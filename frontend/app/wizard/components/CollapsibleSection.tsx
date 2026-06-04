// app/wizard/components/CollapsibleSection.tsx
"use client";

import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  title: string;
  children: ReactNode;
}

export default function CollapsibleSection({ title, children }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border rounded-lg mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2 bg-gray-50"
      >
        <span className="font-medium">{title}</span>
        <span className="text-sm text-gray-500">{open ? "▲" : "▼"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="px-4 py-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
