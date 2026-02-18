import React from "react";

export default function Loader() {
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30">
        <span className="relative flex h-16 w-16">
          {/* Outer faint blue background ring */}
          <span
            className="absolute inset-0 rounded-full bg-blue-100 animate-pulse"
            aria-hidden="true"
          ></span>
          <svg
            className="relative h-16 w-16 text-blue-600"
            viewBox="0 0 50 50"
            fill="none"
          >
            <circle
              cx="25"
              cy="25"
              r="20"
              stroke="#3b82f6"
              strokeWidth="6"
              className="opacity-20"
            />
            <path
              d="M45 25c0-11.046-8.954-20-20-20"
              stroke="#2563eb"
              strokeWidth="6"
              strokeLinecap="round"
              style={{
                transformOrigin: "center",
                animation: "loader-spin 1s linear infinite",
              }}
            />
          </svg>
          <style>
            {`
              @keyframes loader-spin {
                to {
                  transform: rotate(360deg);
                }
              }
            `}
          </style>
        </span>
      </div>
    </>
  );
}
