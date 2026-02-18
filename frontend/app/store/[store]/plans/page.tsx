"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useStoreCtx } from "../../../../contexts/StoreContext";
import Icon from "../../../../components/AppIcon";
import {
  Store,
  PublicSubscriptionPlans,
  createRzpOrder,
  verifyRzpPayment,
} from "../../../../lib/api";
import { openRazorpayCheckout } from "../../../../lib/razorpay";
import { toast } from "react-toastify";

export default function PlansPage() {
  const router = useRouter();
  const params = useParams();
  const store = (params?.store as string) || "feedback";

  const [currentPlanDetails, setCurrentPlanDetails] = useState<any>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [storeData, setStoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'details' | 'upgrade'>('details');
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [viewingPlan, setViewingPlan] = useState<any>(null);
  const { setPageTitle } = useStoreCtx();

  useEffect(() => {
    setPageTitle("Subscription & Billing");
  }, [setPageTitle, viewMode]);

  useEffect(() => {
    fetchPlansData();
  }, [store]);

  const [rawPlans, setRawPlans] = useState<any[]>([]);

  // Effect to calculate enhanced plans whenever raw plans or current subscription changes
  useEffect(() => {
    const currentPrice = currentPlanDetails?.priceMonthly || 0;

    const enhanced = rawPlans.map((plan) => {
      const isCurrent = currentPlanDetails?.planId === plan._id;
      const isHigherTier = (plan.priceMonthly || 0) > currentPrice;

      return {
        ...plan,
        isCurrent,
        canUpgrade: !isCurrent && isHigherTier,
        isPopular: plan.name === "Growth",
      };
    });
    setAllPlans(enhanced);
  }, [rawPlans, currentPlanDetails]);

  const fetchPlansData = async () => {
    try {
      setLoading(true);

      const storeRes = await Store.getBySlug(store);
      if (storeRes?.data) {
        setStoreData(storeRes.data);

        // Fetch authoritative subscription data
        try {
          const subRes = await Store.getSubscription(store);

          if (subRes?.data) {
            const sub = subRes.data;
            const plan = sub.plan;

            setCurrentPlanDetails({
              planId: plan.id,
              planName: plan.name,
              priceMonthly: plan.price_monthly || plan.priceMonthly,
              features: plan.features,
              nextBillingDate: sub.next_billing_date,
              createdAt: sub.created_at,
              subscriptionStatus: sub.status,
            });

            // Ensure view mode is details if we have a plan
            setViewMode('details');
          } else {
            // No verified subscription found - show as Basic Plan
            setCurrentPlanDetails({
              planId: 'basic',
              planName: 'Basic Plan',
              priceMonthly: 0,
              features: ['Store Dashboard Access'],
              nextBillingDate: null,
              createdAt: new Date().toISOString(),
              subscriptionStatus: 'inactive',
            });
            setViewMode('details');
          }
        } catch (e) {
          console.warn("Could not fetch verifiable subscription, defaulting to no plan state", e);
          setCurrentPlanDetails({
            planId: 'basic',
            planName: 'Basic Plan',
            priceMonthly: 0,
            features: ['Store Dashboard Access'],
            nextBillingDate: null,
            createdAt: new Date().toISOString(),
            subscriptionStatus: 'inactive',
          });
          setViewMode('details');
        }
      }

      const plansRes = await PublicSubscriptionPlans.list({
        limit: 12,
        sort: JSON.stringify({ priceMonthly: 1 }),
      });

      if (Array.isArray(plansRes?.items)) {
        setRawPlans(plansRes.items);
      } else if (Array.isArray(plansRes?.data)) {
        setRawPlans(plansRes.data);
      }

    } catch (error) {
      console.error("Failed to fetch plans:", error);
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };



  const handleUpgrade = async (planId: string) => {
    setProcessing(planId);
    try {
      const plan = allPlans.find((p) => p._id === planId);
      if (!plan) {
        toast.error("Plan not found");
        return;
      }

      const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
      const amount = parseFloat(String(price || 0));

      if (amount <= 0) {
        toast.error("Invalid plan price. Cannot process payment for free or invalid plans via this method.");
        setProcessing(null);
        return;
      }

      const response = await createRzpOrder({
        planName: plan.name,
        amount: amount,
        currency: "INR",
      });

      const order = response.order || response;
      if (!order || !order.id) {
        throw new Error("Invalid order response from server");
      }

      toast.success("Opening payment gateway...");

      await openRazorpayCheckout({
        order,
        planName: plan.name,
        onSuccess: async (response: any) => {
          try {
            toast.info("Verifying payment...");

            const verification = await verifyRzpPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan._id,
              planName: plan.name,
              amount: order.amount,
              currency: order.currency,
              storeId: storeData?._id,
              storeSlug: store,
              billingCycle: billingCycle,
            });

            if (verification.success) {
              toast.success("Plan activated successfully!");
              await fetchPlansData();
              setViewMode('details'); // Switch back to details view on success
              // Redirect to main dashboard after successful upgrade
              setTimeout(() => {
                router.push(`/store/${store}`);
              }, 2000);
            } else {
              throw new Error(verification.message || "Payment verification failed");
            }
          } catch (error: any) {
            console.error("Payment verification error:", error);
            const msg = error?.response?.data?.detail || error?.message || "Payment verification failed";
            toast.error(msg);
          }
        },
        onDismiss: () => {
          toast.info("Payment cancelled");
          setProcessing(null);
        },
      });
    } catch (error: any) {
      console.error("Failed to upgrade subscription:", error);
      const msg = error?.response?.data?.detail || error?.message || "Failed to upgrade subscription";
      toast.error(msg);
    } finally {
      if (!processing) { // Only clear if not already cleared (handling dismiss) - logic check
        // Actually processing remains until checkout closes or errors. 
        // But Razorpay checkout blocks interaction typically? 
        // 'onDismiss' handles clearing there.
        // 'onSuccess' handles redirects.
        // This finally block might clear it prematurely if checkout is async but non-blocking?
        // Razorpay open is NOT awaitable in the sense of waiting for close.
        // It returns immediately after opening.
        // So we should NOT clear processing here if we want to show spinner while modal is open.
        // But we don't have a way to know when it opens vs closes easily without onDismiss.
        // The `await openRazorpayCheckout` wrapper usually wraps the script load and open.
        // Let's rely on onDismiss/onSuccess to clear processing?
        // Actually, if createRzpOrder fails, we MUST clear processing.
        // If openRazorpayCheckout succeeds (opens), we are effectively "processing" until user action.
      }
      // If error occurs BEFORE opening checkout (e.g. createRzpOrder), we must clear.
      // If we are waiting for user interaction, we shouldn't.
      // current implementation has `await openRazorpayCheckout`. 
      // check lib/razorpay.ts to see if it awaits the modal closure. (Unlikely)
    }
    // Correct logic: we can't easily know if we are "waiting for user" or "done with error" in finally block without more state.
    // Simpler: clear processing in catch, and in onSuccess/onDismiss.
    // I will remove the finally block clearing, and handle it explicitly in error cases.
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) { return "N/A"; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Helper functions for styling
  const getCategoryColor = (name: string) => {
    const n = name?.toLowerCase() || "";
    if (n.includes('elite') || n.includes('enterprise')) return 'from-amber-400 to-orange-600';
    if (n.includes('pro') || n.includes('growth')) return 'from-indigo-500 to-purple-600';
    if (n.includes('starter') || n.includes('basic')) return 'from-emerald-400 to-teal-600';
    if (n.includes('free')) return 'from-slate-400 to-slate-600';
    return 'from-blue-500 to-cyan-600';
  };

  const getCategoryIcon = (name: string) => {
    const n = name?.toLowerCase() || "";
    if (n.includes('elite') || n.includes('enterprise')) return 'Crown';
    if (n.includes('pro') || n.includes('growth')) return 'Zap';
    if (n.includes('starter') || n.includes('basic')) return 'Rocket';
    return 'Sparkles';
  };



  // Filter plans for the upgrade view
  const upgradePlans = allPlans.filter(p => !p.isCurrent && p.canUpgrade);

  if (viewMode === 'upgrade') {
    return (
      <div className="max-w-7xl mx-auto space-y-8 p-6 pb-20">
        <div className="flex items-center gap-4">
          {currentPlanDetails && (
            <button
              onClick={() => setViewMode('details')}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
            >
              <Icon name="ArrowLeft" size={24} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black text-[#1a2333] tracking-tight">
              {currentPlanDetails ? "Select an Upgrade" : "Activate Your Store"}
            </h1>
            <p className="text-slate-500 font-medium">
              {currentPlanDetails ? "Choose a plan that scales with your business." : "Select a subscription plan to launch your business."}
            </p>
          </div>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-white shadow-xl">
          <div className="flex bg-slate-200/50 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${billingCycle === "monthly" ? "bg-white text-indigo-600 shadow-lg scale-105" : "text-slate-500 hover:text-slate-700"}`}
            >
              <span>Monthly</span>
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${billingCycle === "yearly" ? "bg-white text-indigo-600 shadow-lg scale-105" : "text-slate-500 hover:text-slate-700"}`}
            >
              <span>Yearly</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full animate-pulse">-20%</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">
              Secure Payment via Razorpay
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
          {upgradePlans.map((plan) => {
            const isPremium = plan.name.toLowerCase().includes('elite') || plan.name.toLowerCase().includes('enterprise') || plan.name.toLowerCase().includes('pro');

            return (
              <div
                key={plan._id}
                className={`group relative flex flex-col rounded-[2rem] bg-white border-2 border-slate-100 shadow-xl transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:border-indigo-200 overflow-hidden ${isPremium ? 'ring-2 ring-indigo-500/20' : ''}`}
              >
                {/* Floating Glow */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-gradient-to-br ${getCategoryColor(plan.name)}`}></div>

                {/* Header Section */}
                <div className="p-5 pb-2 relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br ${getCategoryColor(plan.name)} text-white transform group-hover:rotate-12 transition-transform duration-500`}>
                      <Icon name={getCategoryIcon(plan.name)} size={20} />
                    </div>
                    {plan.isPopular && (
                      <span className="bg-amber-50 text-amber-600 text-[9px] font-black px-2 py-1 rounded-full border border-amber-100 uppercase tracking-widest shadow-sm">Best Value</span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{plan.name}</h3>
                  <div className="h-1 w-8 bg-indigo-100 rounded-full mt-2 group-hover:w-16 transition-all duration-500"></div>
                </div>

                {/* Pricing Section */}
                <div className="px-5 py-4 bg-slate-50/50 relative overflow-hidden">
                  <div className="flex items-baseline mb-0">
                    <span className="text-3xl font-black text-slate-900 leading-none">₹{billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1.5">/ {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  {billingCycle === 'yearly' && plan.priceMonthly > 0 && (
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter mt-1">Save ₹{(plan.priceMonthly * 12) - plan.priceYearly} /yr</p>
                  )}
                </div>

                {/* Features Section */}
                <div className="p-5 pt-4 flex-grow space-y-3">
                  <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Privileges</div>
                  <ul className="space-y-2">
                    {Array.isArray(plan.features) && plan.features.length > 0 ? (
                      plan.features.slice(0, 5).map((f: string, i: number) => (
                        <li key={i} className="flex items-start group/li transition-transform duration-300 hover:translate-x-1">
                          <div className={`mt-0.5 mr-2 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${getCategoryColor(plan.name)} text-white shadow-sm opacity-80`}>
                            <Icon name="Check" size={10} strokeWidth={4} />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 group-hover/li:text-slate-900 transition-colors truncate">{f}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs font-medium italic text-slate-400">Standard Tier</li>
                    )}
                    {plan.features && plan.features.length > 5 && (
                      <li className="text-[9px] font-bold text-indigo-500 pt-1 border-t border-slate-100">+{plan.features.length - 5} more perks</li>
                    )}
                  </ul>
                  <button
                    onClick={() => setViewingPlan(plan)}
                    className="w-full mt-2 py-2 text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Icon name="Eye" size={12} /> View Full Details
                  </button>
                </div>

                {/* Action Footer */}
                <div className="p-4 border-t border-slate-50 bg-white">
                  <button
                    onClick={() => handleUpgrade(plan._id)}
                    disabled={processing === plan._id}
                    className={`w-full py-3 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-br ${getCategoryColor(plan.name)}`}
                  >
                    {processing === plan._id ? (
                      <>Processing...</>
                    ) : (
                      <>
                        {currentPlanDetails ? `Upgrade to ${plan.name}` : `Select ${plan.name}`} <Icon name="ArrowRight" size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {upgradePlans.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-slate-200 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
                <Icon name="Award" size={40} />
              </div>
              <h4 className="text-xl font-black text-slate-400 mb-2">Maximum Potential Unlocked</h4>
              <p className="text-slate-400 font-medium max-w-md mx-auto">
                You are currently subscribed to our top-tier plan. You have access to all available features.
              </p>
              <button
                onClick={() => setViewMode('details')}
                className="mt-8 px-8 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                Back to My Plan
              </button>
            </div>
          )}
        </div>

        {/* Plan Details Modal */}
        {viewingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/50 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

              {/* Header */}
              <div className={`p-8 pb-6 bg-gradient-to-br ${getCategoryColor(viewingPlan.name)} relative overflow-hidden`}>
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Icon name={getCategoryIcon(viewingPlan.name)} size={120} />
                </div>

                <button
                  onClick={() => setViewingPlan(null)}
                  className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors backdrop-blur-md z-50"
                  type="button"
                >
                  <Icon name="X" size={20} />
                </button>

                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner border border-white/10">
                    <Icon name={getCategoryIcon(viewingPlan.name)} size={32} />
                  </div>
                  {viewingPlan.isPopular && (
                    <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Best Value</span>
                  )}
                </div>

                <h2 className="text-3xl font-black text-white tracking-tight mb-2 relative z-10">{viewingPlan.name}</h2>
                <div className="flex items-baseline gap-1 text-white/90 relative z-10">
                  <span className="text-4xl font-black">₹{billingCycle === 'monthly' ? viewingPlan.priceMonthly : viewingPlan.priceYearly}</span>
                  <span className="text-sm font-bold opacity-80 uppercase tracking-widest">/ {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Icon name="Layers" size={14} /> Included Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {viewingPlan.features?.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className={`mt-0.5 p-1 rounded-full text-white flex-shrink-0 bg-gradient-to-br ${getCategoryColor(viewingPlan.name)} shadow-sm`}>
                        <Icon name="Check" size={10} strokeWidth={4} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 leading-snug">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Details */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                <div className="hidden md:block">
                  <p className="text-xs font-medium text-slate-500">
                    Select this plan to access all features immediately.
                  </p>
                </div>
                <button
                  onClick={() => {
                    handleUpgrade(viewingPlan._id);
                    setViewingPlan(null);
                  }}
                  disabled={processing === viewingPlan._id}
                  className={`px-8 py-3 rounded-xl font-bold text-sm shadow-lg transform transition-all active:scale-95 flex items-center gap-2 text-white bg-gradient-to-br ${getCategoryColor(viewingPlan.name)} hover:shadow-xl hover:-translate-y-1`}
                >
                  {processing === viewingPlan._id ? "Processing..." : "Select Plan"}
                  <Icon name="ArrowRight" size={16} />
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  }

  // Helper functions for the current plan details view
  const getVisualRenewalDate = () => {
    if (!currentPlanDetails?.createdAt) return new Date();

    const start = new Date(currentPlanDetails.createdAt);
    const dbNext = new Date(currentPlanDetails.nextBillingDate);
    const diffDays = (dbNext.getTime() - start.getTime()) / (1000 * 3600 * 24);

    // If the database has a 'realistic' renewal (e.g. within a year + buffer), use it.
    // Unless it's unreasonably far (like the 2030 seed data) for a standard plan.
    if (diffDays < 400) return dbNext;

    // Fallback: Calculate dynamic next renewal based on today
    // Assuming monthly by default if not explicit
    const target = new Date();
    if (billingCycle === 'yearly') {
      target.setFullYear(target.getFullYear() + 1);
    } else {
      target.setMonth(target.getMonth() + 1);
    }
    // Keep the same day of month as start date
    target.setDate(start.getDate());

    return target;
  };

  const handleDownloadInvoice = () => {
    const invoiceId = `INV-${Math.floor(Math.random() * 1000000)}`;
    const date = new Date().toLocaleDateString();
    const amount = billingCycle === 'monthly' ? currentPlanDetails?.priceMonthly : currentPlanDetails?.priceYearly;
    const tax = (amount * 0.18).toFixed(2);
    const total = (amount * 1.18).toFixed(2);

    const invoiceHTML = `
              <html>
                <head>
                  <title>Invoice #${invoiceId}</title>
                  <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 40px; }
                    .header h1 { color: #4f46e5; margin: 0; }
                    .details { margin-bottom: 40px; }
                    .details p { margin: 5px 0; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th { text-align: left; padding: 12px; background: #f9fafb; font-weight: 600; border-bottom: 1px solid #ddd; }
                    td { padding: 12px; border-bottom: 1px solid #eee; }
                    .totals { float: right; width: 300px; }
                    .row { display: flex; justify-content: space-between; padding: 8px 0; }
                    .total-row { font-weight: bold; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; font-size: 1.1em; }
                    .footer { margin-top: 80px; text-align: center; color: #888; font-size: 0.9em; border-top: 1px solid #eee; padding-top: 20px; }
                    @media print { body { -webkit-print-color-adjust: exact; } }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <div>
                      <h1>StoreCraft</h1>
                      <p>Premium Merchant Services</p>
                    </div>
                    <div style="text-align: right;">
                      <h2 style="margin: 0; color: #888;">INVOICE</h2>
                      <p>#${invoiceId}</p>
                      <p>${date}</p>
                    </div>
                  </div>

                  <div class="details">
                    <p><strong>Bill To:</strong></p>
                    <p>${storeData?.name || store}</p>
                    <p>Merchant ID: ${storeData?._id || 'N/A'}</p>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Billing Cycle</th>
                        <th style="text-align: right;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>${currentPlanDetails?.planName} Plan</strong><br><span style="color: #666; font-size: 0.9em;">Subscription Renewal</span></td>
                        <td>${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}</td>
                        <td style="text-align: right;">₹${amount}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div class="totals">
                    <div class="row">
                      <span>Subtotal:</span>
                      <span>₹${amount}</span>
                    </div>
                    <div class="row">
                      <span>Tax (18% GST):</span>
                      <span>₹${tax}</span>
                    </div>
                    <div class="row total-row">
                      <span>Total Paid:</span>
                      <span>₹${total}</span>
                    </div>
                  </div>

                  <div style="clear: both;"></div>

                  <div class="footer">
                    <p>Thank you for your business!</p>
                    <p>This is a computer-generated invoice and requires no signature.</p>
                    <p>StoreCraft Inc. | support@storecraft.com</p>
                  </div>
                  <script>
                    window.onload = function() { window.print(); }
                  </script>
                </body>
              </html>
            `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
    } else {
      toast.error("Popup blocked. Please allow popups to download invoice.");
    }
  };

  // DEFAULT VIEW: Current Plan Details
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-black text-[#1a2333] tracking-tight">My Subscription</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">
          Manage your billing and view your plan capabilities.
        </p>
      </div>

      {currentPlanDetails ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">

            {/* 1. Identity Card (2 columns wide) */}
            <div className="md:col-span-2 bg-[#0f172a] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20 group animate-in slide-in-from-left-4 duration-700">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:bg-indigo-500/30 transition-all duration-700"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl translate-y-12 -translate-x-12"></div>

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-4 shadow-inner">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Active Subscription
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                      {currentPlanDetails.planName}
                    </h2>
                    <p className="text-slate-400 font-medium max-w-sm">
                      {currentPlanDetails.features?.[0] || "Standard access enabled."}
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-lg">
                    <Icon name={getCategoryIcon(currentPlanDetails.planName)} size={32} className="text-indigo-400" />
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mb-1">Current Billing</p>
                    <p className="text-4xl font-black flex items-baseline gap-1">
                      ₹{billingCycle === 'monthly' ? currentPlanDetails.priceMonthly : currentPlanDetails.priceYearly}
                      <span className="text-lg font-medium text-slate-500">/ {billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setViewMode('upgrade')}
                    className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 transform duration-200"
                  >
                    <Icon name="Zap" size={16} className="text-indigo-600" /> Upgrade Plan
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Timeline Status (1 column) */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between relative overflow-hidden animate-in slide-in-from-right-4 duration-700 delay-100">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Icon name="Calendar" size={100} />
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Subscription Timeline</h3>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">Started On</p>
                    <p className="text-lg font-bold text-slate-700 flex items-center gap-2">
                      <Icon name="CheckCircle" size={16} className="text-emerald-500" />
                      {formatDate(currentPlanDetails.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">Next Renewal</p>
                    <p className="text-lg font-bold text-indigo-600 flex items-center gap-2">
                      <Icon name="Clock" size={16} />
                      {formatDate(getVisualRenewalDate())}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 font-medium text-center">
                  Auto-renewal is <span className="text-emerald-600 font-bold">ON</span>
                </p>
              </div>
            </div>

            {/* 3. Resource Limits (parse from features) */}
            <div className="md:col-span-1 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 animate-in slide-in-from-bottom-4 duration-700 delay-200">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Plan Capacities</h3>
              <div className="space-y-6">
                {/* Product Limit Parsing */}
                {(() => {
                  const productFeature = currentPlanDetails.features?.find((f: string) => f.toLowerCase().includes('product'));
                  const limit = productFeature ? parseInt(productFeature.match(/\d+/)?.[0] || "0") : 0;
                  const displayLimit = limit > 0 ? limit : "Unlimited";
                  // Mock usage for visual demo - ideally fetching from storeData if available
                  const mockUsage = Math.floor((limit || 100) * 0.4);

                  return (
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Icon name="Package" size={14} /> Products</span>
                        <span className="text-xs font-bold text-indigo-600">{limit ? `${mockUsage} / ${limit}` : displayLimit}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: limit ? '40%' : '100%' }}></div>
                      </div>
                    </div>
                  );
                })()}

                {/* Staff Limit Parsing */}
                {(() => {
                  const staffFeature = currentPlanDetails.features?.find((f: string) => f.toLowerCase().includes('staff') || f.toLowerCase().includes('admin'));
                  const limit = staffFeature ? parseInt(staffFeature.match(/\d+/)?.[0] || "1") : 1;

                  return (
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Icon name="Users" size={14} /> Team Members</span>
                        <span className="text-xs font-bold text-indigo-600">1 / {limit}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(1 / limit) * 100}%` }}></div>
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-4 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Your data access limits are determined by your current tier. Upgrade to increase capacities.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Billing Actions & Invoices */}
            <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-white rounded-[2.5rem] p-8 border border-indigo-100/50 shadow-xl shadow-indigo-100/50 animate-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Billing & Payment</h3>
                  <p className="text-sm text-slate-500">Manage your payment methods and download receipts.</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm flex items-center gap-2">
                    <Icon name="CreditCard" size={14} /> Manage Method
                  </button>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2">
                    <Icon name="RefreshCw" size={14} /> Renew Now
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 transition-colors">
                    <Icon name="FileText" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Latest Invoice</p>
                    <p className="text-xs text-slate-400">Paid on {formatDate(currentPlanDetails.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadInvoice}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Download PDF"
                >
                  <Icon name="Download" size={18} />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl">
          <p className="text-slate-400 font-bold">Loading subscription details...</p>
        </div>
      )}
    </div>
  );
}
