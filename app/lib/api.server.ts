// Server-only API client (.server.ts - never bundled to client)
import type {
  Store,
  Subscription,
  WhatsappAccount,
  NotificationTemplate,
  StoreFormData,
  WhatsappConfigFormData,
  SubscriptionPlan,
  StoreListResponse,
  StoreShowResponse,
  StoreStatsResponse,
  SubscriptionResponse,
  WhatsappAccountResponse,
  ApiResponse,
} from "./types";

const API_URL = process.env.API_URL || "http://localhost:8000/api";

// ============================================
// Base request helper
// ============================================
interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || `API error: ${response.status}`);
  }

  return data as T;
}

// ============================================
// Stores API
// ============================================
export const storesApi = {
  list: () => apiRequest<StoreListResponse>("/stores"),

  get: (id: number) => apiRequest<StoreShowResponse>(`/stores/${id}`),

  getByShopDomain: (shopDomain: string) =>
    apiRequest<StoreShowResponse>(
      `/stores/by-domain/${encodeURIComponent(shopDomain)}`
    ),

  uninstall: (shop: string) =>
    apiRequest<ApiResponse>("/stores/uninstall", {
      method: "POST",
      body: { shop },
    }),

  create: (data: StoreFormData) =>
    apiRequest<StoreShowResponse>("/stores", {
      method: "POST",
      body: data,
    }),

  update: (id: number, data: Partial<StoreFormData> & { is_active?: boolean }) =>
    apiRequest<StoreShowResponse>(`/stores/${id}`, {
      method: "PUT",
      body: data,
    }),

  delete: (id: number) =>
    apiRequest<ApiResponse>(`/stores/${id}`, { method: "DELETE" }),

  getStats: (id: number) => apiRequest<StoreStatsResponse>(`/stores/${id}/stats`),

  createTest: (data: { store_name: string; plan?: string }) =>
    apiRequest<StoreShowResponse>("/stores/test", {
      method: "POST",
      body: data,
    }),
};

// ============================================
// Subscriptions API
// ============================================
export const subscriptionsApi = {
  get: (storeId: number) =>
    apiRequest<SubscriptionResponse>(`/subscriptions/${storeId}`),

  create: (data: { store_id: number; plan: SubscriptionPlan }) =>
    apiRequest<SubscriptionResponse>("/subscriptions", {
      method: "POST",
      body: data,
    }),

  upgrade: (storeId: number, plan: SubscriptionPlan) =>
    apiRequest<SubscriptionResponse>(`/subscriptions/${storeId}/upgrade`, {
      method: "PUT",
      body: { plan },
    }),

  cancel: (storeId: number) =>
    apiRequest<ApiResponse>(`/subscriptions/${storeId}/cancel`, {
      method: "POST",
    }),
};

// ============================================
// WhatsApp API
// ============================================
export const whatsappApi = {
  get: (storeId: number) =>
    apiRequest<WhatsappAccountResponse>(`/whatsapp/account/${storeId}`),

  configure: (data: WhatsappConfigFormData) =>
    apiRequest<WhatsappAccountResponse>("/whatsapp/configure", {
      method: "POST",
      body: data,
    }),

  deactivate: (storeId: number) =>
    apiRequest<ApiResponse>(`/whatsapp/account/${storeId}/deactivate`, {
      method: "POST",
    }),

  testMessage: (data: { store_id: number; phone: string; message: string }) =>
    apiRequest<ApiResponse>("/whatsapp/test-message", {
      method: "POST",
      body: data,
    }),
};

// ============================================
// Templates API
// (Templates are embedded in store responses)
// ============================================
export const templatesApi = {
  // Get templates via store detail
  getForStore: async (storeId: number): Promise<NotificationTemplate[]> => {
    const response = await storesApi.get(storeId);
    return response.store.notification_templates || [];
  },
};

// ============================================
// Health Check
// ============================================
export const healthApi = {
  check: () => apiRequest<{ status: string; timestamp: string }>("/health"),
};
