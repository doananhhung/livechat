
import { useState, useEffect } from 'react';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { vi } from 'date-fns/locale';

const formatConversationTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isToday(dateObj)) {
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: vi });
  }

  if (isYesterday(dateObj)) {
    return `Hôm qua ${format(dateObj, 'HH:mm')}`;
  }

  if (isThisWeek(dateObj)) {
    return format(dateObj, 'EEEE HH:mm', { locale: vi });
  }

  return format(dateObj, 'dd/MM HH:mm');
};

export const useTimeAgo = (date: Date | string) => {
  const [timeAgo, setTimeAgo] = useState(() => formatConversationTime(date));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(formatConversationTime(date));
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, [date]);

  return timeAgo;
};
