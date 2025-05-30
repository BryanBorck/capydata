"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthState, UserData, createUserSession } from '@/lib/services/auth'
import { getPetsByOwner } from '@/lib/services/pets'
import { Database } from '@/lib/types/database'

type Pet = Database['public']['Tables']['pets']['Row']

interface UserContextType extends AuthState {
  pets: Pet[]
  activePet: Pet | null
  login: (walletAddress: string, username?: string) => Promise<void>
  logout: () => void
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

  const isAuthenticated = !!user

  // Load user data from session storage on mount
  useEffect(() => {
    const loadStoredUser = () => {
      try {
        const storedUser = localStorage.getItem('datagotchi_user')
        const storedActivePet = localStorage.getItem('datagotchi_active_pet')
        
        if (storedUser) {
          const userData = JSON.parse(storedUser) as UserData
          setUser(userData)
          
          // Load pets for this user
          loadUserPets(userData.wallet_address)
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
    } catch (error) {
      console.error('Error loading user pets:', error)
      setPets([])
    }
  }

  // Login function
  const login = async (walletAddress: string, username?: string) => {
    setIsLoading(true)
    try {
      // Create or get user session from Supabase
      const userData = await createUserSession(walletAddress, username)
      
      setUser(userData)
      localStorage.setItem('datagotchi_user', JSON.stringify(userData))
      
      // Load user's pets
      await loadUserPets(userData.wallet_address)
      
      console.log('User logged in successfully:', userData)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    setPets([])
    setActivePetState(null)
    localStorage.removeItem('datagotchi_user')
    localStorage.removeItem('datagotchi_active_pet')
    console.log('User logged out')
  }

  // Refresh user data
  const refreshUserData = async () => {
    if (!user) return
    
    try {
      await loadUserPets(user.wallet_address)
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }

  // Set active pet
  const setActivePet = (pet: Pet) => {
    setActivePetState(pet)
    localStorage.setItem('datagotchi_active_pet', JSON.stringify(pet))
  }

  const value: UserContextType = {
    user,
    pets,
    activePet,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUserData,
    setActivePet
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
} 