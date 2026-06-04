"use client";

import React from "react";

interface CatppuccinIconProps {
  name: string;
  type: "folder" | "file";
  isOpen?: boolean;
  className?: string;
}

export default function CatppuccinIcon({
  name,
  type,
  isOpen = false,
  className = "w-4 h-4",
}: CatppuccinIconProps) {
  // Folder Icon
  if (type === "folder") {
    if (isOpen) {
      return (
        <svg
          className={`${className} text-[#FAB387] shrink-0`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="currentColor" fillOpacity="0.15" />
          <path d="M2 10h20" />
        </svg>
      );
    }
    return (
      <svg
        className={`${className} text-[#FAB387] shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="currentColor" fillOpacity="0.25" />
      </svg>
    );
  }

  // File Extensions Detection
  const extension = name.includes(".")
    ? name.slice(name.lastIndexOf(".")).toLowerCase()
    : "";

  // 1. Java File (.java, .class, .jar)
  if (extension === ".java" || extension === ".class" || extension === ".jar") {
    return (
      <svg
        className={`${className} text-[#EBA0AC] shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Styled Coffee Cup / Java Cup */}
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" fill="currentColor" fillOpacity="0.2" />
        <line x1="6" y1="2" x2="6" y2="5" />
        <line x1="10" y1="2" x2="10" y2="5" />
        <line x1="14" y1="2" x2="14" y2="5" />
      </svg>
    );
  }

  // 2. Terraform File (.tf, .tfvars)
  if (extension === ".tf" || extension === ".tfvars") {
    return (
      <svg
        className={`${className} text-[#CBA6F7] shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Hexagonal Node Shape / 3D Box */}
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" fillOpacity="0.2" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
        <line x1="12" y1="22" x2="12" y2="12" />
      </svg>
    );
  }

  // 3. JSON File (.json)
  if (extension === ".json") {
    return (
      <svg
        className={`${className} text-[#F9E2AF] shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 18a2 2 0 0 0 2-2v-3a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2M8 18a2 2 0 0 1-2-2v-3a2 2 0 0 0-2-2 2 2 0 0 0 2-2V5a2 2 0 0 1 2-2" />
      </svg>
    );
  }

  // 4. YAML File (.yaml, .yml)
  if (extension === ".yaml" || extension === ".yml") {
    return (
      <svg
        className={`${className} text-[#A6E3A1] shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    );
  }

  // 5. XML / HTML / JSP File (.xml, .html, .jsp)
  if (extension === ".xml" || extension === ".html" || extension === ".jsp") {
    return (
      <svg
        className={`${className} text-[#F38BA8] shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="12" y1="2" x2="12" y2="22" className="origin-center rotate-12" />
      </svg>
    );
  }

  // 6. Markdown File (.md)
  if (extension === ".md") {
    return (
      <svg
        className={`${className} text-[#89B4FA] shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" fillOpacity="0.1" />
        <path d="M7 15V9l3 3 3-3v6" />
        <path d="M17 12V9m0 3l-2.5-2.5M17 12l2.5-2.5" />
      </svg>
    );
  }

  // 7. Properties / Env File (.properties, .env, .conf, .ini)
  if (
    extension === ".properties" ||
    extension === ".env" ||
    extension === ".conf" ||
    extension === ".ini"
  ) {
    return (
      <svg
        className={`${className} text-[#94E2D5] shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    );
  }

  // 8. Script File (.sh, .bash, .zsh)
  if (extension === ".sh" || extension === ".bash" || extension === ".zsh") {
    return (
      <svg
        className={`${className} text-[#A6E3A1] shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    );
  }

  // 9. Document Text File (.txt, .log)
  if (extension === ".txt" || extension === ".log") {
    return (
      <svg
        className={`${className} text-[#CDD6F4] shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="currentColor" fillOpacity="0.1" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    );
  }

  // 10. Default File
  return (
    <svg
      className={`${className} text-[#BAC2DE] shrink-0`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" fill="currentColor" fillOpacity="0.15" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}
