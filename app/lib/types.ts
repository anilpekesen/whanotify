// ============================================
// Store Types
// ============================================
export interface Store {
  id: number;
  shopify_domain: string;
  shopify_store_id: string;
  store_name: string;
  email: string | null;
  currency: string;
  timezone: string;
  is_active: boolean;
  shopify_installed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Relations (eager loaded)
  whatsapp_account?: WhatsappAccount;
  subscription?: Subscription;
  notification_templates?: NotificationTemplate[];
}

export interface StoreStats {
  total_notifications: number;
  sent_this_month: number;
  failed_this_month: number;
  success_rate: number;
  by_type: Record<string, number>;
}

// ============================================
// Subscription Types
// ============================================
export type SubscriptionPlan = "free" | "starter" | "professional" | "enterprise";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "paused";

export interface Subscription {
  id: number;
  store_id: number;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  monthly_message_limit: number;
  messages_sent_this_month: number;
  price: number;
  billing_cycle: string;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// WhatsApp Types
// ============================================
export interface WhatsappAccount {
  id: number;
  store_id: number;
  business_account_id: string;
  phone_number_id: string;
  phone_number: string;
  is_verified: boolean;
  is_active: boolean;
  webhook_fields: string[];
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Notification Template Types
// ============================================
export type NotificationType =
  | "order_placed"
  | "order_processing"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled";

export interface NotificationTemplate {
  id: number;
  store_id: number;
  type: NotificationType;
  name: string;
  content: string;
  is_active: boolean;
  is_default: boolean;
  variables: string[];
  created_at: string;
  updated_at: string;
}

// ============================================
// Notification Log Types
// ============================================
export type NotificationLogStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export interface NotificationLog {
  id: number;
  store_id: number;
  template_id: number;
  shopify_order_id: string;
  shopify_order_number: string;
  customer_phone: string;
  customer_name: string;
  notification_type: NotificationType;
  message_content: string;
  status: NotificationLogStatus;
  whatsapp_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// API Response Types
// ============================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StoreListResponse {
  success: boolean;
  stores: Store[];
}

export interface StoreShowResponse {
  success: boolean;
  store: Store;
}

export interface StoreStatsResponse {
  success: boolean;
  stats: StoreStats;
}

export interface SubscriptionResponse {
  success: boolean;
  subscription: Subscription;
}

export interface WhatsappAccountResponse {
  success: boolean;
  account: WhatsappAccount;
}

// ============================================
// Form Input Types
// ============================================
export interface StoreFormData {
  shopify_domain: string;
  shopify_store_id: string;
  shopify_access_token: string;
  store_name: string;
  email?: string;
  currency?: string;
  timezone?: string;
}

export interface WhatsappConfigFormData {
  store_id: number;
  business_account_id: string;
  phone_number_id: string;
  phone_number: string;
  access_token: string;
}

export interface TemplateFormData {
  name: string;
  content: string;
  is_active: boolean;
}
