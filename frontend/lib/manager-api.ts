import axios from "axios";

let BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

if (BASE_URL.includes("localhost")) {
  BASE_URL = BASE_URL.replace("localhost", "127.0.0.1");
}
// Extract store slug from current URL if path includes /manager/{store}/...
function getStoreSlugFromUrl(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const { pathname, hostname } = window.location;
    // First try route pattern: /manager/{store}/...
    const m = pathname.match(/\/manager\/(.*?)\//);
    if (m && m[1]) return decodeURIComponent(m[1]);
    // Fallback: if you ever move to subdomain per store in manager, parse hostname
    // e.g., store--admin.example.com (left part before --)
    const hostLeft = hostname.split(".")[0] || "";
    if (hostLeft.includes("--")) return hostLeft.split("--")[0];
    return null;
  } catch {
    return null;
  }
}

// Create base API instance
export const managerApi = axios.create({ baseURL: BASE_URL });

// Initialize Authorization from localStorage on client
try {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("kx_token");
    if (token) {
      managerApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }
} catch { }

/**
 * Helper function to get store ID from user token
 * This will be used in all API calls to automatically include store ID
 */
async function getStoreIdFromToken(): Promise<string | null> {
  try {
    // 0. If URL contains a store slug, resolve it to storeId (highest priority)
    if (typeof window !== "undefined") {
      const slug = getStoreSlugFromUrl();
      if (slug) {
        const cached = sessionStorage.getItem(`store.slugToId.${slug}`);
        if (cached) return cached;
        try {
          const res = await managerApi.get(`/store/store-check/${slug}`);
          const id = res?.data?.data?.store?._id || res?.data?.store?._id;
          if (id) {
            sessionStorage.setItem(`store.slugToId.${slug}`, id);
            return id;
          }
        } catch { }
      }
    }

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
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));

          if (payload.storeId) {
            return payload.storeId;
          }

          if (payload.stores && payload.stores.length > 0) {
            return payload.stores[0];
          }
        }
      } catch (tokenError) {
        // Token might not be JWT format, continue to next fallback
      }
    }

    // 3. Check various localStorage keys (explicit admin selection etc.)
    const possibleKeys = [
      "admin.storeId",
      "storeId",
      "currentStoreId",
      "selectedStoreId",
      "merchant.storeId",
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

  if (!storeId) {
    alert(
      "Store ID not found!\n\nDebug Info:" +
      JSON.stringify(debugStoreIdSources(), null, 2)
    );
    throw new Error("Store ID not found. Please select a store first.");
  }

  // Ensure storeId is a plain string
  const normalizeStoreId = (x: any): string => {
    if (!x) return "";
    if (typeof x === "string") return x;
    if (typeof x === "object")
      return (x._id || x.id || x.storeId || "").toString();
    return String(x);
  };
  const normalizedStoreId = normalizeStoreId(storeId);

  // Add storeId to params for GET/DELETE requests or data for POST/PUT/PATCH requests
  if (method === "get" || method === "delete") {
    const cleanedParams = { ...(params || {}) } as any;
    if (cleanedParams.storeId !== undefined) {
      cleanedParams.storeId = normalizeStoreId(cleanedParams.storeId);
    }
    cleanedParams.storeId = normalizedStoreId;
    params = cleanedParams;
    const response = await managerApi[method](url, { params });
    return response.data;
  } else {
    // Handle FormData differently
    if (data instanceof FormData) {
      // Remove any accidental object-like storeId entries first
      try {
        data.delete("storeId");
      } catch { }
      data.append("storeId", normalizedStoreId);
    } else {
      const cleanedData: any = { ...(data || {}) };
      if (cleanedData.storeId !== undefined) {
        cleanedData.storeId = normalizeStoreId(cleanedData.storeId);
      }
      cleanedData.storeId = normalizedStoreId;
      data = cleanedData;
    }
    const response = await managerApi[method](url, data);
    return response.data;
  }
}

/**
 * Manager API - Store-specific operations
 * All operations automatically include store ID from user token
 */
export const ManagerAPI = {
  // GitHub integration (admin)
  github: {
    authorize: async (): Promise<{ url: string }> => {
      const res = await managerApi.get("/platform/github/authorize");
      return res.data;
    },
    status: async (): Promise<{ connected: boolean }> => {
      const res = await managerApi.get("/platform/github/status");
      return res.data;
    },
    repos: async (): Promise<any> => {
      const res = await managerApi.get("/platform/github/repos");
      return res.data;
    },
    branches: async (owner: string, repo: string): Promise<any> => {
      const res = await managerApi.get("/platform/github/branches", {
        params: { owner, repo },
      });
      return res.data;
    },
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

  // Blog operations
  blogs: {
    list: (params?: any) => apiCall("get", "/store/blog", undefined, params),
    get: (id: string) => apiCall("get", `/store/blog/${id}`),
    getBySlug: (slug: string) => apiCall("get", `/store/blog/slug/${slug}`),
    create: (data: any) => apiCall("post", "/store/blog", data),
    update: (id: string, data: any) =>
      apiCall("put", `/store/blog/${id}`, data),
    delete: (id: string) => apiCall("delete", `/store/blog/${id}`),
    permanentDelete: (id: string) =>
      apiCall("delete", `/store/blog/${id}/permanent`),
    toggleStatus: (id: string) =>
      apiCall("patch", `/store/blog/${id}/toggle-status`),
    getStats: () => apiCall("get", "/store/blog/stats"),
    uploadImage: (formData: FormData) =>
      apiCall("post", "/store/blog/upload-image", formData),
    deleteImage: (publicId: string) =>
      apiCall("delete", `/store/blog/image/${publicId}`),
  },

  // Customers (manager portal)
  customers: {
    list: (params?: any) =>
      apiCall("get", "/store/customers", undefined, params),
    get: (id: string) => apiCall("get", `/store/customers/${id}`),
    create: (data: any) => apiCall("post", "/store/customers", data),
    update: (id: string, data: any) =>
      apiCall("put", `/store/customers/${id}`, data),
    delete: (id: string) => apiCall("delete", `/store/customers/${id}`),
  },

  // Store settings
  storeSettings: {
    get: () => apiCall("get", "/store/store-settings"),
    update: (data: any) => apiCall("put", "/store/store-settings", data),
  },

  // Products
  products: {
    list: (params?: any) =>
      apiCall("get", "/store/products", undefined, params),
    get: (id: string) => apiCall("get", `/store/products/${id}`),
    create: (data: any) => apiCall("post", "/store/products", data),
    update: (id: string, data: any) =>
      apiCall("put", `/store/products/${id}`, data),
    delete: (id: string) => apiCall("delete", `/store/products/${id}`),
  },

  // Categories
  categories: {
    list: (params?: any) =>
      apiCall("get", "/store/categories", undefined, params),
    get: (id: string) => apiCall("get", `/store/categories/${id}`),
    create: (data: any) => apiCall("post", "/store/categories", data),
    update: (id: string, data: any) =>
      apiCall("put", `/store/categories/${id}`, data),
    delete: (id: string) => apiCall("delete", `/store/categories/${id}`),
  },

  // Brands CRUD
  brands: {
    list: (params?: any) => apiCall("get", "/store/brands", undefined, params),
    get: (id: string) => apiCall("get", `/store/brands/${id}`),
    create: (data: any) => apiCall("post", "/store/brands", data),
    update: (id: string, data: any) => apiCall("put", `/store/brands/${id}`, data),
    delete: (id: string) => apiCall("delete", `/store/brands/${id}`),
  },

  // Orders
  orders: {
    list: (params?: any) => apiCall("get", "/store/orders", undefined, params),
    get: (id: string) => apiCall("get", `/store/orders/${id}`),
    update: (id: string, data: any) =>
      apiCall("put", `/store/orders/${id}`, data),
    updateStatus: (id: string, status: string) =>
      apiCall("patch", `/store/orders/${id}/status`, { status }),
  },

  // Reports
  reports: {
    getSales: (params?: any) =>
      apiCall("get", "/store/reports/sales", undefined, params),
    getOrders: (params?: any) =>
      apiCall("get", "/store/reports/orders", undefined, params),
    getCustomers: (params?: any) =>
      apiCall("get", "/store/reports/customers", undefined, params),
  },

  // Team management
  team: {
    list: (params?: any) => apiCall("get", "/store/team", undefined, params),
    invite: (data: any) => apiCall("post", "/store/team/invite", data),
    update: (id: string, data: any) =>
      apiCall("put", `/store/team/${id}`, data),
    remove: (id: string) => apiCall("delete", `/store/team/${id}`),
    toggle: (id: string) => apiCall("patch", `/store/team/${id}/toggle`),
  },

  // Reviews & Ratings
  reviews: {
    list: (params?: any) => apiCall("get", "/store/reviews", undefined, params),
    create: (data: any) => apiCall("post", "/store/reviews", data),
    updateStatus: (id: string, status: string) =>
      apiCall("patch", `/store/reviews/${id}/status`, { status }),
    delete: (id: string) => apiCall("delete", `/store/reviews/${id}`),
  },

  // Newsletter
  newsletter: {
    list: (params?: any) =>
      apiCall("get", "/store/newsletter", undefined, params),
    subscribe: (data: any) =>
      apiCall("post", "/store/newsletter/subscribe", data),
    unsubscribe: (id: string) =>
      apiCall("patch", `/store/newsletter/${id}/unsubscribe`),
    subscribeById: (id: string) =>
      apiCall("patch", `/store/newsletter/${id}/subscribe`),
    delete: (id: string) => apiCall("delete", `/store/newsletter/${id}`),
  },

  // Banners
  banners: {
    list: (params?: any) => apiCall("get", "/store/banners", undefined, params),
    get: (id: string) => apiCall("get", `/store/banners/${id}`),
    create: (data: any) => apiCall("post", "/store/banners", data),
    update: (id: string, data: any) =>
      apiCall("put", `/store/banners/${id}`, data),
    delete: (id: string) => apiCall("delete", `/store/banners/${id}`),
    toggleActive: (id: string) =>
      apiCall("patch", `/store/banners/${id}/toggle`),
    deleteImage: (publicId: string) =>
      apiCall("delete", `/store/banners/image/${publicId}`),
  },

  // Smart Banners (popup)
  smartBanners: {
    list: (params?: any) =>
      apiCall("get", "/store/smart-banners", undefined, params),
    get: (id: string) => apiCall("get", `/store/smart-banners/${id}`),
    create: (data: any) => apiCall("post", "/store/smart-banners", data),
    update: (id: string, data: any) =>
      apiCall("put", `/store/smart-banners/${id}`, data),
    delete: (id: string) => apiCall("delete", `/store/smart-banners/${id}`),
    toggleActive: (id: string) =>
      apiCall("patch", `/store/smart-banners/${id}/toggle`),
    getActive: () => apiCall("get", "/store/smart-banners/active"),
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

      const response = await managerApi.post("/upload", formData, config);
      return response.data;
    },

    delete: async (publicId: string) => {
      const headers: any = {};
      const token = localStorage.getItem("kx_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await managerApi.delete(
        `/upload/${encodeURIComponent(publicId)}`,
        { headers }
      );
      return response.data;
    },
  },

  // Product Questions (Q&A)
  questions: {
    list: (params?: any) =>
      apiCall("get", "/store/questions", undefined, params),
    create: (data: any) => apiCall("post", "/store/questions", data),
    update: (id: string, data: any) =>
      apiCall("patch", `/store/questions/${id}`, data),
    delete: (id: string) => apiCall("delete", `/store/questions/${id}`),
  },

  // Callback Requests
  callbackRequests: {
    list: (params?: any) =>
      apiCall("get", "/store/callback-requests", undefined, params),
    updateStatus: (id: string, status: string) =>
      apiCall("patch", `/store/callback-requests/${id}/status`, { status }),
    delete: (id: string) => apiCall("delete", `/store/callback-requests/${id}`),
    create: (data: any) => apiCall("post", "/store/callback-requests", data),
  },

  contactEnquiries: {
    create: (data: any) => apiCall("post", "/store/contact-enquiries", data),
    list: (params?: any) =>
      apiCall("get", "/store/contact-enquiries", undefined, params),
    get: (id: string) => apiCall("get", `/store/contact-enquiries/${id}`),
    answer: (id: string, answer: string) =>
      apiCall("patch", `/store/contact-enquiries/${id}/answer`, { answer }),
    archive: (id: string) =>
      apiCall("patch", `/store/contact-enquiries/${id}/archive`),
    delete: (id: string) => apiCall("delete", `/store/contact-enquiries/${id}`),
    updateStatus: (id: string, status: string) =>
      apiCall("patch", `/store/contact-enquiries/${id}/status`, { status }),
  },

  taxes: {
    list: (params?: any) => apiCall("get", "/store/taxes", undefined, params),
    get: (id: string) => apiCall("get", `/store/taxes/${id}`),
    create: (data: any) => apiCall("post", "/store/taxes", data),
    update: (id: string, data: any) =>
      apiCall("patch", `/store/taxes/${id}`, data),
    remove: (id: string) => apiCall("delete", `/store/taxes/${id}`),
  },
  promocodes: {
    list: (params?: any) =>
      apiCall("get", "/store/promocodes", undefined, params),
    get: (id: string) => apiCall("get", `/store/promocodes/${id}`),
    create: (data: any) => apiCall("post", "/store/promocodes", data),
    update: (id: string, data: any) =>
      apiCall("patch", `/store/promocodes/${id}`, data),
    remove: (id: string) => apiCall("delete", `/store/promocodes/${id}`),
  },
};

/**
 * Helper function to get current store ID
 * Useful for components that need to display store information
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
      "admin.storeId",
      "storeId",
      "currentStoreId",
      "selectedStoreId",
      "merchant.storeId",
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
 * This can be used when user switches stores
 */
export function setStoreId(storeId: string): void {
  localStorage.setItem("admin.storeId", storeId);
}

/**
 * Helper function to get store information
 * This will fetch store details using the current store ID
 */
export async function getCurrentStore(): Promise<any> {
  const storeId = await getStoreIdFromToken();
  if (!storeId) throw new Error("Store ID not found");

  const response = await managerApi.get(`/platform/stores/${storeId}`);
  return response.data;
}

/**
 * Refresh user token with updated store information
 * This should be called when store information changes
 */
export async function refreshUserToken(): Promise<{
  user: any;
  token: string;
}> {
  try {
    const profile = localStorage.getItem("kx_profile");
    if (!profile) {
      throw new Error("No user profile found");
    }

    const userProfile = JSON.parse(profile);
    const userId = userProfile.sub || userProfile._id;

    if (!userId) {
      throw new Error("No user ID found in profile");
    }

    const response = await managerApi.post("/auth/refresh-token", { userId });

    // Update localStorage with new token and profile
    localStorage.setItem("kx_token", response.data.token);

    // Create a comprehensive profile that includes store information
    const newProfile = {
      ...response.data.user,
      sub: response.data.user._id || response.data.user.id, // Ensure sub field is present
      storeId: response.data.user.storeId,
      stores: response.data.user.stores,
      role: response.data.user.role,
    };

    localStorage.setItem("kx_profile", JSON.stringify(newProfile));

    // Update the default authorization header
    managerApi.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${response.data.token}`;

    return response.data;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    throw error;
  }
}

export default ManagerAPI;
