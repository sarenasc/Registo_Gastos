"use client";

import { useActionState, useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { crearCuenta, iniciarSesion, type AuthState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signinState, signinAction, signinPending] = useActionState<AuthState, FormData>(iniciarSesion, undefined);
  const [signupState, signupAction, signupPending] = useActionState<AuthState, FormData>(crearCuenta, undefined);

  const state = mode === "signin" ? signinState : signupState;
  const loading = mode === "signin" ? signinPending : signupPending;
  const error = state?.error ?? null;
  const info = state?.info ?? null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-center gap-2 text-slate-900 dark:text-slate-100">
          <Wallet className="h-6 w-6 text-emerald-600" />
          <span className="text-lg font-semibold">Registro de Gastos</span>
        </div>

        <div className="mb-4 flex rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-md py-1.5 font-medium ${mode === "signin" ? "bg-white shadow-sm dark:bg-slate-700" : "text-slate-500"}`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-md py-1.5 font-medium ${mode === "signup" ? "bg-white shadow-sm dark:bg-slate-700" : "text-slate-500"}`}
          >
            Crear cuenta
          </button>
        </div>

        <form action={mode === "signin" ? signinAction : signupAction} className="flex flex-col gap-3">
          <input type="hidden" name="next" value={next} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Correo</label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-emerald-700">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
