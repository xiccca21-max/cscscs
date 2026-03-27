import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/layout/admin-sidebar";

export const metadata = { title: "Admin Panel — SKINWAVE" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-surface flex min-h-screen bg-[#0a0a11] text-zinc-200">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
