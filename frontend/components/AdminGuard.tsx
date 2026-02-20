"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem("kx_token");
        if (!token) {
          toast.error("Please login to access this page");
          router.push("/login");
          return;
        }

        // Check user role
        const profile = localStorage.getItem("kx_profile");
        if (!profile) {
          toast.error("User profile not found");
          router.push("/login");
          return;
        }

        const userProfile = JSON.parse(profile);
        const rawRole = userProfile?.role || "user";
        const userRole = rawRole.toLowerCase().trim();
        const isAdmin = userRole === "admin" || userRole === "super_admin" || userRole === "superadmin";

        // Check if user is admin
        if (!isAdmin) {
          console.warn(`🛑 AdminGuard: Access denied for role "${rawRole}"`);
          toast.error("Access denied. Admin privileges required.");

          // Redirect based on role
          if (userRole === "merchant") {
            // Try to redirect to merchant dashboard
            const storeId = userProfile?.storeId;
            if (storeId) {
              router.push(`/manager/${storeId}/home`);
            } else {
              router.push("/plans");
            }
          } else {
            // Regular user or user without role -> send to plans
            router.push("/plans");
          }
          return;
        }

        // User is admin, allow access
        setIsAuthorized(true);
      } catch (error) {
        console.error("Admin guard error:", error);
        toast.error("An error occurred checking permissions");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
