import { useState, useCallback, useMemo } from 'react';

export const useFormState = <T extends Record<string, any>>(initialState: T) => {
  const [state, setState] = useState<T>(initialState);

  const updateField = useCallback((field: keyof T, value: any) => {
    setState(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const updateFields = useCallback((updates: Partial<T>) => {
    setState(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, [initialState]);

  const resetField = useCallback((field: keyof T) => {
    setState(prev => ({
      ...prev,
      [field]: initialState[field],
    }));
  }, [initialState]);

  // Memoized values to prevent unnecessary re-renders
  const memoizedState = useMemo(() => state, [state]);

  return {
    state: memoizedState,
    updateField,
    updateFields,
    reset,
    resetField,
  };
};
