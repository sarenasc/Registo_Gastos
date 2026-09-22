import { LoginForm } from "./LoginForm";

type SearchParams = Promise<{ next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <LoginForm next={params.next || "/dashboard"} />;
}
