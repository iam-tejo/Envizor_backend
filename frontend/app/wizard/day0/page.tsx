"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Day0Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/wizard/day0/discovery");
  }, [router]);

  return null;
}
