"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  api,
  getAuthToken,
  clearAuthToken,
  refreshAuthHeaders,
} from "../lib/api";
import { setCredentials, clearCredentials } from "../store/authSlice";
import { RootState } from "../store";
import Loader from "../components/Loader";

interface User {
  [x: string]: any;
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "user" | "merchant" | "admin";
  status: "active" | "inactive" | "suspended";
  storeId?: string;
  stores?: string[];
  createdAt: string;
  lastLogin: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasStore: boolean;
  userStore: any;
  switchActiveStore: (store: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userStore, setUserStore] = useState<any>(null);
  const [initializing, setInitializing] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  // Get Redux auth state
  const reduxAuth = useSelector((state: RootState) => state.auth) as any;

  const isAuthenticated = !!user;
  const hasStore = !!userStore;

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []); // Remove dependencies to prevent infinite loop

  const initializeAuth = async () => {
    // Prevent multiple initializations
    if (initializing) {
      return;
    }

    setInitializing(true);
    try {
      const token = getAuthToken();
      const profile = localStorage.getItem("kx_profile");

      // Check if we have Redux state first
      if (reduxAuth.token && reduxAuth.user) {
        setUser({
          _id: reduxAuth.user.id || "",
          email: reduxAuth.user.email,
          role: reduxAuth.user.role || "user",
          firstName: reduxAuth.user.firstName,
          lastName: reduxAuth.user.lastName,
          status: "active",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        } as User);
        refreshAuthHeaders();

        // Try to fetch store data
        if (profile) {
          const userData = JSON.parse(profile);
          if (
            userData.storeId ||
            (userData.stores && userData.stores.length > 0)
          ) {
            let storeId =
              userData.storeId ||
              (typeof userData.stores[0] === "string"
                ? userData.stores[0]
                : userData.stores[0]._id);

            // Ensure storeId is a string, not an object
            if (storeId && typeof storeId === "object") {
              storeId = storeId._id || storeId.id || storeId;
            }

            await fetchUserStore(storeId);
          }
        }
      } else if (token && profile) {
        // If both token and profile exist, set user from profile immediately
        const userData = JSON.parse(profile);
        setUser(userData);
        refreshAuthHeaders();

        // Update Redux store
        dispatch(
          setCredentials({
            token,
            user: {
              id: userData._id,
              email: userData.email,
              role: userData.role,
              firstName: userData.firstName,
              lastName: userData.lastName,
            },
          })
        );

        // Check if user has store data in profile
        if (
          userData.storeId ||
          (userData.stores && userData.stores.length > 0)
        ) {
          let storeId =
            userData.storeId ||
            (typeof userData.stores[0] === "string"
              ? userData.stores[0]
              : userData.stores[0]._id);

          // Ensure storeId is a string, not an object
          if (storeId && typeof storeId === "object") {
            storeId = storeId._id || storeId.id || storeId;
          }

          await fetchUserStore(storeId);
        }

        // User data is already up to date from localStorage
      } else if (token) {
        // If only token exists, refresh user data
        refreshAuthHeaders();
        await refreshUser();
      } else {
        // No token, clear everything
        clearAuthToken();
        localStorage.removeItem("kx_profile");
        dispatch(clearCredentials());
        setUser(null);
        setUserStore(null);
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      clearAuthToken();
      localStorage.removeItem("kx_profile");
      dispatch(clearCredentials());
      setUser(null);
      setUserStore(null);
    } finally {
      setIsLoading(false);
      setInitializing(false);
    }
  };

  const refreshUser = async () => {
    // Prevent multiple refresh calls
    if (initializing) {
      return;
    }

    // Check if we have a token before attempting refresh
    const token = getAuthToken();
    if (!token) {
      console.log("No token found, skipping refresh");
      setUser(null);
      setUserStore(null);
      return;
    }

    try {
      const response = await api.get("/auth/profile");
      if (response.data.success) {
        const userData = response.data.data.user;

        // Update Redux store
        dispatch(
          setCredentials({
            token,
            user: {
              id: userData._id,
              email: userData.email,
              role: userData.role,
              firstName: userData.firstName,
              lastName: userData.lastName,
            },
          })
        );

        setUser(userData);

        // Store user profile in localStorage for AdminGuard
        localStorage.setItem("kx_profile", JSON.stringify(userData));

        // Check if user has a store
        if (
          userData.storeId ||
          (userData.stores && userData.stores.length > 0)
        ) {
          const storeId =
            userData.storeId ||
            (typeof userData.stores[0] === "string"
              ? userData.stores[0]
              : userData.stores[0]._id);
          await fetchUserStore(storeId);
        }
      }
    } catch (error: any) {
      console.error("Failed to refresh user:", error);

      // If token is invalid (401/403), clear everything
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        console.log("Token expired or invalid, clearing auth state");
        clearAuthToken();
        localStorage.removeItem("kx_profile");
        dispatch(clearCredentials());
        setUser(null);
        setUserStore(null);
      } else if (!error.response) {
        // Network error (server might be restarting)
        console.log("Network error during auth refresh, keeping existing state");
        // Don't clear user state here, let it retry or stay as is
      } else {
        // Other errors (500, etc.) - keep existing state for resilience
        console.log("Server error during auth refresh, keeping existing state");
      }
    }
  };

  const fetchUserStore = async (storeId: string | any) => {
    try {
      // Ensure storeId is a string - handle object cases
      let id = storeId;
      if (storeId && typeof storeId === "object") {
        id = storeId._id || storeId.id || storeId;
      }

      // First try to get store by ID
      const response = await api.get(`/store/${id}`);
      if (response.data.success) {
        setUserStore(response.data.data);
        // Store the current active store in localStorage for persistence
        // Only update if it's different to avoid unnecessary storage events
        const currentStored = localStorage.getItem("kx_active_store");
        const storeData = JSON.stringify(response.data.data);
        if (currentStored !== storeData) {
          localStorage.setItem("kx_active_store", storeData);
        }
        return;
      }
    } catch (error) {
      console.error("Failed to fetch user store by ID:", error);
    }

    // If store ID fetch fails, try to get user's stores
    try {
      const storesResponse = await api.get("/store/");
      if (storesResponse.data.success && storesResponse.data.data.length > 0) {
        // Check if there's a stored active store
        const storedActiveStore = localStorage.getItem("kx_active_store");
        let activeStore = null;

        if (storedActiveStore) {
          try {
            const parsedStore = JSON.parse(storedActiveStore);
            // Verify the stored store still exists in user's stores
            const storeExists = storesResponse.data.data.find(
              (store: any) => store._id === parsedStore._id
            );
            if (storeExists) {
              activeStore = parsedStore;
            }
          } catch (parseError) {
            console.error("Failed to parse stored active store:", parseError);
          }
        }

        // If no valid stored store, use the most recently created store
        if (!activeStore) {
          // Sort stores by creation date (newest first) and take the first one
          const sortedStores = storesResponse.data.data.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          activeStore = sortedStores[0];
        }

        setUserStore(activeStore);
        // Only update localStorage if the store is different to avoid unnecessary storage events
        const currentStored = localStorage.getItem("kx_active_store");
        const storeData = JSON.stringify(activeStore);
        if (currentStored !== storeData) {
          localStorage.setItem("kx_active_store", storeData);
        }
      }
    } catch (storesError) {
      console.error("Failed to fetch user stores:", storesError);
      setUserStore(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Clear any existing auth state
      clearAuthToken();

      const response = await api.post("/auth/login", { email, password });

      if (response.data.success) {
        const { user: userData, token } = response.data.data;

        // Set token and update API headers
        localStorage.setItem("kx_token", token);
        localStorage.setItem("kx_profile", JSON.stringify(userData));
        refreshAuthHeaders();

        // Update Redux store
        dispatch(
          setCredentials({
            token,
            user: {
              id: userData._id,
              email: userData.email,
              role: userData.role,
              firstName: userData.firstName,
              lastName: userData.lastName,
            },
          })
        );

        setUser(userData);

        // Determine navigation path
        const userRole = userData.role?.toLowerCase();
        const isAdmin = userRole === "admin" || userRole === "super_admin";

        console.log("🔐 Login success. User:", userData.email, "Role:", userRole, "isAdmin:", isAdmin);

        // 1. Priority: Admin Dashboard
        if (isAdmin) {
          console.log("🚀 Redirecting to Admin Dashboard");
          setTimeout(() => {
            router.push("/admin/dashboard");
          }, 100);
          return { success: true, message: "Login successful" };
        }

        // 2. Merchant/Manager Store Check
        if (
          userData.storeId ||
          (userData.stores && userData.stores.length > 0)
        ) {
          let storeId =
            userData.storeId ||
            (typeof userData.stores[0] === "string"
              ? userData.stores[0]
              : userData.stores[0]._id);

          if (storeId && typeof storeId === "object") {
            storeId = storeId._id || storeId.id || storeId;
          }

          try {
            const storeResponse = await api.get(`/store/${storeId}`);
            if (
              storeResponse.data.success &&
              storeResponse.data.data.storeSlug
            ) {
              const storeData = storeResponse.data.data;
              setUserStore(storeData);

              if (
                storeData.subscriptionStatus === "inactive" ||
                storeData.subscriptionStatus === "cancelled" ||
                !storeData.isActive
              ) {
                localStorage.setItem('pendingStoreSlug', storeData.storeSlug);
                setTimeout(() => {
                  router.push("/plans");
                }, 100);
                toast.info("Your store is inactive. Please purchase a plan.");
                return { success: true, message: "Login successful" };
              }

              console.log("🚀 Redirecting to Store Dashboard:", storeData.storeSlug);
              setTimeout(() => {
                router.push(`/store/${storeData.storeSlug}/general`);
              }, 100);
              return { success: true, message: "Login successful" };
            }
          } catch (error) {
            console.error("Failed to fetch store data:", error);
          }
        }

        // 3. Fallback Navigation
        setTimeout(() => {
          if (userRole === "manager" && userData.storeSlug) {
            router.push(`/manager/${userData.storeSlug}/home`);
          } else {
            console.log("🚀 No store found, redirecting to plans");
            router.push("/plans");
          }
        }, 100);

        return { success: true, message: "Login successful" };
      } else {
        return {
          success: false,
          message: response.data.message || "Login failed",
        };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const message = error.response?.data?.message || "Login failed";
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const switchActiveStore = (store: any) => {
    setUserStore(store);
    // Use a more specific key to avoid conflicts with other contexts
    localStorage.setItem("kx_active_store", JSON.stringify(store));
    // Also update the store context if it exists
    if (typeof window !== "undefined") {
      localStorage.setItem("admin.storeSlug", store.storeSlug);
      localStorage.setItem("admin.storeId", store._id);
    }
  };

  const logout = () => {
    try {
      // Clear auth state
      clearAuthToken();
      localStorage.removeItem("kx_profile");
      dispatch(clearCredentials());
      setUser(null);
      setUserStore(null);

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    hasStore,
    userStore,
    switchActiveStore,
  };

  // Show loading while authentication is being initialized
  if (isLoading) {
    return <Loader />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
