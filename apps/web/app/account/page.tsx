"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <Container className="py-16">
        <div className="h-32 max-w-md animate-pulse rounded-xl bg-slate-100" />
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container className="flex max-w-md flex-col gap-6 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Your account</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <p className="text-slate-500">Signed in as</p>
        <p className="font-medium text-slate-900">{user.display_name || user.email}</p>
        <p className="text-slate-500">{user.email}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          signOut();
          router.push("/");
        }}
        className="self-start rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-red-300 hover:text-red-600"
      >
        Log out
      </button>
    </Container>
  );
}
