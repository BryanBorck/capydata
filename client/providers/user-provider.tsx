"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthState, UserData, createUserSession, deleteAccount as deleteUserAccount, getProfileByWallet } from '@/lib/services/auth'
import { getPetsByOwner } from '@/lib/services/pets'
import { Database } from '@/lib/types/database'

type Pet = Database['public']['Tables']['pets']['Row']

interface UserContextType extends AuthState {
  pets: Pet[]
  activePet: Pet | null
  login: (walletAddress: string, username?: string) => Promise<void>
  logout: () => void
  deleteAccount: () => Promise<void>
  refreshUserData: () => Promise<void>
  setActivePet: (pet: Pet) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<UserData | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [activePet, setActivePetState] = useState<Pet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialVerificationComplete, setIsInitialVerificationComplete] = useState(false)

  const isAuthenticated = !!user

  // Load user data from session storage on mount
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = localStorage.getItem('datagotchi_user')
        const storedActivePet = localStorage.getItem('datagotchi_active_pet')
        
        if (storedUser) {
          const userData = JSON.parse(storedUser) as UserData
          setUser(userData)
          
          // Check if user data has points field, if not, refresh it
          if (userData.points === undefined) {
            console.log('User data missing points field, refreshing...')
            const profile = await getProfileByWallet(userData.wallet_address)
            if (profile) {
              const updatedUserData: UserData = {
                wallet_address: profile.wallet_address,
                username: profile.username,
                points: profile.points,
                created_at: profile.created_at
              }
              setUser(updatedUserData)
              localStorage.setItem('datagotchi_user', JSON.stringify(updatedUserData))
            }
          }
          
          // Load pets for this user and wait for completion
          await loadUserPets(userData.wallet_address)
        }
        
        if (storedActivePet) {
          const activePetData = JSON.parse(storedActivePet) as Pet
          setActivePetState(activePetData)
        }
      } catch (error) {
        console.error('Error loading stored user data:', error)
        // Clear corrupted data
        localStorage.removeItem('datagotchi_user')
        localStorage.removeItem('datagotchi_active_pet')
      } finally {
        setIsLoading(false)
        setIsInitialVerificationComplete(true)
      }
    }

    loadStoredUser()
  }, [])

  // Load user's pets
  const loadUserPets = async (walletAddress: string) => {
    try {
      const userPets = await getPetsByOwner(walletAddress)
      setPets(userPets)
      
      // Set first pet as active if no active pet is set
      if (userPets.length > 0 && !activePet) {
        setActivePetState(userPets[0])
        localStorage.setItem('datagotchi_active_pet', JSON.stringify(userPets[0]))
      }
      
      return userPets
    } catch (error) {
      console.error('Error loading user pets:', error)
      setPets([])
      return []
    }
  }

  // Login function
  const login = async (walletAddress: string, username?: string) => {
    setIsLoading(true)
    setIsInitialVerificationComplete(false)
    try {
      // Create or get user session from Supabase
      const userData = await createUserSession(walletAddress, username)
      
      setUser(userData)
      localStorage.setItem('datagotchi_user', JSON.stringify(userData))
      
      // Load user's pets and wait for completion
      await loadUserPets(userData.wallet_address)
      
      console.log('User logged in successfully:', userData)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
      setIsInitialVerificationComplete(true)
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    setPets([])
    setActivePetState(null)
    setIsInitialVerificationComplete(false)
    localStorage.removeItem('datagotchi_user')
    localStorage.removeItem('datagotchi_active_pet')
    console.log('User logged out')
  }

  // Refresh user profile data
  const refreshUserProfile = async () => {
    if (!user) return
    
    try {
      // Get fresh user data from database
      const profile = await getProfileByWallet(user.wallet_address)
      if (profile) {
        const updatedUserData: UserData = {
          wallet_address: profile.wallet_address,
          username: profile.username,
          points: profile.points,
          created_at: profile.created_at
        }
        setUser(updatedUserData)
        localStorage.setItem('datagotchi_user', JSON.stringify(updatedUserData))
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error)
    }
  }

  // Refresh user data
  const refreshUserData = async () => {
    if (!user) return
    
    try {
      // Refresh both user profile and pets
      await Promise.all([
        refreshUserProfile(),
        loadUserPets(user.wallet_address)
      ])
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }

  // Set active pet
  const setActivePet = (pet: Pet) => {
    setActivePetState(pet)
    localStorage.setItem('datagotchi_active_pet', JSON.stringify(pet))
  }

  // Delete account
  const deleteAccount = async () => {
    if (!user) return
    
    try {
      await deleteUserAccount(user.wallet_address)
      setUser(null)
      setPets([])
      setActivePetState(null)
      setIsInitialVerificationComplete(false)
      localStorage.removeItem('datagotchi_user')
      localStorage.removeItem('datagotchi_active_pet')
      console.log('Account deleted')
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  const value: UserContextType = {
    user,
    pets,
    activePet,
    isLoading,
    isAuthenticated,
    login,
    logout,
    deleteAccount,
    refreshUserData,
    setActivePet
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
} 