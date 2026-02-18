import axios from "axios";

let BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

if (BASE_URL.includes("localhost")) {
  BASE_URL = BASE_URL.replace("localhost", "127.0.0.1");
}

// Create base API instance for merchants
export const merchantApi = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 second timeout
});

// Initialize Authorization from localStorage on client
try {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("kx_token");
    if (token) {
      merchantApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }
} catch { }

/**
 * Helper function to get store ID from user token
 * Merchants typically have direct access to their store
 */
async function getStoreIdFromToken(): Promise<string | null> {
  try {
    // Try multiple sources for store ID

    // 1. Check kx_profile first
    const profile = localStorage.getItem("kx_profile");
    if (profile) {
      const payload = JSON.parse(profile);

      // Merchants usually have storeId directly in their profile
      if (payload.storeId) {
        return payload.storeId;
      }

      // If user has stores array, use the first one (primary store)
      if (payload.stores && payload.stores.length > 0) {
        return payload.stores[0];
      }
    }

    // 2. Check kx_token for store information
    const token = localStorage.getItem("kx_token");
    if (token) {
      try {
        // Decode JWT token to get store info
        const payload = JSON.parse(atob(token.split(".")[1]));

        if (payload.storeId) {
          return payload.storeId;
        }

        if (payload.stores && payload.stores.length > 0) {
          return payload.stores[0];
        }
      } catch (tokenError) {
        // Token might not be JWT format, continue to next fallback
      }
    }

    // 3. Check various localStorage keys
    const possibleKeys = [
      "merchant.storeId",
      "admin.storeId",
      "storeId",
      "currentStoreId",
      "selectedStoreId",
    ];

    for (const key of possibleKeys) {
      const storeId = localStorage.getItem(key);
      if (storeId) {
        return storeId;
      }
    }

    // 4. Check sessionStorage as last resort
    for (const key of possibleKeys) {
      const storeId = sessionStorage.getItem(key);
      if (storeId) {
        return storeId;
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting store ID from profile:", error);
    return null;
  }
}

/**
 * Helper function to make API calls with automatic store ID inclusion
 */
async function apiCall<T>(
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  data?: any,
  params?: any
): Promise<T> {
  const storeId = await getStoreIdFromToken();

  // Allow some calls to skip storeId check if they are for store discovery
  const isPublicStoreFetch = url.includes("/store/slug/") && method === "get";

  if (!storeId && !isPublicStoreFetch) {
    throw new Error(
      "Store ID not found. Please ensure you're logged in as a merchant."
    );
  }

  // Add storeId to params for GET/DELETE requests or data for POST/PUT/PATCH requests
  if (method === "get" || method === "delete") {
    if (storeId) params = { ...params, storeId };
    const response = await merchantApi[method](url, { params });

    // Auto-save storeId if this was a getBySlug call and we found it
    if (isPublicStoreFetch && response.data?.success && response.data?.data?.id) {
      setStoreId(response.data.data.id);
      if (typeof window !== "undefined") {
        localStorage.setItem("admin.storeId", response.data.data.id);
      }
    }

    return response.data;
  } else {
    data = { ...data, storeId };
    const response = await merchantApi[method](url, data);
    return response.data;
  }
}

/**
 * Merchant API - Store owner operations
 * All operations automatically include store ID from user token
 */
export const MerchantAPI = {
  // Store management
  store: {
    get: () => apiCall("get", "/store"),
    getBySlug: (slug: string) => apiCall("get", `/store/slug/${slug}`),
    getById: (id: string) => apiCall("get", `/store/${id}`),
    update: (slug: string, data: any) => apiCall("put", `/store/${slug}`, data),
    getSettings: () => apiCall("get", "/store/store-settings"),
    updateSettings: (data: any) =>
      apiCall("put", "/store/store-settings", data),
  },

  // Notice/Announcement operations
  notices: {
    list: (params?: any) => apiCall("get", "/notices", undefined, params),
    get: (id: string) => apiCall("get", `/notices/${id}`),
    create: (data: any) => apiCall("post", "/notices", data),
    update: (id: string, data: any) => apiCall("put", `/notices/${id}`, data),
    delete: (id: string) => apiCall("delete", `/notices/${id}`),
    toggleActive: (id: string) => apiCall("patch", `/notices/${id}/toggle`),
    getActive: () => apiCall("get", "/notices/active"),
    getStats: () => apiCall("get", "/notices/stats"),
  },

  // Products management
  products: {
    list: (params?: any) =>
      apiCall("get", "/store/products", undefined, params),
    get: (id: string) => apiCall("get", `/store/products/${id}`),
    create: (data: any) => apiCall("post", "/store/products", data),
    update: (id: string, data: any) =>
      apiCall("put", `/store/products/${id}`, data),
    delete: (id: string) => apiCall("delete", `/store/products/${id}`),
    bulkUpdate: (data: any) =>
      apiCall("post", "/store/products/bulk-update", data),
  },

  // Categories management
  categories: {
    list: (params?: any) =>
      apiCall("get", "/store/categories", undefined, params),
    get: (id: string) => apiCall("get", `/store/categories/${id}`),
    create: (data: any) => apiCall("post", "/store/categories", data),
    update: (id: string, data: any) =>
      apiCall("put", `/store/categories/${id}`, data),
    delete: (id: string) => apiCall("delete", `/store/categories/${id}`),
  },

  // Orders management
  orders: {
    list: (params?: any) => apiCall("get", "/store/orders", undefined, params),
    get: (id: string) => apiCall("get", `/store/orders/${id}`),
    update: (id: string, data: any) =>
      apiCall("put", `/store/orders/${id}`, data),
    updateStatus: (id: string, status: string) =>
      apiCall("patch", `/store/orders/${id}/status`, { status }),
    fulfill: (id: string, data: any) =>
      apiCall("post", `/store/orders/${id}/fulfill`, data),
    cancel: (id: string, reason: string) =>
      apiCall("post", `/store/orders/${id}/cancel`, { reason }),
  },

  // Customers management
  customers: {
    list: (params?: any) =>
      apiCall("get", "/store/customers", undefined, params),
    get: (id: string) => apiCall("get", `/store/customers/${id}`),
    create: (data: any) => apiCall("post", "/store/customers", data),
    update: (id: string, data: any) =>
      apiCall("put", `/store/customers/${id}`, data),
    delete: (id: string) => apiCall("delete", `/store/customers/${id}`),
    getOrders: (id: string) => apiCall("get", `/store/customers/${id}/orders`),
  },

  // Analytics and Reports
  analytics: {
    getSales: (params?: any) =>
      apiCall("get", "/store/analytics/sales", undefined, params),
    getOrders: (params?: any) =>
      apiCall("get", "/store/analytics/orders", undefined, params),
    getCustomers: (params?: any) =>
      apiCall("get", "/store/analytics/customers", undefined, params),
    getProducts: (params?: any) =>
      apiCall("get", "/store/analytics/products", undefined, params),
    getRevenue: (params?: any) =>
      apiCall("get", "/store/analytics/revenue", undefined, params),
  },

  // Team management
  team: {
    list: (params?: any) => apiCall("get", "/store/team", undefined, params),
    invite: (data: any) => apiCall("post", "/store/team/invite", data),
    update: (id: string, data: any) =>
      apiCall("put", `/store/team/${id}`, data),
    remove: (id: string) => apiCall("delete", `/store/team/${id}`),
    updateRole: (id: string, role: string) =>
      apiCall("patch", `/store/team/${id}/role`, { role }),
  },

  // Domain management
  domains: {
    list: () => apiCall("get", "/store/domains"),
    connect: (data: { domain: string }) =>
      apiCall("post", "/store/domains/connect", data),
    setPrimary: (domain: string) =>
      apiCall("post", "/store/domains/primary", { domain }),
    verify: (domain: string) =>
      apiCall("post", "/store/domains/verify", { domain }),
    delete: (domainId: string) =>
      apiCall("delete", `/store/domains/${domainId}`),
    transfer: (data: { domain: string; authCode: string }) =>
      apiCall("post", "/store/domains/transfer", data),
    getDns: (domainId: string) =>
      apiCall("get", `/store/domains/${domainId}`),
  },

  // Inventory management
  inventory: {
    list: (params?: any) =>
      apiCall("get", "/store/inventory", undefined, params),
    update: (id: string, data: any) =>
      apiCall("put", `/store/inventory/${id}`, data),
    adjust: (id: string, data: any) =>
      apiCall("post", `/store/inventory/${id}/adjust`, data),
    getLogs: (id: string) => apiCall("get", `/store/inventory/${id}/logs`),
  },

  // File upload
  upload: {
    file: async (file: File, folder?: string) => {
      const formData = new FormData();
      formData.append("file", file);

      const headers: any = { "Content-Type": "multipart/form-data" };
      const token = localStorage.getItem("kx_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const config: any = { headers };
      if (folder) config.params = { folder };

      const response = await merchantApi.post("/upload", formData, config);
      return response.data;
    },

    delete: async (publicId: string) => {
      const headers: any = {};
      const token = localStorage.getItem("kx_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await merchantApi.delete(
        `/upload/${encodeURIComponent(publicId)}`,
        { headers }
      );
      return response.data;
    },
  },
};

/**
 * Helper function to get current store ID
 */
export async function getCurrentStoreId(): Promise<string | null> {
  return await getStoreIdFromToken();
}

/**
 * Debug function to check what store ID sources are available
 * This helps troubleshoot store ID detection issues
 */
export function debugStoreIdSources(): any {
  const sources: any = {};

  try {
    // Check kx_profile
    const profile = localStorage.getItem("kx_profile");
    if (profile) {
      sources.kx_profile = JSON.parse(profile);
    }

    // Check kx_token
    const token = localStorage.getItem("kx_token");
    if (token) {
      try {
        sources.kx_token = JSON.parse(atob(token.split(".")[1]));
      } catch (e) {
        sources.kx_token = "Invalid JWT format";
      }
    }

    // Check localStorage keys
    const possibleKeys = [
      "merchant.storeId",
      "admin.storeId",
      "storeId",
      "currentStoreId",
      "selectedStoreId",
    ];

    sources.localStorage = {};
    for (const key of possibleKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        sources.localStorage[key] = value;
      }
    }

    // Check sessionStorage
    sources.sessionStorage = {};
    for (const key of possibleKeys) {
      const value = sessionStorage.getItem(key);
      if (value) {
        sources.sessionStorage[key] = value;
      }
    }
  } catch (error) {
    sources.error = error.message;
  }

  return sources;
}

/**
 * Helper function to set store ID in localStorage
 */
export function setStoreId(storeId: string): void {
  localStorage.setItem("merchant.storeId", storeId);
}

/**
 * Helper function to get store information
 */
export async function getCurrentStore(): Promise<any> {
  const storeId = await getStoreIdFromToken();
  if (!storeId) throw new Error("Store ID not found");

  const response = await merchantApi.get(`/platform/stores/${storeId}`);
  return response.data;
}

export default MerchantAPI;
