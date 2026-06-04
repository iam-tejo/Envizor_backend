// app/wizard/components/RepeatableGroupRenderer.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CollapsibleSection from "./CollapsibleSection";

interface RepeatableGroupProps {
  label: string;
  instances: any[];
  onChange: (instances: any[]) => void;
  renderInstance: (instance: any, index: number, onChange: (val: any) => void) => React.ReactNode;
}

export default function RepeatableGroupRenderer({
  label,
  instances,
  onChange,
  renderInstance,
}: RepeatableGroupProps) {
  const handleAdd = () => {
    onChange([...instances, {}]);
  };

  const handleRemove = (index: number) => {
    const copy = [...instances];
    copy.splice(index, 1);
    onChange(copy);
  };

  const handleUpdate = (index: number, val: any) => {
    const copy = [...instances];
    copy[index] = val;
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{label}</h3>
        <button
          type="button"
          onClick={handleAdd}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
        >
          + Add
        </button>
      </div>

      <AnimatePresence>
        {instances.map((inst, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CollapsibleSection title={`${label} #${idx + 1}`}>
              <div className="space-y-3">
                {renderInstance(inst, idx, (val) => handleUpdate(idx, val))}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="text-xs text-red-600"
                >
                  Remove
                </button>
              </div>
            </CollapsibleSection>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
