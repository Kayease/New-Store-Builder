"use client";
import { useState, useCallback } from "react";
import { useComponentLoading, useAsyncLoading } from "../contexts/LoadingContext";

// Simple loading hook for local state
export const useLocalLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingText, setLoadingText] = useState<string | undefined>();

  const startLoading = useCallback((text?: string) => {
    setIsLoading(true);
    setLoadingText(text);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingText(undefined);
  }, []);

  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    text?: string
  ): Promise<T> => {
    try {
      startLoading(text);
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    loadingText,
    startLoading,
    stopLoading,
    withLoading
  };
};

// Hook for API calls with loading
export const useApiLoading = () => {
  const { withLoading } = useAsyncLoading();

  const callApi = useCallback(async <T>(
    apiCall: () => Promise<T>,
    loadingText?: string
  ): Promise<T> => {
    return withLoading(apiCall, loadingText);
  }, [withLoading]);

  return { callApi };
};

// Hook for form submission with loading
export const useFormLoading = () => {
  const { isLoading, loadingText, startLoading, stopLoading, withLoading } = useLocalLoading();

  const handleSubmit = useCallback(async <T>(
    submitFn: () => Promise<T>,
    text = "Submitting..."
  ): Promise<T> => {
    return withLoading(submitFn, text);
  }, [withLoading]);

  return {
    isSubmitting: isLoading,
    submitText: loadingText,
    handleSubmit,
    startSubmitting: startLoading,
    stopSubmitting: stopLoading
  };
};

// Hook for page loading
export const usePageLoading = (pageId: string) => {
  const { isLoading, loadingText, startLoading, stopLoading } = useComponentLoading(pageId);

  const loadPage = useCallback(async <T>(
    loadFn: () => Promise<T>,
    text = "Loading page..."
  ): Promise<T> => {
    try {
      startLoading(text);
      const result = await loadFn();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isPageLoading: isLoading,
    pageLoadingText: loadingText,
    loadPage,
    startPageLoading: startLoading,
    stopPageLoading: stopLoading
  };
};

// Hook for data fetching with loading
export const useDataLoading = <T>(dataId: string) => {
  const { isLoading, loadingText, startLoading, stopLoading } = useComponentLoading(dataId);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (
    fetchFn: () => Promise<T>,
    text = "Loading data..."
  ) => {
    try {
      startLoading(text);
      setError(null);
      const result = await fetchFn();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const refetch = useCallback((fetchFn: () => Promise<T>, text?: string) => {
    return fetchData(fetchFn, text);
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    loadingText,
    fetchData,
    refetch,
    setData,
    setError
  };
};

// Hook for multiple loading states
export const useMultipleLoading = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((id: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [id]: isLoading
    }));
  }, []);

  const isLoading = useCallback((id: string) => {
    return loadingStates[id] || false;
  }, [loadingStates]);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  const clearAll = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    clearAll
  };
};

export default useLocalLoading;
