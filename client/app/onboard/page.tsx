"use client"

import { useEffect, useState } from "react"
import { Loader2, Sparkles, Dice1, Zap, Gem, ChevronLeft, ChevronRight, Star, Trophy, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { useUser } from "@/providers/user-provider"
import { createRandomPet } from "@/lib/services/pets"
import { APP_NAME } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { FlickeringGrid } from "@/components/magicui/flickering-grid"
import Image from "next/image"

// Available variants
const CAPYBARA_VARIANTS = [
  { id: 'default', name: 'Default', image: '/capybara/variants/default-capybara.png' },
  { id: 'pink', name: 'Pink', image: '/capybara/variants/pink-capybara.png' },
  { id: 'blue', name: 'Blue', image: '/capybara/variants/blue-capybara.png' },
  { id: 'ice', name: 'Ice', image: '/capybara/variants/ice-capybara.png' },
  { id: 'black', name: 'Black', image: '/capybara/variants/black-capybara.png' },
]

const BACKGROUND_VARIANTS = [
  { id: 'forest', name: 'Forest', image: '/background/variants/forest.png' },
  { id: 'lake', name: 'Lake', image: '/background/variants/lake.png' },
  { id: 'ice', name: 'Ice', image: '/background/variants/ice.png' },
  { id: 'farm', name: 'Farm', image: '/background/variants/farm.png' },
  { id: 'beach', name: 'Beach', image: '/background/variants/beach.png' },
]

// Loading skeleton component
const ImageSkeleton = ({ aspectRatio }: { aspectRatio: string }) => (
  <div className={cn("animate-pulse bg-gray-200 w-full", aspectRatio)}>
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gray-300 border-t-transparent animate-spin"></div>
    </div>
  </div>
)

// Lazy loaded image component
const LazyImage = ({ 
  src, 
  alt, 
  aspectRatio, 
  className = "",
  objectFit = "object-cover" 
}: { 
  src: string
  alt: string
  aspectRatio: string
  className?: string
  objectFit?: string
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <div className={cn("relative w-full", aspectRatio)}>
      {isLoading && <ImageSkeleton aspectRatio={aspectRatio} />}
      
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          objectFit,
          className,
          isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-300"
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
        loading="lazy"
      />
      
      {hasError && !isLoading && (
        <div className={cn("absolute inset-0 bg-gray-200 flex items-center justify-center", aspectRatio)}>
          <div className="text-gray-500 text-xs font-silkscreen uppercase">
            FAILED TO LOAD
          </div>
        </div>
      )}
    </div>
  )
}

// Success screen component
const SuccessScreen = ({ 
  petName, 
  selectedVariant, 
  selectedBackground, 
  onGoHome 
}: { 
  petName: string
  selectedVariant: string
  selectedBackground: string
  onGoHome: () => void
}) => {

  const selectedCapybara = CAPYBARA_VARIANTS.find(v => v.id === selectedVariant)
  const selectedBg = BACKGROUND_VARIANTS.find(b => b.id === selectedBackground)

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-6">

      {/* Success Card */}
      <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-8 w-full max-w-md text-center relative">
        {/* Trophy Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-yellow-700 shadow-[4px_4px_0_#92400e] mx-auto flex items-center justify-center">
            <Trophy className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Success Message */}
        <div className="mb-6">
          <div className="font-silkscreen text-2xl font-bold text-gray-800 uppercase mb-2">
            SUCCESS!
          </div>
          <div className="font-silkscreen text-sm text-gray-600 uppercase mb-4">
            {petName} HAS BEEN CREATED!
          </div>
        </div>

        {/* Pet Preview */}
        <div className="mb-6 relative">
          {/* Background Preview */}
          <div className="relative w-32 h-24 mx-auto mb-4 border-2 border-gray-600">
            {selectedBg && (
              <Image
                src={selectedBg.image}
                alt={selectedBg.name}
                fill
                className="object-cover"
              />
            )}
            {/* Capybara Overlay */}
            <div className="absolute inset-0 flex items-end justify-center pb-2">
              <div className="w-16 h-16 relative">
                {selectedCapybara && (
                  <Image
                    src={selectedCapybara.image}
                    alt={selectedCapybara.name}
                    fill
                    className="object-contain"
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Variant and Background Labels */}
          <div className="flex justify-center space-x-4 text-xs">
            <div className="bg-violet-100 border-2 border-violet-600 px-2 py-1">
              <span className="font-silkscreen font-bold text-violet-800 uppercase">
                {selectedCapybara?.name}
              </span>
            </div>
            <div className="bg-green-100 border-2 border-green-600 px-2 py-1">
              <span className="font-silkscreen font-bold text-green-800 uppercase">
                {selectedBg?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Go Home Button */}
        <button
          onClick={onGoHome}
          className="font-silkscreen w-full h-12 text-white text-sm font-bold uppercase bg-violet-500 border-4 border-violet-700 shadow-[4px_4px_0_#4c1d95] px-6 py-2 hover:bg-violet-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#4c1d95] transition-all flex items-center justify-center gap-2"
        >
          <Home className="h-4 w-4" />
          GO TO HOME
        </button>
      </div>
    </div>
  )
}

export default function OnboardPage() {
  const [step, setStep] = useState(1) // 1: name, 2: capybara, 3: background, 4: success
  const [petName, setPetName] = useState("")
  const [selectedVariant, setSelectedVariant] = useState('default')
  const [selectedBackground, setSelectedBackground] = useState('forest')
  const [isCreating, setIsCreating] = useState(false)
  const [creationSuccess, setCreationSuccess] = useState(false)
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
    if (isAuthenticated && pets.length > 0 && !creationSuccess) {
      router.push("/home")
    }
  }, [isAuthenticated, pets, router, creationSuccess])

  const handleCreatePet = async () => {
    if (!user) return

    if (petName.trim().length < 2) {
      toast.error("Pet name must be at least 2 characters long")
      return
    }

    setIsCreating(true)

    try {
      const newPet = await createRandomPet(
        user.wallet_address, 
        petName.trim(),
        selectedVariant,
        selectedBackground
      )

      toast.success(`${petName} has been created! 🎉`)
      setCreationSuccess(true)
      setStep(4) // Go to success screen

      // Refresh user data to load the new pet
      await refreshUserData()
    } catch (error) {
      console.error("Error creating pet:", error)
      toast.error("Failed to create pet. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleGoHome = () => {
    router.push("/home")
  }

  const generateRandomName = () => {
    const prefixes = ["Cyber", "Pixel", "Quantum", "Neo", "Star", "Luna", "Echo", "Nova"]
    const suffixes = ["gon", "chi", "mon", "bit", "zen", "flux", "wave", "core"]

    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)]

    setPetName(randomPrefix + randomSuffix)
  }

  const nextStep = () => {
    if (step === 1 && petName.trim().length < 2) {
      toast.error("Please enter a pet name first")
      return
    }
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const getStepTitle = () => {
    switch (step) {
      case 1: return "NAME YOUR PET"
      case 2: return "CHOOSE CAPYBARA"
      case 3: return "CHOOSE BACKGROUND"
      case 4: return "PET CREATED!"
      default: return "CREATE PET"
    }
  }

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return "YOUR COMPANION AWAITS A NAME"
      case 2: return "PICK YOUR FAVORITE STYLE"
      case 3: return "SELECT A HOME ENVIRONMENT"
      case 4: return "WELCOME TO YOUR NEW COMPANION!"
      default: return ""
    }
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return (
    <main className="h-[100dvh] w-full relative overflow-hidden">
      {/* Flickering Grid Background */}
      <FlickeringGrid
        className="absolute inset-0 -z-5 h-full w-full [mask-image:radial-gradient(1200px_circle_at_center,transparent,white)]"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.5}
        flickerChance={0.1}
      />

      {/* Top Header Bar */}
      <header className="relative z-10 px-3 py-2 bg-gradient-to-r from-violet-500 to-violet-600 border-1 border-violet-800 shadow-[1px_1px_0_#581c87]">
        <div className="flex items-center justify-center">
          <div className="font-silkscreen text-sm font-bold text-white uppercase tracking-wider drop-shadow-lg">
            {APP_NAME}
          </div>
        </div>
      </header>

      {/* Success Screen */}
      {step === 4 && creationSuccess && (
        <SuccessScreen
          petName={petName}
          selectedVariant={selectedVariant}
          selectedBackground={selectedBackground}
          onGoHome={handleGoHome}
        />
      )}

      {/* Main Content - Steps 1-3 */}
      {step < 4 && (
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 pb-16">
          
          {/* Title */}
          <div className="text-center mb-6">
            <div className="font-silkscreen text-3xl font-bold text-gray-800 uppercase tracking-wider drop-shadow-lg mb-2">
              {getStepTitle()}
            </div>
            <div className="font-silkscreen text-sm text-gray-600 uppercase tracking-wide drop-shadow-md">
              {getStepSubtitle()}
            </div>
            
            {/* Step indicator */}
            <div className="flex items-center justify-center mt-4 space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-3 h-3 border-2 border-gray-800",
                    i === step ? "bg-violet-500" : "bg-gray-300"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6 w-full max-w-2xl">
            <div className="space-y-6">
              
              {/* Step 1: Name Input */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-2">
                      PET NAME
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ENTER NAME..."
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      maxLength={12}
                      className="font-silkscreen w-full h-12 text-center text-base font-bold uppercase bg-gray-100 border-4 border-gray-600 shadow-[4px_4px_0_#374151] px-4 py-2 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:bg-white focus:border-violet-600 focus:shadow-[4px_4px_0_#4c1d95] transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={generateRandomName}
                      className="font-silkscreen h-10 text-gray-800 text-xs font-bold uppercase bg-yellow-300 border-2 border-yellow-600 shadow-[2px_2px_0_#92400e] px-4 py-2 hover:bg-yellow-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#92400e] transition-all flex items-center gap-2"
                    >
                      <Dice1 className="h-4 w-4" />
                      RANDOM
                    </button>
                    <div className="font-silkscreen text-xs text-gray-600 uppercase">
                      {petName.length}/12
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Capybara Variant Selection */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-4">
                      CAPYBARA STYLE
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {CAPYBARA_VARIANTS.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant.id)}
                        className={cn(
                          "relative border-4 shadow-[4px_4px_0_#374151] transition-all hover:scale-105",
                          selectedVariant === variant.id
                            ? "border-violet-600 bg-violet-100"
                            : "border-gray-600 bg-white hover:border-gray-800"
                        )}
                      >
                        <LazyImage
                          src={variant.image}
                          alt={variant.name}
                          aspectRatio="aspect-[4/3]"
                          className="p-2"
                          objectFit="object-contain"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-gray-600 p-2">
                          <div className="font-silkscreen text-xs font-bold text-gray-800 uppercase text-center">
                            {variant.name}
                          </div>
                        </div>
                        {selectedVariant === variant.id && (
                          <div className="absolute top-1 right-1 w-6 h-6 bg-violet-500 border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Background Selection */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-4">
                      BACKGROUND STYLE
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {BACKGROUND_VARIANTS.map((background) => (
                      <button
                        key={background.id}
                        onClick={() => setSelectedBackground(background.id)}
                        className={cn(
                          "relative border-4 shadow-[4px_4px_0_#374151] transition-all hover:scale-105",
                          selectedBackground === background.id
                            ? "border-violet-600 bg-violet-100"
                            : "border-gray-600 bg-white hover:border-gray-800"
                        )}
                      >
                        <LazyImage
                          src={background.image}
                          alt={background.name}
                          aspectRatio="aspect-[4/3]"
                          objectFit="object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-gray-600 p-1">
                          <div className="font-silkscreen text-xs font-bold text-gray-800 uppercase text-center">
                            {background.name}
                          </div>
                        </div>
                        {selectedBackground === background.id && (
                          <div className="absolute top-1 right-1 w-6 h-6 bg-violet-500 border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between w-full max-w-2xl mt-6">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="font-silkscreen h-12 text-white text-sm font-bold uppercase bg-gray-500 border-4 border-gray-700 shadow-[4px_4px_0_#374151] px-6 py-2 hover:bg-gray-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#374151] transition-all flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                BACK
              </button>
            )}
            
            <div className="flex-1" />

            {step < 3 ? (
              <button
                onClick={nextStep}
                disabled={step === 1 && petName.trim().length < 2}
                className={cn(
                  "font-silkscreen h-12 text-white text-sm font-bold uppercase bg-violet-500 border-4 border-violet-700 shadow-[4px_4px_0_#4c1d95] px-6 py-2 transition-all flex items-center gap-2",
                  step === 1 && petName.trim().length < 2
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-violet-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#4c1d95]"
                )}
              >
                NEXT
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleCreatePet}
                disabled={isCreating}
                className={cn(
                  "font-silkscreen h-12 text-white text-sm font-bold uppercase bg-green-500 border-4 border-green-700 shadow-[4px_4px_0_#14532d] px-6 py-2 transition-all flex items-center gap-3",
                  isCreating
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-green-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#14532d]"
                )}
              >
                {isCreating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin"></div>
                    <span>SUMMONING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>CREATE PET</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
      
      <Toaster />
    </main>
  )
}
