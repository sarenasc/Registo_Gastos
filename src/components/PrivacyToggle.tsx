"use client";

import { Eye, EyeOff } from "lucide-react";
import { usePrivacy } from "@/lib/privacy-context";

export function PrivacyToggle() {
  const { hidden, toggle } = usePrivacy();

  return (
    <button
      onClick={toggle}
      title={hidden ? "Mostrar montos" : "Ocultar montos"}
      className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
    >
      {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
