import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (dateStr: string) => {
  return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: vi });
};

export const getProductImage = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `http://localhost:8081/uploads/${url}`;
};
