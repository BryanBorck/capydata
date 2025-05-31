"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/user-provider";
import { Loader2 } from "lucide-react";

export default function MainPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const { isAuthenticated, pets, isLoading } = useUser();

  useEffect(() => {
    // Don't redirect if still loading user data
    if (isLoading) return;

    const redirect = async () => {
      setIsRedirecting(true);

      // Small delay to prevent redirect flashing
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!isAuthenticated) {
        // Not authenticated -> go to login
        router.push('/login');
      } else if (pets.length === 0) {
        // Authenticated but no pets -> go to onboard
        router.push('/onboard');
      } else {
        // Authenticated with pets -> go to home
        router.push('/home');
      }
    };

    redirect();
  }, [isAuthenticated, pets, isLoading, router]);

  // Show loading spinner while determining where to redirect
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-100">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-gray-600">
          {isRedirecting ? 'Redirecting...' : 'Loading...'}
        </p>
      </div>
    </main>
  );
}