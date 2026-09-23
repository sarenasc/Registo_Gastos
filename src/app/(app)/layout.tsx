import { NavBar } from "@/components/NavBar";
import { createClient } from "@/lib/supabase/server";
import { PrivacyProvider } from "@/lib/privacy-context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PrivacyProvider>
      <NavBar email={user?.email} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </PrivacyProvider>
  );
}
