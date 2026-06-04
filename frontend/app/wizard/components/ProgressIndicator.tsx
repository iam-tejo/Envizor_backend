"use client";

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

export default function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  return (
    <div className="text-sm text-gray-600 mb-4">
      Step {current} of {total}
    </div>
  );
}
