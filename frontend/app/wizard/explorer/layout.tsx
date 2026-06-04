"use client";

export default function ExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* CLEAN LAYOUT — NO HEADER, NO ARROWS */}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}
