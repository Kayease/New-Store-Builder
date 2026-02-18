declare global {
  interface Window {
    Razorpay: any;
  }
}

let rzpLoadingPromise: Promise<any> | null = null;

export async function loadRazorpaySdk(): Promise<any> {
  if (typeof window === "undefined") return null;
  if (window.Razorpay) return window.Razorpay;
  if (!rzpLoadingPromise) {
    rzpLoadingPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById("razorpay-sdk");
      if (existing) {
        if ((window as any).Razorpay) return resolve((window as any).Razorpay);
        existing.addEventListener("load", () =>
          resolve((window as any).Razorpay)
        );
        existing.addEventListener("error", () =>
          reject(new Error("Failed to load Razorpay SDK"))
        );
        return;
      }
      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve((window as any).Razorpay);
      script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
      document.body.appendChild(script);
    });
  }
  return rzpLoadingPromise;
}

type OpenCheckoutOptions = {
  order: { id: string; amount: number; currency: string };
  planName: string;
  onSuccess: (response: any) => void;
  onError?: (error: any) => void;
  onDismiss?: () => void;
};

export async function openRazorpayCheckout({
  order,
  planName,
  onSuccess,
  onError,
  onDismiss,
}: OpenCheckoutOptions) {
  try {
    const RazorpayCtor = await loadRazorpaySdk();
    if (!RazorpayCtor) throw new Error("Razorpay SDK not loaded");
    
    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!key) {
      throw new Error("Razorpay Key ID not configured");
    }

    const options = {
      key,
      amount: order.amount,
      currency: order.currency,
      name: "Kayease",
      description: `Subscription: ${planName}`,
      order_id: order.id,
      handler: onSuccess,
      prefill: {
        name: "",
        email: "",
        contact: "",
      },
      notes: {
        plan: planName,
        order_id: order.id,
      },
      theme: { 
        color: "#1d4ed8",
        backdrop_color: "#000000",
        hide_topbar: false,
      },
      modal: {
        ondismiss: function() {
          if (onDismiss) onDismiss();
        }
      },
      retry: {
        enabled: true,
        max_count: 3,
      },
      timeout: 300, // 5 minutes
    };

    const rzp = new RazorpayCtor(options);
    
    // Handle payment failure
    rzp.on('payment.failed', function (response: any) {
      console.error("Payment failed:", response.error);
      if (onError) {
        onError({
          type: 'payment_failed',
          error: response.error,
          message: response.error.description || 'Payment failed'
        });
      }
    });

    // Open the payment modal
    rzp.open();
    
    return rzp;
  } catch (error) {
    console.error("Razorpay checkout error:", error);
    if (onError) {
      onError({
        type: 'checkout_error',
        error: error,
        message: error instanceof Error ? error.message : 'Failed to open payment modal'
      });
    }
    throw error;
  }
}
