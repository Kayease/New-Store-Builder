"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoreBySlug } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import Loader from "../../components/Loader";
import { api } from "../../lib/api";
import { toast } from "react-toastify";

export default function OnboardingPage() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    hasStore,
    refreshUser,
    switchActiveStore,
  } = useAuth();
  const [form, setForm] = useState({ storeName: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Check onboarding status
  const checkOnboardingStatus = async () => {
    try {
      const response = await api.get("/onboarding/status");

      setOnboardingStatus(response.data.data);
    } catch (error) {
      console.error("❌ Failed to get onboarding status:", error);
    }
  };

  // Get plan from URL if provided (after payment)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const planParam = params.get("plan");
      const paymentId = params.get("payment_id");
      
      if (planParam) {
        setSelectedPlanId(planParam);
      }
    }
  }, []);

  // Refresh user data on mount (especially after payment)
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshUser();
      checkOnboardingStatus();
    }
  }, [isAuthenticated]); // Remove refreshUser from dependencies to prevent infinite loop

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Note: We removed the redirect that prevented merchants with existing stores
  // from accessing the onboarding page. This allows them to create additional stores.

  // Pre-fill form with user data
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        email: user.email || f.email,
        phone: user.phone || f.phone,
      }));
    }
  }, [user]);

  // Check slug availability when store name changes
  useEffect(() => {
    const checkSlugAvailability = async () => {
      if (!form.storeName) {
        setSlugAvailable(null);
        return;
      }

      const slug = form.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      if (slug.length < 3) {
        setSlugAvailable(null);
        return;
      }

      setCheckingSlug(true);
      try {
        const response = await getStoreBySlug(slug);
        // If response.data.available is true, slug is available
        setSlugAvailable(response.data?.available || false);
      } catch (error) {
        console.error("Error checking slug:", error);
        setSlugAvailable(null);
      } finally {
        setCheckingSlug(false);
      }
    };

    const timer = setTimeout(checkSlugAvailability, 500);
    return () => clearTimeout(timer);
  }, [form.storeName]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.storeName) {
      alert("Please enter a store name");
      return;
    }

    if (slugAvailable === false) {
      alert("Store name already taken. Please choose another.");
      return;
    }

    setSaving(true);
    try {
      const slug = form.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      // Create the store using onboarding API
      const storePayload: any = {
        storeName: form.storeName,
        storeSlug: slug,
        email: form.email,
        phone: form.phone,
      };

      // Include planId if available (after payment)
      if (selectedPlanId) {
        storePayload.planId = selectedPlanId;
      }

      const response = await api.post("/onboarding/create-store", storePayload);

      // Complete onboarding
      try {
        await api.post("/onboarding/complete");
      } catch (completeError) {
        console.error("⚠️ Failed to complete onboarding:", completeError);
        // Continue anyway
      }

      // Get the created store data
      const createdStore = response.data.data;
      
      // Set the newly created store as active
      if (createdStore) {
        switchActiveStore(createdStore);
      }

      // Refresh user data to get updated store info
      await refreshUser();

      toast.success(
        "🎉 Store created successfully! Redirecting to your store dashboard..."
      );

      // Clear localStorage payment flags after store creation
      if (typeof window !== "undefined") {
        localStorage.removeItem("kx_paid");
        localStorage.removeItem("kx_plan");
        localStorage.removeItem("kx_billing_cycle");
        localStorage.removeItem("kx_order_id");
        localStorage.removeItem("kx_payment_id");
        localStorage.removeItem("kx_payment_signature");
      }

      // Redirect to store dashboard with a small delay to ensure data is updated
      setTimeout(() => {
        router.push(`/store/${slug}/general`);
      }, 1000);
    } catch (error: any) {
      console.error("❌ Error creating store:", error);
      const errorMessage =
        error?.response?.data?.message || error?.message || "Unknown error";
      toast.error(`Failed to create store: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Show loader while checking authentication
  if (authLoading) {
    return <Loader />;
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Determine if user already has stores
  const userHasStores = hasStore;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create Your Store
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Fill in the details below to set up your online store
          {userHasStores && (
            <span className="block mt-1 text-xs text-primary">
              You can create multiple stores with different subscription plans.
            </span>
          )}
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              htmlFor="storeName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Store Name *
            </label>
            <input
              id="storeName"
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              placeholder="My Awesome Store"
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            {checkingSlug && (
              <p className="text-xs text-gray-500 mt-1">
                Checking availability...
              </p>
            )}
            {slugAvailable === true && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Store name is available
              </p>
            )}
            {slugAvailable === false && (
              <p className="text-xs text-red-600 mt-1">
                ✗ Store name is already taken
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="owner@example.com"
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 rounded-md bg-primary text-white font-semibold hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving || slugAvailable === false || checkingSlug}
          >
            {saving ? "Creating Store..." : "Create Store"}
          </button>

          {saving && (
            <div className="text-center text-sm text-gray-500 mt-2">
              Please wait while we create your store...
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
