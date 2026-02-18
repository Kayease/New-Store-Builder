"use client";
import React from "react";
import { cn } from "../../utils/cn";

export type LoaderVariant =
  | "spinner"
  | "dots"
  | "pulse"
  | "skeleton"
  | "progress"
  | "overlay"
  | "inline"
  | "button"
  | "page";

export type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface UniversalLoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  color?: "primary" | "secondary" | "white" | "gray";
  text?: string;
  progress?: number; // 0-100 for progress variant
  overlay?: boolean;
  fullscreen?: boolean;
  className?: string;
  showText?: boolean;
  animated?: boolean;
}

const sizeClasses = {
  xs: "h-4 w-4",
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const colorClasses = {
  primary: "text-blue-600",
  secondary: "text-gray-600",
  white: "text-white",
  gray: "text-gray-400",
};

// Spinner Component
const SpinnerLoader = ({
  size,
  color,
  className,
}: {
  size: LoaderSize;
  color: string;
  className?: string;
}) => (
  <div className={cn("relative", sizeClasses[size], className)}>
    <div
      className={cn(
        "absolute inset-0 rounded-full border-2 border-current opacity-20",
        colorClasses[color as keyof typeof colorClasses]
      )}
    />
    <div
      className={cn(
        "absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin",
        colorClasses[color as keyof typeof colorClasses]
      )}
    />
  </div>
);

// Dots Component
const DotsLoader = ({
  size,
  color,
  className,
}: {
  size: LoaderSize;
  color: string;
  className?: string;
}) => {
  const dotSize =
    size === "xs"
      ? "h-1 w-1"
      : size === "sm"
      ? "h-2 w-2"
      : size === "md"
      ? "h-3 w-3"
      : size === "lg"
      ? "h-4 w-4"
      : "h-5 w-5";

  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full animate-bounce",
            dotSize,
            colorClasses[color as keyof typeof colorClasses]
          )}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
};

// Pulse Component
const PulseLoader = ({
  size,
  color,
  className,
}: {
  size: LoaderSize;
  color: string;
  className?: string;
}) => (
  <div
    className={cn(
      "rounded-full animate-pulse",
      sizeClasses[size],
      colorClasses[color as keyof typeof colorClasses],
      className
    )}
  />
);

// Progress Component
const ProgressLoader = ({
  progress = 0,
  size,
  color,
  className,
  text,
}: {
  progress: number;
  size: LoaderSize;
  color: string;
  className?: string;
  text?: string;
}) => {
  const strokeWidth =
    size === "xs"
      ? 2
      : size === "sm"
      ? 3
      : size === "md"
      ? 4
      : size === "lg"
      ? 6
      : 8;
  const radius =
    size === "xs"
      ? 8
      : size === "sm"
      ? 12
      : size === "md"
      ? 16
      : size === "lg"
      ? 24
      : 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg
        className="w-full h-full transform -rotate-90"
        viewBox={`0 0 ${(radius + strokeWidth) * 2} ${
          (radius + strokeWidth) * 2
        }`}
      >
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={cn(
            "opacity-20",
            colorClasses[color as keyof typeof colorClasses]
          )}
        />
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-300 ease-in-out",
            colorClasses[color as keyof typeof colorClasses]
          )}
        />
      </svg>
      {text && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "text-xs font-medium",
              colorClasses[color as keyof typeof colorClasses]
            )}
          >
            {text}
          </span>
        </div>
      )}
    </div>
  );
};

// Skeleton Component
const SkeletonLoader = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse", className)}>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
);

// Button Loader
const ButtonLoader = ({
  size,
  color,
  className,
}: {
  size: LoaderSize;
  color: string;
  className?: string;
}) => {
  const spinnerSize =
    size === "xs" ? "h-3 w-3" : size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <svg
      className={cn(
        "animate-spin",
        spinnerSize,
        colorClasses[color as keyof typeof colorClasses],
        className
      )}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Main Universal Loader Component
export const UniversalLoader: React.FC<UniversalLoaderProps> = ({
  variant = "spinner",
  size = "md",
  color = "primary",
  text,
  progress = 0,
  overlay = false,
  fullscreen = false,
  className,
  showText = true,
  animated = true,
}) => {
  const renderLoader = () => {
    switch (variant) {
      case "spinner":
        return (
          <SpinnerLoader size={size} color={color} className={className} />
        );
      case "dots":
        return <DotsLoader size={size} color={color} className={className} />;
      case "pulse":
        return <PulseLoader size={size} color={color} className={className} />;
      case "progress":
        return (
          <ProgressLoader
            progress={progress}
            size={size}
            color={color}
            className={className}
            text={text}
          />
        );
      case "skeleton":
        return <SkeletonLoader className={className} />;
      case "button":
        return <ButtonLoader size={size} color={color} className={className} />;
      default:
        return (
          <SpinnerLoader size={size} color={color} className={className} />
        );
    }
  };

  const loaderContent = (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-3",
        fullscreen && "min-h-screen",
        className
      )}
    >
      {renderLoader()}
      {showText && text && (
        <p
          className={cn(
            "text-sm font-medium",
            colorClasses[color as keyof typeof colorClasses]
          )}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (overlay || fullscreen) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          fullscreen ? "bg-white" : "bg-white/80 backdrop-blur-sm",
          className
        )}
      >
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

// Page Loader Component
export const PageLoader: React.FC<{ text?: string; className?: string }> = ({
  text = "Loading...",
  className,
}) => (
  <UniversalLoader
    variant="spinner"
    size="lg"
    color="primary"
    text={text}
    fullscreen
    className={className}
  />
);

// Inline Loader Component
export const InlineLoader: React.FC<{
  text?: string;
  size?: LoaderSize;
  className?: string;
}> = ({ text, size = "sm", className }) => (
  <UniversalLoader
    variant="spinner"
    size={size}
    color="primary"
    text={text}
    className={className}
  />
);

// Overlay Loader Component
export const OverlayLoader: React.FC<{
  text?: string;
  className?: string;
}> = ({ text, className }) => (
  <UniversalLoader
    variant="spinner"
    size="md"
    color="primary"
    text={text}
    overlay
    className={className}
  />
);

// Button Loader Component
export const ButtonLoaderSpinner: React.FC<{
  size?: LoaderSize;
  color?: "primary" | "secondary" | "white" | "gray";
  className?: string;
}> = ({ size = "sm", color = "white", className }) => (
  <ButtonLoader size={size} color={color} className={className} />
);

export default UniversalLoader;
