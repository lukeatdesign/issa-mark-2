"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useOnboardingStore, isOnboardingComplete } from "@/store/onboarding";
import ClientSidebar from "@/components/ClientSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const answers = useOnboardingStore((s) => s.answers);
  // Wait for persisted stores to hydrate before redirecting
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) {
      router.replace("/login");
    } else if (!isOnboardingComplete(answers)) {
      router.replace("/onboarding");
    }
  }, [hydrated, isLoggedIn, answers, router]);

  if (!hydrated || !isLoggedIn || !isOnboardingComplete(answers)) {
    return <div className="flex h-screen bg-gray-50" />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ClientSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
