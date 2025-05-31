"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Define the available modes
export type CapybaraMode = "capybara" | "serious";

// Define the context interface
interface CapybaraContextType {
  mode: CapybaraMode;
  setMode: (mode: CapybaraMode) => void;
  toggleMode: () => void;
  isCapybaraMode: boolean;
  isSeriousMode: boolean;
}

// Create the context
const CapybaraContext = createContext<CapybaraContextType | undefined>(undefined);

// Provider props
interface CapybaraProviderProps {
  children: ReactNode;
}

// Default mode
const DEFAULT_MODE: CapybaraMode = "capybara";

// Local storage key
const STORAGE_KEY = "datagotchi_capybara_mode";

// Provider component
export function CapybaraProvider({ children }: CapybaraProviderProps) {
  const [mode, setModeState] = useState<CapybaraMode>(DEFAULT_MODE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load mode from localStorage on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_KEY) as CapybaraMode;
      if (savedMode && (savedMode === "capybara" || savedMode === "serious")) {
        setModeState(savedMode);
      }
    } catch (error) {
      console.error("Error loading capybara mode from localStorage:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save mode to localStorage whenever it changes
  const setMode = (newMode: CapybaraMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch (error) {
      console.error("Error saving capybara mode to localStorage:", error);
    }
  };

  // Toggle between modes
  const toggleMode = () => {
    const newMode = mode === "capybara" ? "serious" : "capybara";
    setMode(newMode);
  };

  // Computed values
  const isCapybaraMode = mode === "capybara";
  const isSeriousMode = mode === "serious";

  // Context value
  const value: CapybaraContextType = {
    mode,
    setMode,
    toggleMode,
    isCapybaraMode,
    isSeriousMode,
  };

  // Don't render children until loaded (prevents hydration issues)
  if (!isLoaded) {
    return null;
  }

  return (
    <CapybaraContext.Provider value={value}>
      {children}
    </CapybaraContext.Provider>
  );
}

// Hook to use the context
export function useCapybara() {
  const context = useContext(CapybaraContext);
  if (context === undefined) {
    throw new Error("useCapybara must be used within a CapybaraProvider");
  }
  return context;
} 