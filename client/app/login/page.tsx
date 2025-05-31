"use client";

import { useState, useEffect } from "react";
import { Wallet, Loader2, Plus, TestTube, Settings } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { MiniKit } from "@worldcoin/minikit-js";
import { APP_NAME } from "@/lib/constants";
import { useUser } from "@/providers/user-provider";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
      const timestamp = Date.now();
      const walletAddress = `0x1234567890123456789012345671201234567123`;
      const username = `TestNewUser_${timestamp}`;
      
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
      <main className="h-[100dvh] w-full relative overflow-hidden bg-gradient-to-br from-violet-500 to-violet-700">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/background/forest.png"
            alt="Background"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
          {/* Pixelized Loading Spinner */}
          <div className="mb-6 relative">
            <div className="w-16 h-16 bg-white border-4 border-gray-800 shadow-[4px_4px_0_#374151] animate-pulse">
              <div className="w-full h-full bg-gradient-to-br from-violet-400 to-violet-600"></div>
            </div>
          </div>
          <div className="font-silkscreen text-xl font-bold text-white uppercase tracking-wider drop-shadow-lg">
            Loading MiniKit...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-[100dvh] w-full relative overflow-hidden">
      {/* Forest Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/background/forest.png"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Overlay for better contrast */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 px-3 py-2 bg-gradient-to-r from-violet-500 to-violet-600 border-1 border-violet-800 shadow-[1px_1px_0_#581c87]">
        <div className="flex items-center justify-center">
          <div className="font-silkscreen text-sm font-bold text-white uppercase tracking-wider drop-shadow-lg">
            {APP_NAME}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 pb-32">
        
        {/* Title */}
        <div className="text-center mb-8">
          <div className="font-silkscreen text-4xl font-bold text-white uppercase tracking-wider drop-shadow-lg mb-2">
            CAPYDATA
          </div>
          <div className="font-silkscreen text-sm text-white/90 uppercase tracking-wide drop-shadow-md">
            EARN AND LEARN ABOUT YOURSELF WITH AI
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6 w-full max-w-md">
          <div className="space-y-4">
            {/* World Wallet Authentication Button */}
            {!isTestMode && (
              <button
                onClick={handleConnectWallet}
                disabled={authLoading}
                className={cn(
                  "font-silkscreen w-full h-14 text-white text-sm font-bold uppercase bg-violet-500 border-4 border-violet-700 shadow-[4px_4px_0_#4c1d95] px-6 py-2 transition-all flex items-center justify-center gap-3",
                  authLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-violet-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#4c1d95]"
                )}
              >
                {authLoading ? (
                  <>
                    <span>CONNECTING...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-5 w-5" />
                    <span>CONNECT WORLD WALLET</span>
                  </>
                )}
              </button>
            )}

            {/* Test Mode Buttons */}
            {isTestMode && (
              <>
                <button
                  onClick={handleTestWithData}
                  disabled={authLoading}
                  className={cn(
                    "font-silkscreen w-full h-14 text-white text-sm font-bold uppercase bg-green-500 border-4 border-green-700 shadow-[4px_4px_0_#14532d] px-6 py-2 transition-all flex items-center justify-center gap-3",
                    authLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-green-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#14532d]"
                  )}
                >
                  {authLoading ? (
                    <>
                      <span>LOADING...</span>
                    </>
                  ) : (
                    <>
                      <TestTube className="h-5 w-5" />
                      <span>TEST WITH EXISTING PET</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleTestNewUser}
                  disabled={authLoading}
                  className={cn(
                    "font-silkscreen w-full h-14 text-gray-800 text-sm font-bold uppercase bg-white border-4 border-gray-700 shadow-[4px_4px_0_#374151] px-6 py-2 transition-all flex items-center justify-center gap-3",
                    authLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#374151]"
                  )}
                >
                  {authLoading ? (
                    <>
                      <span>LOADING...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="h-5 w-5" />
                      <span>TEST AS NEW USER</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDirectCreatePet}
                  disabled={authLoading}
                  className={cn(
                    "font-silkscreen w-full h-14 text-white text-sm font-bold uppercase bg-yellow-500 border-4 border-yellow-700 shadow-[4px_4px_0_#92400e] px-6 py-2 transition-all flex items-center justify-center gap-3",
                    authLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-yellow-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#92400e]"
                  )}
                >
                  <Plus className="h-5 w-5" />
                  <span>CREATE PET DIRECTLY</span>
                </button>
              </>
            )}

            {/* Test Mode Indicator */}
            {isTestMode && (
              <div className="bg-yellow-300 border-4 border-yellow-600 shadow-[4px_4px_0_#92400e] p-4">
                <div className="font-silkscreen text-sm font-bold text-yellow-800 uppercase mb-1">
                  🧪 TEST MODE ACTIVE
                </div>
                <div className="font-silkscreen text-xs text-yellow-700 uppercase">
                  MINIKIT AUTHENTICATION DISABLED
                </div>
              </div>
            )}

            <div className="font-silkscreen text-xs text-center text-gray-600 uppercase mt-4">
              <span className="font-bold">DISCLAIMER:</span> CURRENT BETA CAPYBARAS
            </div>
          </div>
        </div>

        {/* Capybara Image */}
        <div className="absolute bottom-20 right-4 z-5">
          <Image
            src="/capybara/common/default.png"
            alt="Capybara"
            width={200}
            height={200}
            className="w-64 h-64 object-contain drop-shadow-2xl"
            priority
          />
        </div>
      </div>
      
      {/* Made in EthPrague Badge */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-white border-2 border-gray-800 shadow-[2px_2px_0_#374151] px-4 py-2">
          <div className="font-silkscreen text-xs text-violet-600 font-bold uppercase">
            MADE IN ETHPRAGUE
          </div>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 