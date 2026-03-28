import type { ReactNode } from "react";

export const metadata = { title: "Admin — SKINWAVE" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
