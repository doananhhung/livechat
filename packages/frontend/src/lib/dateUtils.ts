import {
  formatDistanceToNow,
  format,
  isToday,
  isYesterday,
  isThisWeek,
} from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Format timestamp for conversation list
 * - "5 phút trước" for recent messages
 * - "Hôm qua 14:30" for yesterday
 * - "23/10 10:15" for older
 */
export const formatConversationTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isToday(dateObj)) {
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: vi });
  }

  if (isYesterday(dateObj)) {
    return `Hôm qua ${format(dateObj, "HH:mm")}`;
  }

  if (isThisWeek(dateObj)) {
    return format(dateObj, "EEEE HH:mm", { locale: vi });
  }

  return format(dateObj, "dd/MM HH:mm");
};

/**
 * Format timestamp for message bubbles
 * - "14:30" for today
 * - "Hôm qua 14:30" for yesterday
 * - "23/10/2024 14:30" for older
 */
export const formatMessageTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isToday(dateObj)) {
    return format(dateObj, "HH:mm");
  }

  if (isYesterday(dateObj)) {
    return `Hôm qua ${format(dateObj, "HH:mm")}`;
  }

  return format(dateObj, "dd/MM/yyyy HH:mm");
};

/**
 * Get date group label
 * - "Hôm nay"
 * - "Hôm qua"
 * - "Tuần này"
 * - Date string for older
 */
export const getDateGroupLabel = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isToday(dateObj)) {
    return "Hôm nay";
  }

  if (isYesterday(dateObj)) {
    return "Hôm qua";
  }

  if (isThisWeek(dateObj)) {
    return "Tuần này";
  }

  return format(dateObj, "dd/MM/yyyy");
};
