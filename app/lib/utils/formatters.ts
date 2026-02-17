import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd MMMM yyyy", { locale: tr });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd MMMM yyyy HH:mm", { locale: tr });
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: tr });
}

export function formatCurrency(amount: number, currency: string = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("tr-TR").format(num);
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("90") && cleaned.length === 12) {
    return `+90 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
  }
  return `+${cleaned}`;
}

export function truncate(str: string, length: number = 50): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}
