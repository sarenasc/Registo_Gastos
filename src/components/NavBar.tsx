"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { LayoutDashboard, NotebookPen, PiggyBank, Lightbulb, Wallet, Fuel, TrendingUp } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { PrivacyToggle } from "@/components/PrivacyToggle";

const LINKS = [
  { href: "/registro", label: "Registro", icon: NotebookPen },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/presupuesto", label: "Presupuesto", icon: PiggyBank },
  { href: "/consejos", label: "Consejos", icon: Lightbulb },
  { href: "/bencina", label: "Bencina", icon: Fuel },
  { href: "/ipc", label: "IPC", icon: TrendingUp },
];

export function NavBar({ email }: { email?: string | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
          <Wallet className="h-5 w-5 text-emerald-600" />
          <span>Registro de Gastos</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                  active
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <PrivacyToggle />
          <UserMenu email={email ?? null} />
        </div>
      </div>
    </header>
  );
}
