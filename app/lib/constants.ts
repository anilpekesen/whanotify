import type { SubscriptionPlan, NotificationType, SubscriptionStatus } from "./types";

// ============================================
// Subscription Plans
// ============================================
export const PLANS: Record<
  SubscriptionPlan,
  { name: string; limit: number; price: number; description: string }
> = {
  free: {
    name: "Ücretsiz",
    limit: 100,
    price: 0,
    description: "Başlangıç için ideal, aylık 100 mesaj",
  },
  starter: {
    name: "Başlangıç",
    limit: 1000,
    price: 9.99,
    description: "Küçük işletmeler için, aylık 1.000 mesaj",
  },
  professional: {
    name: "Profesyonel",
    limit: 5000,
    price: 29.99,
    description: "Büyüyen işletmeler için, aylık 5.000 mesaj",
  },
  enterprise: {
    name: "Kurumsal",
    limit: 20000,
    price: 99.99,
    description: "Büyük işletmeler için, aylık 20.000 mesaj",
  },
};

// ============================================
// Notification Types (Turkish Labels)
// ============================================
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  order_placed: "Sipariş Alındı",
  order_processing: "Sipariş Hazırlanıyor",
  order_shipped: "Kargoya Verildi",
  order_delivered: "Teslim Edildi",
  order_cancelled: "İptal Edildi",
};

// Emoji for each notification type
export const NOTIFICATION_TYPE_EMOJI: Record<NotificationType, string> = {
  order_placed: "🛍️",
  order_processing: "⚙️",
  order_shipped: "📦",
  order_delivered: "✅",
  order_cancelled: "❌",
};

// ============================================
// Subscription Status (Turkish Labels + Polaris tones)
// ============================================
export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Aktif",
  trialing: "Deneme",
  past_due: "Gecikmiş",
  canceled: "İptal Edildi",
  paused: "Duraklatıldı",
};

export const STATUS_TONES: Record<
  SubscriptionStatus,
  "success" | "info" | "warning" | "critical" | "attention"
> = {
  active: "success",
  trialing: "info",
  past_due: "warning",
  canceled: "critical",
  paused: "attention",
};

// ============================================
// Template Variable Labels (for editor UI)
// ============================================
export const VARIABLE_LABELS: Record<string, string> = {
  customer_name: "Müşteri Adı",
  order_number: "Sipariş Numarası",
  order_total: "Sipariş Tutarı",
  tracking_number: "Kargo Takip No",
  store_name: "Mağaza Adı",
};

// All available template variables
export const ALL_TEMPLATE_VARIABLES = [
  "customer_name",
  "order_number",
  "order_total",
  "tracking_number",
  "store_name",
];
