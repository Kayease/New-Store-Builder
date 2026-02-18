"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CheckoutPage() {
  const plan = useSearchParams().get("plan") || "starter";
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const pay = async () => {
    setProcessing(true);
    // Simulate payment delay
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("kx_paid", "1");
      }
      router.push(`/onboarding?plan=${plan}`);
    }, 1200);
  };
  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
      <div className="border rounded-lg p-4 bg-white">
        <div className="text-sm text-slate-600">Selected plan</div>
        <div className="text-lg font-semibold capitalize">{plan}</div>
        <button
          className="mt-4 w-full px-4 py-2 rounded-md bg-primary text-white"
          onClick={pay}
          disabled={processing}
        >
          {processing ? "Processing..." : "Pay now"}
        </button>
      </div>
    </div>
  );
}
