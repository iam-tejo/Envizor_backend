"use client";

import { useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-hcl";
import "prismjs/themes/prism-tomorrow.css";

export default function CodePreview({ code }: { code: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      Prism.highlightElement(ref.current);
    }
  }, [code]);

  return (
    <pre className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 overflow-auto">
      <code ref={ref} className="language-hcl text-sm">
        {code}
      </code>
    </pre>
  );
}
