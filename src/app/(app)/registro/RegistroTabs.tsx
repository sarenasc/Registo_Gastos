"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

export function RegistroTabs() {
  const pathname = usePathname();
  const enMensual = pathname === "/registro/mensual";

  return (
    <div className="flex w-fit rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">
      <Link
        href="/registro"
        className={clsx("rounded-md px-3 py-1.5 font-medium", !enMensual ? "bg-white shadow-sm dark:bg-slate-700" : "text-slate-500")}
      >
        Diario
      </Link>
      <Link
        href="/registro/mensual"
        className={clsx("rounded-md px-3 py-1.5 font-medium", enMensual ? "bg-white shadow-sm dark:bg-slate-700" : "text-slate-500")}
      >
        Mensual
      </Link>
    </div>
  );
}
