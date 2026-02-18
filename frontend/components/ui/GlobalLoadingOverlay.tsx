"use client";
import React from "react";
import { useLoading } from "../../contexts/LoadingContext";
import { OverlayLoader } from "./UniversalLoader";

export const GlobalLoadingOverlay: React.FC = () => {
  const { isGlobalLoading, globalLoadingText } = useLoading();

  if (!isGlobalLoading) return null;

  return (
    <OverlayLoader 
      text={globalLoadingText || "Loading..."} 
      className="z-[9999]"
    />
  );
};

export default GlobalLoadingOverlay;
