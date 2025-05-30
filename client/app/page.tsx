"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/user-provider";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, pets, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (pets.length === 0) {
        router.push('/create-pet');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, pets, isLoading, router]);

  // Show loading while redirecting
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12 bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="flex flex-col items-center justify-center text-center">
        <svg
          className="animate-spin h-10 w-10 text-slate-700"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="mt-4 text-lg font-medium text-slate-700">
          Redirecting...
        </p>
      </div>
    </main>
  );
}