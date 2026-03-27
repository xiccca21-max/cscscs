import type { ReactNode } from "react";

export const metadata = { title: "Referral Dashboard — SKINWAVE" };

export default function ReferralLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-bg/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4">
          <span className="text-xl font-bold text-text-heading">SKINWAVE</span>
          <span className="ml-4 text-sm text-text-muted">Referral Dashboard</span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
