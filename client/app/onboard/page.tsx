"use client"

import { useEffect, useState } from "react"
import { Loader2, Sparkles, Dice1, Zap, Gem } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { useUser } from "@/providers/user-provider"
import { createRandomPet } from "@/lib/services/pets"
import Image from "next/image"

export default function OnboardPage() {
  const [petName, setPetName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const { user, isAuthenticated, pets, refreshUserData } = useUser()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  // If user already has pets, redirect to home
  useEffect(() => {
    if (isAuthenticated && pets.length > 0) {
      router.push("/home")
    }
  }, [isAuthenticated, pets, router])

  const handleCreatePet = async () => {
    if (!user) return

    if (petName.trim().length < 2) {
      toast.error("Pet name must be at least 2 characters long")
      return
    }

    setIsCreating(true)

    try {
      const newPet = await createRandomPet(user.wallet_address, petName.trim())

      toast.success(`${petName} has been created! 🎉`)

      // Refresh user data to load the new pet
      await refreshUserData()

      // Auto redirect to home after success
      setTimeout(() => {
        router.push("/home")
      }, 1500)
    } catch (error) {
      console.error("Error creating pet:", error)
      toast.error("Failed to create pet. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const generateRandomName = () => {
    const prefixes = ["Cyber", "Pixel", "Quantum", "Neo", "Star", "Luna", "Echo", "Nova"]
    const suffixes = ["gon", "chi", "mon", "bit", "zen", "flux", "wave", "core"]

    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)]

    setPetName(randomPrefix + randomSuffix)
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return (
    <main className="min-h-[100dvh] relative overflow-hidden bg-gradient-to-br from-slate-400 via-white to-slate-300">
 
      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600/20 to-gray-400/20 rounded-full border border-gray-500/30 backdrop-blur-sm">
              <span className="text-gray-700 text-sm font-medium">Pet Creation</span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Image src="/gems.png" alt="Pet Creation" width={120} height={120} />
          </div>

          {/* Rarity Card */}
          <div className="relative group">
              <div className="text-center space-y-4">

                <p className="text-gray-700 text-sm">Your companion will be born with unique stats and rarity</p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-sm border border-slate-700/30">
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 border-2 border-gray-600 shadow-lg relative">
                        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 opacity-60"></div>
                        <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white opacity-80"></div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-gray-700 text-sm font-medium">Common</div>
                      <div className="text-gray-600 text-xs">70% chance</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-sm border border-slate-700/30">
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-blue-800 shadow-lg relative transform rotate-45">
                        <div className="absolute inset-0.5 bg-gradient-to-br from-blue-300 to-blue-500 opacity-60"></div>
                        <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white opacity-90"></div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-gray-700 text-sm font-medium">Rare</div>
                      <div className="text-blue-600 text-xs">20% chance</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-sm border border-slate-700/30">
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <div
                        className="w-5 h-7 bg-gradient-to-b from-violet-400 to-violet-600 border-2 border-violet-800 shadow-lg relative"
                        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
                      >
                        <div className="absolute inset-0.5 bg-gradient-to-b from-violet-300 to-violet-500 opacity-60"></div>
                        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white opacity-90"></div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-gray-700 text-sm font-medium">Epic</div>
                      <div className="text-violet-600 text-xs">8% chance</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-sm border border-slate-700/30">
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-orange-700 shadow-lg relative">
                        <div className="absolute inset-0.5 bg-gradient-to-br from-yellow-300 to-orange-400 opacity-70"></div>
                        <div className="absolute inset-1 bg-gradient-to-br from-yellow-200 to-orange-300 opacity-50"></div>
                        <div className="absolute top-1 left-1 w-1 h-1 bg-white opacity-95"></div>
                        <div className="absolute bottom-1 right-1 w-0.5 h-0.5 bg-white opacity-80"></div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-gray-700 text-sm font-medium">Legendary</div>
                      <div className="text-orange-600 text-xs">2% chance</div>
                    </div>
                  </div>
                </div>
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 to-gray-500 rounded-xl blur opacity-20"></div>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter companion name..."
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  maxLength={20}
                  className="w-full h-10 text-center text-base font-medium bg-gray-950/90 backdrop-blur-xl border-gray-500/30 focus:border-gray-400 focus:ring-gray-400/20 text-gray-800 placeholder:text-slate-400 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                onClick={generateRandomName}
                variant="ghost"
                size="sm"
                className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
              >
                <Dice1 className="w-4 h-4 mr-2" />
                Random Name
              </Button>
              <span className="text-violet-400 text-sm">{petName.length}/20</span>
            </div>
          </div>

          {/* Create Button */}
          <div className="space-y-4">
            <Button
              onClick={handleCreatePet}
              disabled={isCreating || petName.trim().length < 2}
              className="w-full h-10 text-base font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Summoning {petName}...</span>
                </div>
              ) : (
                <span>Summon Companion</span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Toaster />
    </main>
  )
}
