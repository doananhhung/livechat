
import { useState, useEffect } from 'react';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useTranslation } from "react-i18next";

const formatConversationTime = (date: Date | string, t: any): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isToday(dateObj)) {
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: vi });
  }

  if (isYesterday(dateObj)) {
    return t("time.yesterday", { time: format(dateObj, 'HH:mm') });
  }

  if (isThisWeek(dateObj)) {
    return format(dateObj, 'EEEE HH:mm', { locale: vi });
  }

  return format(dateObj, 'dd/MM HH:mm');
};

export const useTimeAgo = (date: Date | string) => {
  const { t } = useTranslation();
  const [timeAgo, setTimeAgo] = useState(() => formatConversationTime(date, t));

  useEffect(() => {
    // Immediately update when date changes
    setTimeAgo(formatConversationTime(date, t));
    
    // Also set up interval for periodic updates (e.g., "5 minutes ago" → "6 minutes ago")
    const interval = setInterval(() => {
      setTimeAgo(formatConversationTime(date, t));
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, [date, t]);

  return timeAgo;
};
