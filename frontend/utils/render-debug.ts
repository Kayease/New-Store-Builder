import { useEffect } from "react";

// Debug utility for React re-renders
export const debugRender = (componentName: string, props?: any) => {
  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_MODE === "development"
  ) {
  }
};

// Hook to track component renders
export const useRenderTracker = (componentName: string) => {
  useEffect(() => {
    debugRender(componentName);
  });
};

// Call this function in browser console to debug renders
(window as any).debugRender = debugRender;
