"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Wallet, Loader2, User, LogOut } from "lucide-react";
import Image from "next/image";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { MiniKit } from "@worldcoin/minikit-js";

interface UserData {
  address?: string;
}

interface SessionData {
  authenticated: boolean;
  user: UserData | null;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData>({ authenticated: false, user: null });
  const router = useRouter();

  // Check session status
  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      setSessionData(data);
    } catch (error) {
      console.error("Error checking session:", error);
      setSessionData({ authenticated: false, user: null });
    }
  };

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
    checkSession(); // Check session on component mount
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      // Clear cookies by making a request to a logout endpoint
      await fetch("/api/auth/logout", { method: "POST" });
      setSessionData({ authenticated: false, user: null });
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

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
        statement: "Sign in to access terminal",
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

        toast.success(`Welcome ${username || "User"}! Wallet: ${walletAddress}`);
        
        // Update session data
        await checkSession();
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
      <main
        className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12
          bg-gradient-to-br from-slate-50 to-gray-100"
      >
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
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br
        from-gray-50 via-slate-50 to-zinc-100 p-6"
    >
      <FlickeringGrid
        className="absolute inset-0 z-0 h-full w-full
          [mask-image:radial-gradient(1200px_circle_at_center,transparent,white)]"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.5}
        flickerChance={0.1}
      />
      
      <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
        <AnimatedShinyText
          className="inline-flex text-5xl mb-4 items-center justify-center px-4 py-1 transition
            ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400"
        >
          <span>_terminal</span>
        </AnimatedShinyText>

        <div className="h-16 text-xl mb-16 text-neutral-400">
          Access Multi Agentic Teams
        </div>

        {sessionData.authenticated ? (
          <div className="flex flex-col items-center space-y-6 z-10">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <User className="h-6 w-6 text-gray-600" />
                <span className="text-lg font-semibold text-gray-800">User Information</span>
              </div>
              
              <div className="space-y-3 text-left">
                <div>
                  <span className="text-sm font-medium text-gray-600">Wallet Address:</span>
                  <div className="mt-1 p-2 bg-gray-50 rounded font-mono text-sm break-all">
                    {sessionData.user?.address || "Not available"}
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Authentication Status:</span>
                  <div className="mt-1 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Authenticated</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={() => router.push("/agents")}
                className="px-6 py-3 z-10 font-medium"
              >
                <span>Enter Terminal</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="px-6 py-3 z-10 font-medium"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {process.env.NEXT_PUBLIC_APP_ENV === "test" ? (
              <Button
                className="px-6 py-0 z-10 font-medium"
                onClick={() => router.push("/agents")}
              >
                <span>Enter Terminal</span>
                <ArrowRight className="h-4 w-4 inline" />
              </Button>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <Button
                  onClick={handleConnectWallet}
                  disabled={authLoading || isLoading}
                  size="sm"
                  className="w-full z-10 py-3 flex items-center justify-center space-x-2"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-1" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="h-5 w-5" />
                      <span>Connect Wallet</span>
                    </>
                  )}
                </Button>
                <div className="text-xs text-slate-500">
                  Authenticate to continue
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center p-6">
        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <span>Created by</span>
          <div
            className="group rounded-full border border-black/5 bg-neutral-100 text-base text-white
              transition-all ease-in hover:cursor-pointer hover:bg-neutral-200
              dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            <AnimatedShinyText
              className="inline-flex space-x-2 items-center justify-center px-3 py-1 transition ease-out
                hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400"
            >
              <span>🔥</span>
              <span>0xZapLabs</span>
            </AnimatedShinyText>
          </div>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
}