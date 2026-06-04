"use client";

import React from "react";
import WizardShell from "@/app/wizard/WizardShell";

interface WizardPageProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode; // Back / Next buttons
}

export default function WizardPage({
  title,
  subtitle,
  children,
  footer,
}: WizardPageProps) {
  return (
    <WizardShell>
      <div className="w-full flex flex-col items-center">

        {/* Header Block */}
        <div className="w-full max-w-4xl mt-12 mb-10 px-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            {title}
          </h1>

          {subtitle && (
            <p className="text-gray-600 text-lg mt-2">
              {subtitle}
            </p>
          )}
        </div>

        {/* Content Block */}
        <div className="w-full max-w-4xl px-6">
          {children}
        </div>

        {/* Footer Navigation */}
        {footer && (
          <div className="w-full max-w-4xl px-6 flex justify-between mt-16 mb-20">
            {footer}
          </div>
        )}

      </div>
    </WizardShell>
  );
}
