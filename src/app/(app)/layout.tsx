import { NavBar } from "@/components/NavBar";
import { getSession } from "@/lib/auth/server";
import { PrivacyProvider } from "@/lib/privacy-context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <PrivacyProvider>
      <NavBar email={session?.email} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </PrivacyProvider>
  );
}
