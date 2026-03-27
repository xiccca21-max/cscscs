"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Dashboard", href: "/admin" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Users", href: "/admin/users" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Prices", href: "/admin/prices" },
  { label: "Bots", href: "/admin/bots" },
  { label: "Balance", href: "/admin/balance" },
  { label: "Cashouts", href: "/admin/cashouts" },
  { label: "Referrals", href: "/admin/referrals" },
  { label: "Audit", href: "/admin/audit" },
] as const;

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="min-h-screen w-64 border-r border-zinc-800 bg-zinc-950 p-4">
      <h2 className="mb-6 text-lg font-bold text-zinc-100">Admin Panel</h2>
      <nav className="flex flex-col gap-0.5">
        {navLinks.map(({ label, href }) => {
          const active = isNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-indigo-500/15 text-indigo-300"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
