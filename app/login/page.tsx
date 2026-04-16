import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { isAuthenticated } from "@/lib/server/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    returnTo?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;

  if (await isAuthenticated()) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-10 sm:px-6">
      <LoginForm
        returnTo={params?.returnTo ?? "/"}
        error={params?.error === "invalid" ? "That password was not accepted." : undefined}
      />
    </div>
  );
}
