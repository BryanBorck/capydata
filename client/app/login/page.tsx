"use client";

import { useState, useEffect } from "react";
import { Wallet, Loader2 } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { MiniKit } from "@worldcoin/minikit-js";
import { APP_NAME } from "@/lib/constants";
import { useUser } from "@/providers/user-provider";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const router = useRouter();
  
  const { isAuthenticated, login } = useUser();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Check MiniKit installation
  useEffect(() => {
    const checkMiniKit = async () => {
      if (
        process.env.NEXT_PUBLIC_APP_ENV === "test" ||
        process.env.NEXT_PUBLIC_APP_ENV === "development"
      ) {
        setIsLoading(false);
        console.log("Development/Test mode -> MiniKit check skipped");
      } else {
        const isInstalled = MiniKit.isInstalled();
        if (isInstalled) {
          setIsLoading(false);
        } else {
          setTimeout(checkMiniKit, 1000);
        }
      }
    };

    checkMiniKit();
  }, []);

  // Handle World wallet authentication
  const handleConnectWallet = async () => {
    setAuthLoading(true);

    try {
      if (!MiniKit.isInstalled()) {
        toast.error("MiniKit is not installed");
        return;
      }

      // Get nonce from backend
      const res = await fetch("/api/nonce");
      const { nonce } = await res.json();

      // Perform wallet authentication
      const { commandPayload, finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: nonce,
        requestId: "0",
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement: "Sign in to Datagotchi",
      });

      if (finalPayload.status === "error") {
        toast.error("Authentication failed");
        return;
      }

      // Verify the authentication with backend
      const response = await fetch("/api/complete-siwe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload,
          nonce,
        }),
      });

      const result = await response.json();

      if (result.status === "success" && result.isValid) {
        // Get user info from MiniKit and payload
        const username = MiniKit.user?.username;
        const walletAddress = finalPayload.address;

        // Use the provider's login function to save to Supabase
        await login(walletAddress, username);

        toast.success(`Welcome ${username || "User"}! 🎉`);
        
        // Redirect to create pet or dashboard
        router.push('/create-pet');
      } else {
        toast.error("Authentication verification failed");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error("Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  if (isLoading) {
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
            Loading MiniKit...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-100 p-6">
      <FlickeringGrid
        className="absolute inset-0 z-0 h-full w-full [mask-image:radial-gradient(1200px_circle_at_center,transparent,white)]"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.5}
        flickerChance={0.1}
      />
      
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto z-10">
        <AnimatedShinyText
          className="inline-flex text-6xl mb-6 items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400"
        >
          <span>{APP_NAME}</span>
        </AnimatedShinyText>

        <div className="text-xl mb-8 text-neutral-600">
          Your digital companion awaits
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-gray-200 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome!</h2>
          <p className="text-gray-600 mb-6">
            Connect your World wallet to start your Datagotchi journey
          </p>

          {process.env.NEXT_PUBLIC_APP_ENV === "test" ? (
            <Button
              onClick={() => router.push("/create-pet")}
              className="w-full py-3 font-medium"
            >
              <span>Continue (Test Mode)</span>
            </Button>
          ) : (
            <Button
              onClick={handleConnectWallet}
              disabled={authLoading}
              className="w-full py-3 font-medium"
            >
              {authLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5 mr-2" />
                  <span>Connect World Wallet</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 