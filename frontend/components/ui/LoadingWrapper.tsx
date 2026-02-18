"use client";
import React from "react";
import { UniversalLoader, LoaderVariant, LoaderSize } from "./UniversalLoader";
import { cn } from "../../utils/cn";

interface LoadingWrapperProps {
  isLoading: boolean;
  loadingText?: string;
  variant?: LoaderVariant;
  size?: LoaderSize;
  color?: "primary" | "secondary" | "white" | "gray";
  className?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeight?: string;
  preserveContent?: boolean; // If true, content stays visible while loading
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  isLoading,
  loadingText,
  variant = "spinner",
  size = "md",
  color = "primary",
  className,
  children,
  fallback,
  minHeight = "200px",
  preserveContent = false,
}) => {
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (preserveContent) {
      return (
        <div className="relative">
          <div className={cn("opacity-50 pointer-events-none", className)}>
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <UniversalLoader
              variant={variant}
              size={size}
              color={color}
              text={loadingText}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ minHeight }}
      >
        <UniversalLoader
          variant={variant}
          size={size}
          color={color}
          text={loadingText}
        />
      </div>
    );
  }

  return <>{children}</>;
};

// Specialized loading wrappers for common use cases
export const PageLoadingWrapper: React.FC<{
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ isLoading, loadingText, children, className }) => (
  <LoadingWrapper
    isLoading={isLoading}
    loadingText={loadingText}
    variant="spinner"
    size="lg"
    color="primary"
    minHeight="400px"
    className={className}
  >
    {children}
  </LoadingWrapper>
);

export const CardLoadingWrapper: React.FC<{
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ isLoading, loadingText, children, className }) => (
  <LoadingWrapper
    isLoading={isLoading}
    loadingText={loadingText}
    variant="skeleton"
    size="md"
    color="gray"
    minHeight="150px"
    className={className}
  >
    {children}
  </LoadingWrapper>
);

export const ButtonLoadingWrapper: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ isLoading, children, className }) => (
  <LoadingWrapper
    isLoading={isLoading}
    variant="button"
    size="sm"
    color="white"
    preserveContent
    className={className}
  >
    {children}
  </LoadingWrapper>
);

export const TableLoadingWrapper: React.FC<{
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  rows?: number;
}> = ({ isLoading, loadingText, children, className, rows = 5 }) => {
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
        {loadingText && (
          <div className="text-center text-sm text-gray-500 mt-4">
            {loadingText}
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default LoadingWrapper;
