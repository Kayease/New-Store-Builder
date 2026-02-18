"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type StoreContextType = {
  storeSlug: string;
  storeId?: string;
  pageTitle: string;
  setStoreSlug: (s: string) => void;
  setStoreId: (s: string) => void;
  setPageTitle: (t: string) => void;
};

const Ctx = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [storeSlug, setStoreSlug] = useState<string>("mystore");
  const [storeId, setStoreId] = useState<string | undefined>(undefined);
  const [pageTitle, setPageTitle] = useState<string>("Store Merchant Dashboard");

  useEffect(() => {
    const savedSlug = localStorage.getItem("admin.storeSlug");
    const savedId = localStorage.getItem("admin.storeId");
    if (savedSlug) setStoreSlug(savedSlug);
    if (savedId) setStoreId(savedId);
  }, []);

  useEffect(() => {
    localStorage.setItem("admin.storeSlug", storeSlug || "");
    if (storeId) {
      localStorage.setItem("admin.storeId", storeId);
      localStorage.setItem("merchant.storeId", storeId);
      localStorage.setItem("storeId", storeId);
    }
  }, [storeSlug, storeId]);

  // Listen for store slug changes and refresh the page if needed
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only handle changes from other tabs/windows, not current tab
      if (
        e.key === "admin.storeSlug" &&
        e.newValue &&
        e.newValue !== storeSlug &&
        e.storageArea === localStorage
      ) {
        // Store slug changed in another tab/window, update current context
        if (typeof window !== "undefined") {
          setStoreSlug(e.newValue);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, [storeSlug]);

  const value = useMemo(
    () => ({
      storeSlug,
      storeId,
      pageTitle,
      setStoreSlug,
      setStoreId,
      setPageTitle,
    }),
    [storeSlug, storeId, pageTitle]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStoreCtx() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStoreCtx must be used within StoreProvider");
  return ctx;
}
