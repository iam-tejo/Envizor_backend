"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PullRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the integrated Push page with the init command selected
    router.replace("/wizard/push?command=init");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-xs animate-pulse">Redirecting to Terraform Init Console...</p>
      </div>
    </div>
  );
}
