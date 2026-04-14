import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { AUTH_SESSION_COOKIE, getIsAuthenticated, isAuthConfigured } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const nextPath = params?.next && params.next.startsWith("/") ? params.next : "/";
  const cookieStore = await cookies();
  const authConfigured = await isAuthConfigured();

  if (await getIsAuthenticated(cookieStore.get(AUTH_SESSION_COOKIE)?.value)) {
    redirect(nextPath);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <LoginForm nextPath={nextPath} authConfigured={authConfigured} />
    </div>
  );
}
