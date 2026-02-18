import axios from "axios";
import { useStoreCtx } from "../contexts/StoreContext";

let BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

// Normalizing localhost to 127.0.0.1 for consistent Windows behavior
if (BASE_URL.includes("localhost")) {
  BASE_URL = BASE_URL.replace("localhost", "127.0.0.1");
}

console.log("🔌 API Base URL:", BASE_URL);

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 second timeout for slower operations like registration
});

// Add request interceptor to log API requests
api.interceptors.request.use(
  (config) => {
    // Ensure we always use the latest token from storage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("kx_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error("❌ API Request Error:", error);
    return Promise.reject(error);
  }
);
// Initialize Authorization from localStorage on client
try {
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("kx_token");
    if (t) {
      api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    }
  }
} catch { }

// Utility function to check if user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const token = localStorage.getItem("kx_token");
    return !!token;
  } catch {
    return false;
  }
}

// Utility function to get auth token
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("kx_token");
  } catch {
    return null;
  }
}

// Utility function to set auth token and update API headers
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("kx_token", token);

    // Update all API instances
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    storeApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    uploadApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    resourceApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    paymentApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } catch (error) {
    console.error("Error setting auth token:", error);
  }
}

// Utility function to clear auth token and remove API headers
export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("kx_token");
    delete api.defaults.headers.common["Authorization"];
    delete storeApi.defaults.headers.common["Authorization"];
    delete uploadApi.defaults.headers.common["Authorization"];
    delete resourceApi.defaults.headers.common["Authorization"];
  } catch (error) {
    console.error("Error clearing auth token:", error);
  }
}

// Utility function to refresh API headers from localStorage
export function refreshAuthHeaders(): void {
  if (typeof window === "undefined") return;
  try {
    const token = localStorage.getItem("kx_token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      storeApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      uploadApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      resourceApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
      delete storeApi.defaults.headers.common["Authorization"];
      delete uploadApi.defaults.headers.common["Authorization"];
      delete resourceApi.defaults.headers.common["Authorization"];
    }
  } catch (error) {
    console.error("Error refreshing auth headers:", error);
  }
}

// Namespaced Store API instance
export const storeApi = axios.create({ baseURL: `${BASE_URL}/store` });
export const uploadApi = axios.create({ baseURL: `${BASE_URL}/upload` });
export const resourceApi = axios.create({ baseURL: `${BASE_URL}/store` });

// Set Authorization headers for API instances
try {
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("kx_token");
    if (t) {
      storeApi.defaults.headers.common["Authorization"] = `Bearer ${t}`;
      uploadApi.defaults.headers.common["Authorization"] = `Bearer ${t}`;
      resourceApi.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    }
  }
} catch { }

export const paymentApi = axios.create({ baseURL: `${BASE_URL}/payments` });

// Add authentication to paymentApi
try {
  const t = localStorage.getItem("kx_token");
  if (t) {
    paymentApi.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  }
} catch { }

// Hook to get a pre-configured client for current store (adds ?store=slug)
export function useStoreApi() {
  const { storeSlug } = useStoreCtx();
  const client = axios.create({
    baseURL: `${BASE_URL}/store`,
    params: { store: storeSlug },
  });
  return client;
}

// Generic REST client for a resource
function createResourceClient(resourcePath: string) {
  return {
    list: (params?: any) =>
      resourceApi.get(`/${resourcePath}`, { params }).then((r) => r.data),
    get: (id: string) =>
      resourceApi.get(`/${resourcePath}/${id}`).then((r) => r.data),
    create: (payload: any) =>
      resourceApi.post(`/${resourcePath}`, payload).then((r) => r.data),
    update: (id: string, payload: any) =>
      resourceApi.put(`/${resourcePath}/${id}`, payload).then((r) => r.data),
    remove: (id: string) =>
      resourceApi.delete(`/${resourcePath}/${id}`).then((r) => r.data),
  };
}

// Favicon generation API
export const FaviconGenerator = {
  generate: (originalImageUrl: string, storeSlug: string) =>
    storeApi
      .post("/favicon/generate", {
        originalImageUrl,
        storeSlug,
      })
      .then((r) => r.data),
  download: (storeSlug: string) =>
    storeApi
      .get(`/favicon/download/${storeSlug}`, {
        responseType: "blob",
      })
      .then((r) => r.data),
};

// Specific resource clients (named, used across admin UI)
export const Products = createResourceClient("products");
export const ProductVariants = createResourceClient("product-variants");
export const Categories = createResourceClient("categories");
export const Collections = createResourceClient("collections");
export const Inventories = createResourceClient("inventories");
export const InventoryLogs = createResourceClient("inventory-logs");
export const Locations = createResourceClient("locations");
export const Customers = createResourceClient("customers");
export const CustomerAddresses = createResourceClient("customer-addresses");
export const CustomerGroups = createResourceClient("customer-groups");
export const Orders = createResourceClient("orders");
export const OrderLineItems = createResourceClient("order-line-items");
export const Carts = createResourceClient("carts");
export const AbandonedCheckouts = createResourceClient("abandoned-checkouts");
export const Fulfillments = createResourceClient("fulfillments");
export const Refunds = createResourceClient("refunds");
export const Returns = createResourceClient("returns");
export const Discounts = createResourceClient("discounts");
export const GiftCards = createResourceClient("gift-cards");
export const LoyaltyPrograms = createResourceClient("loyalty-programs");
export const EmailCampaigns = createResourceClient("email-campaigns");
export const ShippingZones = createResourceClient("shipping-zones");
export const ShippingRates = createResourceClient("shipping-rates");
export const ShippingProviders = createResourceClient("shipping-providers");
export const TaxRates = createResourceClient("tax-rates");
export const MetaTags = createResourceClient("meta-tags");
export const Redirects = createResourceClient("redirects");
export const Sitemaps = createResourceClient("sitemaps");
export const PaymentGateways = createResourceClient("payment-gateways");
export const Transactions = createResourceClient("transactions");
export const Payouts = createResourceClient("payouts");
export const Staff = createResourceClient("staff");
export const Roles = createResourceClient("roles");

// Unified Store API - handles all store operations
export const Store = {
  list: (params?: any) =>
    api.get("/store", { params }).then((r) => {
      if (r.status === 304) {
        throw new Error("Store data not found (304 Not Modified)");
      }
      return r.data;
    }),
  get: (slug: string) => api.get(`/store/slug/${slug}`).then((r) => r.data),
  getBySlug: (slug: string) =>
    api.get(`/store/slug/${slug}`).then((r) => {
      if (r.status === 304) {
        throw new Error("Store not found (304 Not Modified)");
      }
      return r.data;
    }),
  create: (payload: any) => api.post("/store", payload).then((r) => r.data),
  update: (slug: string, payload: any) =>
    api.put(`/store/${slug}`, payload).then((r) => r.data),
  updateStatus: (id: string, status: any) =>
    api.patch(`/platform/store/${id}/status`, status).then((r) => r.data),
  updateAssets: (id: string, assets: any) =>
    api.patch(`/platform/store/${id}/assets`, assets).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/platform/store/${id}`).then((r) => r.data),
  getStats: (id: string) =>
    api.get(`/platform/store/${id}/stats`).then((r) => r.data),
  checkSlug: (slug: string, excludeId?: string) =>
    api
      .get(`/platform/store/check-slug/${slug}`, { params: { excludeId } })
      .then((r) => r.data),
  getSubscription: (slug: string) =>
    api.get(`/store/slug/${slug}/subscription`).then((r) => r.data),
};

// Legacy StoreSettings for backward compatibility
export const StoreSettings = {
  list: (params?: any) => {
    // Convert old filter format to new API
    if (params?.filter) {
      const filter = JSON.parse(params.filter);
      if (filter.storeSlug) {
        return Store.getBySlug(filter.storeSlug);
      }
    }
    return Store.list(params);
  },
  get: (id: string) => Store.get(id),
  create: (payload: any) => Store.create(payload),
  update: (id: string, payload: any) => Store.update(id, payload),
  remove: (id: string) => Store.remove(id),
};
export const EmailTemplates = createResourceClient("email-templates");
export const Notifications = createResourceClient("notifications");

// Notices (store-specific announcements)
export const Notices = {
  list: (params?: any) => api.get(`/notices`, { params }).then((r) => r.data),
  get: (id: string) => api.get(`/notices/${id}`).then((r) => r.data),
  create: (payload: any) => api.post(`/notices`, payload).then((r) => r.data),
  update: (id: string, payload: any) =>
    api.put(`/notices/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/notices/${id}`).then((r) => r.data),
  toggleActive: (id: string) =>
    api.patch(`/notices/${id}/toggle`).then((r) => r.data),
  getActive: (storeId: string) =>
    api.get(`/notices/active`, { params: { storeId } }).then((r) => r.data),
  getStats: (storeId: string) =>
    api.get(`/notices/stats`, { params: { storeId } }).then((r) => r.data),
};

// Platform Users (super admin scope)
export const PlatformUsers = {
  list: (params?: any) =>
    api.get(`/platform/users`, { params }).then((r) => r.data),
  get: (id: string) => api.get(`/platform/users/${id}`).then((r) => r.data),
  create: (payload: any) =>
    api.post(`/platform/users`, payload).then((r) => r.data),
  update: (id: string, payload: any) =>
    api.put(`/platform/users/${id}`, payload).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/platform/users/${id}`).then((r) => r.data),
};

// Platform Stores (super admin scope)
export const PlatformStores = {
  list: (params?: any) =>
    api.get(`/platform/stores`, { params }).then((r) => r.data),
  get: (id: string) => api.get(`/platform/stores/${id}`).then((r) => r.data),
  update: (id: string, payload: any) =>
    api.put(`/platform/stores/${id}`, payload).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/platform/stores/${id}`).then((r) => r.data),
  listTeam: (storeId: string) =>
    api.get(`/store/team`, { params: { storeId } }).then((r) => r.data),
  listProducts: (storeId: string) =>
    api.get(`/store/products`, { params: { storeId } }).then((r) => r.data),
};

// Public Subscription Plans (no auth required)
export const PublicSubscriptionPlans = {
  list: (params?: any) =>
    api.get(`/subscription-plans`, { params }).then((r) => r.data),
  get: (id: string) => api.get(`/subscription-plans/${id}`).then((r) => r.data),
};

// Platform Subscription Plans (admin scope)
export const PlatformSubscriptionPlans = {
  list: (params?: any) =>
    api.get(`/platform/plans`, { params }).then((r) => r.data),
  get: (id: string) =>
    api.get(`/platform/plans/${id}`).then((r) => r.data),
  create: (payload: any) =>
    api.post(`/platform/plans`, payload).then((r) => r.data),
  update: (id: string, payload: any) =>
    api.put(`/platform/plans/${id}`, payload).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/platform/plans/${id}`).then((r) => r.data),
};

// Platform Themes (admin scope)
export const PlatformThemes = {
  list: (params?: any) =>
    api.get(`/platform/themes`, { params }).then((r) => r.data),
  get: (slug: string) =>
    api.get(`/platform/themes/${slug}`).then((r) => r.data),
  upload: (payload: {
    name: string;
    slug: string;
    description?: string;
    thumbnail?: File | null;
    buildZip: File;
  }) => {
    const form = new FormData();
    form.append("name", payload.name);
    form.append("slug", payload.slug);
    if (payload.description) form.append("description", payload.description);
    if (payload.thumbnail) form.append("thumbnail", payload.thumbnail);
    form.append("buildZip", payload.buildZip);
    return api
      .post(`/platform/themes`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000, // 10 minutes for large zip uploads
      })
      .then((r) => r.data);
  },
  update: (
    slug: string,
    payload: {
      name?: string;
      description?: string;
      status?: string;
      thumbnail?: File | null;
      buildZip?: File | null;
    }
  ) => {
    const form = new FormData();
    if (typeof payload.name !== "undefined") form.append("name", payload.name);
    if (typeof payload.description !== "undefined")
      form.append("description", payload.description || "");
    if (typeof payload.status !== "undefined")
      form.append("status", payload.status);
    if (payload.thumbnail) form.append("thumbnail", payload.thumbnail);
    if (payload.buildZip) form.append("buildZip", payload.buildZip);
    return api
      .put(`/platform/themes/${slug}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000, // 10 minutes
      })
      .then((r) => r.data);
  },
  remove: (slug: string) =>
    api.delete(`/platform/themes/${slug}`).then((r) => r.data),
};

// Public Themes (no auth required)
export const PublicThemes = {
  list: (params?: any) => api.get(`/themes`, { params }).then((r) => r.data),
  get: (slug: string) => api.get(`/themes/${slug}`).then((r) => r.data),
  apply: (store_slug: string, theme_slug: string) =>
    api.post(`/platform/themes/apply`, { store_slug, theme_slug }).then((r) => r.data),
};

// Payments
// Payment API functions
export async function createRzpOrder(payload: {
  planName: string;
  amount: number;
  currency?: string;
}) {
  const res = await api.post(`/payments/razorpay/order`, payload);
  return res.data;
}

export async function verifyRzpPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planId?: string;
  planName?: string;
  amount?: number;
  currency?: string;
  storeId?: string;
  storeSlug?: string;
  billingCycle?: string;
}) {
  const res = await api.post(`/payments/razorpay/verify`, payload);
  return res.data;
}

// Payment management functions
export const PaymentAPI = {
  // Get payment history for current user
  getHistory: (params?: { limit?: number; page?: number }) =>
    api.get(`/payments/history`, { params }).then((r) => r.data),

  // Get active subscription for current user
  getActiveSubscription: () =>
    api.get(`/payments/subscription`).then((r) => r.data),

  // Send OTP for cancellation
  sendCancellationOTP: () =>
    api.post(`/payments/subscription/send-otp`).then((r) => r.data),

  // Cancel subscription
  cancelSubscription: (otp: string, reason?: string, storeId?: string) =>
    api
      .post(`/payments/subscription/cancel`, { otp, reason, storeId })
      .then((r) => r.data),

  // Get payment by ID
  getById: (paymentId: string) =>
    api.get(`/payments/${paymentId}`).then((r) => r.data),

  // Get payment history for a specific store
  getStoreHistory: (
    storeId: string,
    params?: { limit?: number; page?: number }
  ) =>
    api
      .get(`/payments/store/${storeId}/history`, { params })
      .then((r) => r.data),

  // Get active subscription for a specific store
  getStoreActiveSubscription: (storeId: string) =>
    api.get(`/payments/store/${storeId}/subscription`).then((r) => r.data),
};

// User Subscriptions (authenticated users)
export const UserSubscriptions = {
  list: (params?: any) =>
    api.get(`/subscriptions`, { params }).then((r) => r.data),
  get: (id: string) => api.get(`/subscriptions/${id}`).then((r) => r.data),
  getByStore: (storeSlug: string) =>
    api.get(`/subscriptions/store/${storeSlug}`).then((r) => r.data),
  upgrade: (storeSlug: string, planId: string) =>
    api
      .post(`/subscriptions/store/${storeSlug}/upgrade`, { planId })
      .then((r) => r.data),
  cancel: (storeSlug: string, reason?: string) =>
    api
      .post(`/subscriptions/store/${storeSlug}/cancel`, { reason })
      .then((r) => r.data),
};

// Platform Subscriptions (admin scope)
export const PlatformSubscriptions = {
  list: (params?: any) =>
    api.get(`/platform/subscriptions`, { params }).then((r) => r.data),
  get: (id: string) =>
    api.get(`/platform/subscriptions/${id}`).then((r) => r.data),
  setStatus: (id: string, status: string) =>
    api
      .put(`/platform/subscriptions/${id}/status`, { status })
      .then((r) => r.data),
  update: (id: string, payload: any) =>
    api.put(`/platform/subscriptions/${id}`, payload).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/platform/subscriptions/${id}`).then((r) => r.data),
};

// Platform Payment Transactions (admin scope)
export const PlatformPaymentTransactions = {
  list: (params?: any) =>
    api.get(`/platform/payments`, { params }).then((r) => r.data),
  get: (id: string) =>
    api.get(`/platform/payments/${id}`).then((r) => r.data),
};

// File upload helper – expects backend /api/upload to accept 'file'
export async function uploadFile(
  file: File,
  folder?: string
): Promise<{ url: string } | any> {
  const form = new FormData();
  form.append("file", file);
  const headers: any = {};
  try {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("kx_token");
      if (t) headers["Authorization"] = `Bearer ${t}`;
    }
  } catch { }
  // Also mirror Authorization from api if present
  if (
    api.defaults.headers.common["Authorization"] &&
    !headers["Authorization"]
  ) {
    headers["Authorization"] = api.defaults.headers.common[
      "Authorization"
    ] as string;
  }
  const config: any = { headers };
  if (folder) {
    config.params = { folder };
  }
  const res = await uploadApi.post("/", form, config);
  return res.data;
}

export async function deleteCloudinary(publicId: string) {
  const headers: any = {};
  try {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("kx_token");
      if (t) headers["Authorization"] = `Bearer ${t}`;
    }
  } catch { }
  if (
    api.defaults.headers.common["Authorization"] &&
    !headers["Authorization"]
  ) {
    headers["Authorization"] = api.defaults.headers.common[
      "Authorization"
    ] as string;
  }
  const res = await uploadApi.delete(`/${encodeURIComponent(publicId)}`, {
    headers,
  });
  return res.data;
}

// Try to derive Cloudinary publicId from a delivery URL as fallback
export function derivePublicIdFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const m = url.match(/\/upload\/(?:v\d+\/)?([^.#?]+)/);
    if (!m) return null;
    const withoutExt = m[1];
    return withoutExt || null;
  } catch {
    return null;
  }
}

// Platform store helpers (admin only)
export async function createStore(payload: any) {
  try {
    const res = await api.post("/platform/stores", payload);
    return res.data;
  } catch (error) {
    console.error("Error creating store:", error);
    throw error;
  }
}

// User store creation (for regular users)
export async function createUserStore(payload: any) {
  try {
    const res = await api.post("/store", payload);
    return res.data;
  } catch (error) {
    console.error("Error creating user store:", error);
    throw error;
  }
}

export async function getStoreBySlug(slug: string) {
  try {
    const res = await api.get(`/store/slug/${slug}/check`);
    return res.data;
  } catch (error) {
    console.error("Error fetching store by slug:", error);
    throw error;
  }
}

export async function getStoreById(id: string) {
  try {
    const res = await api.get(`/platform/stores/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching store by ID:", error);
    throw error;
  }
}

export async function updateStore(id: string, payload: any) {
  try {
    const res = await api.put(`/platform/stores/${id}`, payload);
    return res.data;
  } catch (error) {
    console.error("Error updating store:", error);
    throw error;
  }
}

export async function deleteStore(id: string) {
  try {
    const res = await api.delete(`/platform/stores/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting store:", error);
    throw error;
  }
}

export async function listStores(params?: any) {
  try {
    const res = await api.get("/platform/stores", { params });
    return res.data;
  } catch (error) {
    console.error("Error listing stores:", error);
    throw error;
  }
}

// Admin - Platform Stores client
// duplicate removed above

// Convenience re-exports for common operations
export const listProducts = Products.list;
export const createProduct = Products.create;
export const updateProduct = Products.update;
export const deleteProduct = Products.remove;

// Auth API for registration OTP
// Auth API for registration OTP
import { API_ROUTES } from "./routes";

export const AuthAPI = {
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }) => api.post(API_ROUTES.AUTH.REGISTER, {
    email: data.email,
    password: data.password,
    first_name: data.firstName,
    last_name: data.lastName,
    phone: data.phone
  }).then((r) => r.data),

  verifyOTP: (phone: string, otp: string) =>
    api.post(API_ROUTES.AUTH.VERIFY_OTP, { phone, otp }).then((r) => r.data),

  resendOTP: (phone: string) =>
    api.post(API_ROUTES.AUTH.SEND_OTP, { phone }).then((r) => r.data),

  // Added helper for sending OTP initially if needed
  sendOTP: (phone: string) =>
    api.post(API_ROUTES.AUTH.SEND_OTP, { phone }).then((r) => r.data),
};



// Platform Dashboard stats
export const PlatformDashboard = {
  getStats: () => api.get(`/platform/dashboard/stats`).then((r) => r.data),
  getRecentActivity: () => api.get(`/platform/dashboard/recent-activity`).then((r) => r.data),
};

// Merchant Dashboard stats
export const MerchantDashboard = {
  getStats: (storeId: string) => api.get(`/merchant/dashboard/stats/${storeId}`).then((r) => r.data),
};

export type ResourceClient = ReturnType<typeof createResourceClient>;



