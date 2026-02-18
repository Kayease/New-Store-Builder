"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  loadingId?: string;
}

interface LoadingContextType {
  loadingStates: Record<string, LoadingState>;
  setLoading: (id: string, isLoading: boolean, text?: string) => void;
  setGlobalLoading: (isLoading: boolean, text?: string) => void;
  isGlobalLoading: boolean;
  globalLoadingText?: string;
  clearAllLoading: () => void;
  clearLoading: (id: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});
  const [globalLoading, setGlobalLoadingState] = useState<{ isLoading: boolean; text?: string }>({
    isLoading: false,
    text: undefined
  });

  const setLoading = useCallback((id: string, isLoading: boolean, text?: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [id]: {
        isLoading,
        loadingText: text,
        loadingId: id
      }
    }));
  }, []);

  const setGlobalLoading = useCallback((isLoading: boolean, text?: string) => {
    setGlobalLoadingState({ isLoading, text });
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
    setGlobalLoadingState({ isLoading: false, text: undefined });
  }, []);

  const clearLoading = useCallback((id: string) => {
    setLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[id];
      return newStates;
    });
  }, []);

  const isGlobalLoading = globalLoading.isLoading;
  const globalLoadingText = globalLoading.text;

  const value: LoadingContextType = {
    loadingStates,
    setLoading,
    setGlobalLoading,
    isGlobalLoading,
    globalLoadingText,
    clearAllLoading,
    clearLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

// Hook for component-specific loading
export const useComponentLoading = (componentId: string) => {
  const { loadingStates, setLoading, clearLoading } = useLoading();
  
  const isLoading = loadingStates[componentId]?.isLoading || false;
  const loadingText = loadingStates[componentId]?.loadingText;

  const startLoading = useCallback((text?: string) => {
    setLoading(componentId, true, text);
  }, [componentId, setLoading]);

  const stopLoading = useCallback(() => {
    setLoading(componentId, false);
  }, [componentId, setLoading]);

  const clear = useCallback(() => {
    clearLoading(componentId);
  }, [componentId, clearLoading]);

  return {
    isLoading,
    loadingText,
    startLoading,
    stopLoading,
    clear
  };
};

// Hook for async operations with loading
export const useAsyncLoading = () => {
  const { setGlobalLoading } = useLoading();

  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    loadingText?: string
  ): Promise<T> => {
    try {
      setGlobalLoading(true, loadingText);
      const result = await asyncFn();
      return result;
    } finally {
      setGlobalLoading(false);
    }
  }, [setGlobalLoading]);

  return { withLoading };
};

export default LoadingContext;
