
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { openRazorpayCheckout, loadRazorpaySdk } from "../../lib/razorpay";
import Header from "../../components/ui/Header";
import {
  createRzpOrder,
  PublicSubscriptionPlans,
  verifyRzpPayment,
} from "../../lib/api";
import { toast } from "react-toastify";

// export const metadata = {
//   title: "Plans – StoreCraft",
//   description: "Choose the perfect plan for your StoreCraft store. Monthly or yearly plans available.",
//   keywords: "ecommerce, online store, plans, store builder, shop, StoreCraft",
//   openGraph: {
//     type: "website",
//     title: "Plans – StoreCraft",
//     description: "Choose the perfect plan for your StoreCraft store. Monthly or yearly plans available."
//   },
//   alternates: {
//     canonical: process.env.NEXT_PUBLIC_PLATFORM_URL + "/plans"
//   }
// };
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [pendingStoreSlug, setPendingStoreSlug] = useState<string | null>(null);
  const [pendingStoreId, setPendingStoreId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    PublicSubscriptionPlans.list({
      limit: 12,
      sort: JSON.stringify({ priceMonthly: 1 }),
    })
      .then((res) => {
        const items = Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.data)
            ? res.data
            : res;
        setPlans(Array.isArray(items) ? items : []);
      })
      .catch((err) => {
        console.error("Failed to fetch plans:", err);
        // Fallback for development if API is unreachable
        setPlans([
          { _id: 'starter', name: 'Starter', priceMonthly: 499, priceYearly: 4990, features: ['Up to 100 Products', 'Email Support'] },
          { _id: 'growth', name: 'Growth', priceMonthly: 999, priceYearly: 9990, features: ['Unlimited Products', 'Priority Support'] },
        ]);
        toast.error("Using offline mode: Could not reach the server.");
      })
      .finally(() => setLoading(false));

    // Check for pending store (inactive store trying to reactivate)
    const pendingSlug = localStorage.getItem("pendingStoreSlug");
    if (pendingSlug) {
      setPendingStoreSlug(pendingSlug);

      // Fetch the actual store ID for the slug
      const fetchStoreId = async () => {
        try {
          const { Store } = await import("../../lib/api");
          const storeRes = await Store.getBySlug(pendingSlug);
          if (storeRes?.data?._id) {
            setPendingStoreId(storeRes.data._id);
          }
        } catch (error) {
          console.error("Failed to fetch store ID:", error);
        }
      };

      fetchStoreId();
    }
  }, []);

  useEffect(() => {
    try {
      const t =
        typeof window !== "undefined" ? localStorage.getItem("kx_token") : null;
      setIsAuthed(!!t);

      // Load Razorpay SDK when component mounts
      if (typeof window !== "undefined") {
        loadRazorpaySdk().catch((err) => {
          console.error("Failed to load Razorpay SDK:", err);
        });
      }
    } catch { }
  }, []);

  const orderedPlans = useMemo(() => {
    const copy = [...plans];
    copy.sort(
      (a, b) => Number(a.priceMonthly || 0) - Number(b.priceMonthly || 0)
    );
    return copy;
  }, [plans]);

  const pay = async (plan: any) => {
    try {
      setLoading(true);

      // IMPORTANT: Require login before payment
      if (!isAuthed) {
        toast.info("Please login or register to continue with payment");
        // Store selected plan in localStorage so we can resume after login
        localStorage.setItem("kx_selected_plan", JSON.stringify({
          planId: plan._id || plan.id,
          planName: plan.name,
          cycle: cycle
        }));
        setTimeout(() => {
          window.location.href = `/login?redirect=/plans`;
        }, 500);
        setLoading(false);
        return;
      }

      // Validate Razorpay SDK
      if (!window.Razorpay) {
        toast.error("Payment system not ready. Please refresh the page.");
        setLoading(false);
        return;
      }

      // Calculate amount
      const amount = Number(
        cycle === "yearly" ? plan.priceYearly || 0 : plan.priceMonthly || 0
      );

      // Handle Free/Trial plans
      if (amount === 0) {
        toast.success("Activating your trial...");
        setTimeout(() => {
          window.location.href = `/onboarding?plan=${encodeURIComponent(
            String(plan._id || plan.id)
          )}&type=trial`;
        }, 1000);
        return;
      }

      if (!amount || amount <= 0) {
        toast.error("Invalid plan price. Please select a valid plan.");
        return;
      }

      // Show loading state
      toast.info("Preparing payment...");

      const response = await createRzpOrder({
        planName: plan.name,
        amount,
        currency: "INR",
      });

      const { order } = response;
      if (!order || !order.id) {
        console.error("Invalid order response:", response);
        toast.error("Failed to create payment order. Please try again.");
        return;
      }

      toast.success("Payment ready! Opening payment gateway...");

      // Open Razorpay checkout
      await openRazorpayCheckout({
        order,
        planName: plan.name,
        onSuccess: async (response: any) => {
          try {
            // Verify payment with backend
            toast.info("Verifying payment...");

            const verification = await verifyRzpPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan._id,
              planName: plan.name,
              amount: order.amount,
              currency: order.currency,
              storeId: pendingStoreId || undefined, // Use actual store ID, not slug
              storeSlug: pendingStoreSlug || undefined,
            });

            if (!verification.success) {
              throw new Error("Payment verification failed");
            }

            // Store payment info locally
            if (typeof window !== "undefined") {
              localStorage.setItem("kx_paid", "1");
              localStorage.setItem("kx_plan", String(plan.slug || plan._id));
              localStorage.setItem("kx_billing_cycle", cycle);
              localStorage.setItem("kx_order_id", order.id);
              localStorage.setItem(
                "kx_payment_id",
                response.razorpay_payment_id
              );
              localStorage.setItem(
                "kx_payment_signature",
                response.razorpay_signature
              );
            }

            // Check if this is a store reactivation
            if (pendingStoreSlug) {
              // Store reactivation - clear pending and redirect to store
              localStorage.removeItem("pendingStoreSlug");
              toast.success(
                "Payment successful! Your store has been reactivated."
              );
              setTimeout(() => {
                window.location.href = `/store/${pendingStoreSlug}/general`;
              }, 2000);
              return;
            }

            // New store creation flow
            if (verification.user) {
              // Update localStorage with new user data
              localStorage.setItem(
                "kx_profile",
                JSON.stringify(verification.user)
              );

              // Redirect to onboarding instead of reloading
              setTimeout(() => {
                window.location.href = `/onboarding?plan=${encodeURIComponent(
                  String(plan._id)
                )}&payment_id=${response.razorpay_payment_id}`;
              }, 1000);
              return;
            }

            toast.success("Payment verified! Create your store...");

            // Redirect to onboarding after a delay
            setTimeout(() => {
              window.location.href = `/onboarding?plan=${encodeURIComponent(
                String(plan._id)
              )}`;
            }, 1500);
          } catch (e: any) {
            console.error("Payment success handler error:", e);
            toast.error(
              "Payment verification failed: " + (e?.message || "Unknown error")
            );
          }
        },
        onError: (error: any) => {
          console.error("Payment error:", error);
          let errorMessage = "Payment failed. Please try again.";

          if (error.type === "payment_failed") {
            errorMessage =
              error.message ||
              "Payment was declined. Please try a different payment method.";
          } else if (error.type === "checkout_error") {
            errorMessage = "Failed to open payment gateway. Please try again.";
          }

          toast.error(errorMessage);
        },
        onDismiss: () => {
          toast.info("Payment cancelled. You can try again anytime.");
        },
      });
    } catch (e: any) {
      console.error("Payment error:", e);
      const errorMsg =
        e?.response?.data?.message ||
        e?.message ||
        "Payment failed. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col bg-white">
        <main className="flex-1">
          <div className="max-w-6xl mx-auto p-6 md:p-10">
            {pendingStoreSlug && (
              <div className="mb-6 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3">
                <p className="font-semibold">⚠️ Store Reactivation</p>
                <p className="text-sm mt-1">
                  You are reactivating your store "{pendingStoreSlug}". The plan
                  you purchase will be applied to this store.
                </p>
              </div>
            )}
            <div className="mb-6 rounded-md bg-sky-50 border border-sky-200 text-sky-800 px-4 py-2 text-sm">
              Prices shown in INR (₹). Exchange rate used is approximate. Taxes
              may apply.
            </div>
            <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">
              Choose Your Plan
            </h1>
            <p className="text-center text-slate-600 mb-8">
              Select the plan that best fits your needs. All plans include
              access to our platform features.
            </p>
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setCycle("monthly")}
                  className={`px-4 py-2 text-sm ${cycle === "monthly"
                    ? "bg-primary text-white"
                    : "bg-white text-slate-700"
                    }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setCycle("yearly")}
                  className={`px-4 py-2 text-sm ${cycle === "yearly"
                    ? "bg-primary text-white"
                    : "bg-white text-slate-700"
                    }`}
                >
                  Yearly
                </button>
              </div>
            </div>

            {!isAuthed && (
              <div className="mb-8 rounded-xl bg-white border border-slate-200 shadow-sm p-5 flex items-center justify-between">
                <div className="text-slate-700">
                  Login or Sign Up for full access.
                </div>
                <div className="space-x-3">
                  <a
                    href="/login"
                    className="px-4 py-2 rounded-md border border-primary text-primary hover:bg-primary/10 text-sm"
                  >
                    Login
                  </a>
                  <a
                    href="/register"
                    className="px-4 py-2 rounded-md bg-primary text-white text-sm"
                  >
                    Sign Up
                  </a>
                </div>
              </div>
            )}
            {loading ? (
              <div className="p-8 text-center text-slate-600">Loading...</div>
            ) : orderedPlans.length === 0 ? (
              <div className="p-8 text-center text-slate-600">
                No plans available.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {orderedPlans.map((p) => {
                  const name = String(p.name || "").toLowerCase();
                  const isGold = name.includes("gold");
                  const isSilver = name.includes("silver");
                  const isTrial = name.includes("trial");
                  const accent = isGold
                    ? "ring-2 ring-amber-300 bg-amber-50"
                    : isSilver
                      ? "ring-2 ring-slate-200 bg-slate-50"
                      : isTrial
                        ? "ring-2 ring-sky-200 bg-sky-50"
                        : "bg-white";
                  const monthly = Number(p.priceMonthly || 0);
                  const yearly = Number(p.priceYearly || 0);
                  const displayPrice = cycle === "yearly" ? yearly : monthly;
                  const otherPrice = cycle === "yearly" ? monthly : yearly;
                  const gst = Math.round(displayPrice * 0.18);
                  const totalPrice = displayPrice + gst;
                  const format = (n: number) =>
                    new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    }).format(Math.round(n || 0));
                  return (
                    <div
                      key={p._id}
                      className={`border border-slate-200 rounded-xl ${accent} shadow-sm p-6 flex flex-col`}
                    >
                      <div className="text-center mb-2">
                        <div className="text-sm uppercase tracking-wide text-slate-500">
                          {isGold
                            ? "GOLD"
                            : isSilver
                              ? "SILVER"
                              : isTrial
                                ? "TRIAL"
                                : p.name}
                        </div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">
                          {format(displayPrice)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {cycle === "yearly"
                            ? "per year"
                            : `${format(otherPrice)} / Year`}
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 bg-white/60 rounded-md border border-slate-200 px-3 py-2 mb-3">
                        {format(displayPrice)} + 18% GST ={" "}
                        <span className="font-semibold">
                          {format(totalPrice)}
                        </span>
                      </div>
                      <ul className="mt-2 text-sm text-slate-700 space-y-1 mb-4">
                        {(p.features || []).map((f: string, i: number) => (
                          <li key={i} className="flex items-center">
                            <span className="text-emerald-600 mr-2">●</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        className={`mt-auto w-full px-4 py-2 rounded-md text-white ${isGold
                          ? "bg-amber-500 hover:bg-amber-600"
                          : isSilver
                            ? "bg-slate-700 hover:bg-slate-800"
                            : "bg-sky-600 hover:bg-sky-700"
                          }`}
                        onClick={() => pay(p)}
                      >
                        {isTrial
                          ? "Choose TRIAL"
                          : isSilver
                            ? "Choose SILVER"
                            : isGold
                              ? "Choose GOLD"
                              : "Select"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
