"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";
import Loader from "../Loader";
import { api } from "../../lib/api";

interface StoreGuardProps {
  children: React.ReactNode;
}

export default function StoreGuard({ children }: StoreGuardProps) {
  const router = useRouter();
  const params = useParams();
  const { user, userStore, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkStoreAccess = async () => {
      try {
        setIsChecking(true);

        // Wait for auth to load
        if (isLoading) {
          return;
        }

        // Check if user is authenticated
        if (!user) {
          toast.error("Please login to access this page");
          router.push("/login");
          return;
        }

        // Get store slug from URL
        const storeSlug = params.store as string;
        if (!storeSlug) {
          toast.error("Invalid store URL");
          router.push("/");
          return;
        }

        // Get current pathname to check if it's the plans page
        const currentPath = window.location.pathname;
        const isPlansPage = currentPath.includes("/plans");

        // Check if user is admin (admins can access any store)
        const role = user?.role?.toLowerCase()?.trim();
        const isAdmin = role === "admin" || role === "super_admin" || role === "superadmin";

        if (isAdmin) {
          setIsAuthorized(true);
          setIsChecking(false);
          return;
        }

        // Check if user is merchant and owns this store
        if (user.role === "merchant") {
          // Check if user has access to the requested store
          try {
            // Get all user stores to check if they own the requested store
            const storesResponse = await api.get("/store");
            if (
              storesResponse.data.success &&
              storesResponse.data.data.length > 0
            ) {
              const userStores = storesResponse.data.data;
              const requestedStore = userStores.find(
                (store) => store.storeSlug === storeSlug
              );

              if (requestedStore) {
                // Check if store is inactive or cancelled - LOCK ACCESS
                if (
                  requestedStore.subscriptionStatus === "inactive" ||
                  requestedStore.subscriptionStatus === "cancelled" ||
                  !requestedStore.isActive
                ) {
                  // Store is inactive - REDIRECT TO MAIN PLANS PAGE
                  toast.info(
                    "Your store is inactive. Please purchase a plan to reactivate it."
                  );
                  // Store the inactive store slug for context
                  localStorage.setItem('pendingStoreSlug', storeSlug);
                  router.push("/plans");
                  return;
                }

                // Store is active, allow access to any page
                setIsAuthorized(true);
                setIsChecking(false);
                return;
              } else {
                // User doesn't own this store, redirect to their first store
                toast.error(
                  "Access denied. You can only access your own stores."
                );
                router.push(`/store/${userStores[0].storeSlug}/general`);
                return;
              }
            } else {
              // If we get here, user has no stores
              toast.error("No store found for your account");
              router.push("/onboarding");
              return;
            }
          } catch (error) {
            console.error("Failed to fetch user stores:", error);
            toast.error("No store found for your account");
            router.push("/onboarding");
            return;
          }
        }

        // User is not admin or merchant, deny access
        toast.error("Access denied. Merchant privileges required.");
        router.push("/plans");
      } catch (error) {
        console.error("Store guard error:", error);
        toast.error("An error occurred checking store access");
        router.push("/login");
      } finally {
        setIsChecking(false);
      }
    };

    checkStoreAccess();
  }, [user, userStore, isLoading, params.store, router]);

  if (isLoading || isChecking) {
    return <Loader />;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
