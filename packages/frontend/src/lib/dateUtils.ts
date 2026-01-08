import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
} from "date-fns";
import i18n from "../i18n";

/**
 * Format timestamp for message bubbles
 */
export const formatMessageTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isToday(dateObj)) {
    return format(dateObj, "HH:mm");
  }

  if (isYesterday(dateObj)) {
    return i18n.t("time.yesterday", { time: format(dateObj, "HH:mm") });
  }

  return format(dateObj, "dd/MM/yyyy HH:mm");
};

/**
 * Get date group label
 * - Date string for older
 */
export const getDateGroupLabel = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isToday(dateObj)) {
    return i18n.t("date.today");
  }

  if (isYesterday(dateObj)) {
    return i18n.t("date.yesterday");
  }

  if (isThisWeek(dateObj)) {
    return i18n.t("date.thisWeek");
  }

  return format(dateObj, "dd/MM/yyyy");
};
