"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
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
      <Container className="flex flex-1 max-w-md flex-col justify-center py-16">
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container className="flex flex-1 max-w-md flex-col justify-center gap-6 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Your account</h1>
      <div className="rounded-xl border border-slate-300 bg-white p-5 text-sm shadow-sm">
        <p className="text-slate-500">Signed in as</p>
        <p className="font-medium text-slate-900">{user.display_name || user.email}</p>
        <p className="text-slate-500">{user.email}</p>
      </div>
      <Button
        type="button"
        variant="danger"
        className="self-start"
        onClick={() => {
          signOut();
          router.push("/");
        }}
      >
        Log out
      </Button>
    </Container>
  );
}
