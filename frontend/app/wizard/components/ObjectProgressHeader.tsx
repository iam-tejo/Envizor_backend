"use client";

interface Props {
  current: number;
  total: number;
  objectType: string;
}

export default function ObjectProgressHeader({ current, total, objectType }: Props) {
  return (
    <div className="bg-white shadow p-4 text-center border-b">
      <div className="text-sm text-gray-600">
        Object {current} of {total}
      </div>
      <div className="text-lg font-semibold text-blue-700">{objectType}</div>
    </div>
  );
}
