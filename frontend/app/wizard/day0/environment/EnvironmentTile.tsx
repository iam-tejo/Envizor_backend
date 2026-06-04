"use client";

interface EnvironmentTileProps {
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}

export default function EnvironmentTile({
  title,
  subtitle,
  selected,
  onClick,
}: EnvironmentTileProps) {
  return (
    <button
      onClick={onClick}
      className={`
        group relative rounded-xl overflow-hidden text-left transition-all
        border ${selected ? "border-sky-600" : "border-gray-300"}
        shadow-sm hover:shadow-md bg-white
      `}
    >
      {/* Radiant Blue Top Band */}
      <div
        className={`
          h-2 w-full 
          ${selected
            ? "bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700"
            : "bg-gradient-to-r from-gray-200 to-gray-300"}
        `}
      />

      {/* Tick Mark */}
      {selected && (
        <div className="absolute top-3 right-3 text-sky-600">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 11l4 4L15 7" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Environment Icon */}
        <div className="mb-3 text-gray-800">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 7h18M3 12h18M3 17h18" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600 text-sm mt-1">{subtitle}</p>
      </div>
    </button>
  );
}
