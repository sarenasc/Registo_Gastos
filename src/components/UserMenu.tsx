"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { cerrarSesion } from "@/app/login/actions";

export function UserMenu({ email }: { email: string | null }) {
  const [isPending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await cerrarSesion();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {email && <span className="hidden truncate text-xs text-slate-500 sm:inline dark:text-slate-400">{email}</span>}
      <button
        onClick={signOut}
        disabled={isPending}
        title="Cerrar sesión"
        className="flex items-center gap-1 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
