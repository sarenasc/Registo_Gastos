import { createBrowserClient } from "@supabase/ssr";

// La integración de Vercel <-> Supabase expone la key pública como
// NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; este proyecto espera
// NEXT_PUBLIC_SUPABASE_ANON_KEY. Ambas referencias deben quedar escritas
// literalmente para que Next.js las reemplace en el bundle del navegador.
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, SUPABASE_ANON_KEY);
}
