"use client";

import { useState, useEffect } from "react";
import { Wallet, Loader2, Plus, TestTube } from "lucide-react";
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
  const isTestMode = process.env.NEXT_PUBLIC_APP_ENV === "test";

  // Redirect if already authenticated (only if not test mode)
  useEffect(() => {
    if (!isTestMode && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router, isTestMode]);

  // Check MiniKit installation (only if not test mode)
  useEffect(() => {
    if (isTestMode) {
      setIsLoading(false);
      console.log("Test mode -> MiniKit check skipped");
      return;
    }

    const checkMiniKit = async () => {
      const isInstalled = MiniKit.isInstalled();
      if (isInstalled) {
        setIsLoading(false);
      } else {
        setTimeout(checkMiniKit, 1000);
      }
    };

    checkMiniKit();
  }, [isTestMode]);

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
        
        // Redirect to main page which will handle smart routing
        router.push('/');
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

  // Test login with hardcoded wallet and pet
  const handleTestWithData = async () => {
    setAuthLoading(true);
    try {
      const walletAddress = '0x6b84bba6e67a124093933aba8f5b6beb96307d99';
      const username = 'TestUserWithPet';
      
      await login(walletAddress, username);
      
      // Set the active pet ID immediately
      localStorage.setItem('activePetId', '82486b32-af21-403a-b1b8-b2aaec367d9c');
      
      toast.success(`Welcome ${username}! Your pet is ready! 🐾`);
      
      // Redirect to main page
      router.push('/');
    } catch (error) {
      console.error('Test login error:', error);
      toast.error('Test login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Test login without data (will go to onboard)
  const handleTestNewUser = async () => {
    setAuthLoading(true);
    try {
      const walletAddress = 'test_wallet_new_user';
      const username = 'TestNewUser';
      
      await login(walletAddress, username);
      
      toast.success(`Welcome ${username}! Let's create your first pet! ✨`);
      
      // Redirect to main page (will redirect to onboard since no pets)
      router.push('/');
    } catch (error) {
      console.error('Test login error:', error);
      toast.error('Test login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Direct to create pet (bypass login)
  const handleDirectCreatePet = () => {
    router.push('/create-pet');
  };

  if (isLoading && !isTestMode) {
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
            {isTestMode 
              ? "Choose how you'd like to start your Datagotchi journey"
              : "Connect your World wallet to start your Datagotchi journey"
            }
          </p>

          <div className="space-y-3">
            {/* World Wallet Authentication Button */}
            {!isTestMode && (
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

            {/* Test Mode Buttons */}
            {isTestMode && (
              <>
                <Button
                  onClick={handleTestWithData}
                  disabled={authLoading}
                  className="w-full py-3 font-medium bg-green-600 hover:bg-green-700"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <TestTube className="h-5 w-5 mr-2" />
                      <span>Test with Existing Pet</span>
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleTestNewUser}
                  disabled={authLoading}
                  variant="outline"
                  className="w-full py-3 font-medium"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="h-5 w-5 mr-2" />
                      <span>Test as New User</span>
                    </>
                  )}
                </Button>
              </>
            )}

            {/* Direct Create Pet Button (always available) */}
            <Button
              onClick={handleDirectCreatePet}
              disabled={authLoading}
              variant="secondary"
              className="w-full py-3 font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              <span>Create Pet Directly</span>
            </Button>

            {/* Test Mode Indicator */}
            {isTestMode && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  🧪 Test Mode Active
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  MiniKit authentication is disabled
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 