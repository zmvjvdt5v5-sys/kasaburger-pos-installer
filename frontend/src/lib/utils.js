import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status) {
  const colors = {
    pending: 'badge-warning',
    pending_approval: 'bg-orange-500 text-white',
    confirmed: 'badge-success',
    in_progress: 'badge-info',
    completed: 'badge-success',
    cancelled: 'badge-error',
    paid: 'badge-success',
    unpaid: 'badge-warning',
    overdue: 'badge-error',
    planned: 'badge-info',
    delivered: 'badge-success',
    processing: 'badge-info',
  };
  return colors[status] || 'badge-info';
}

export function getStatusText(status) {
  const texts = {
    pending: 'Beklemede',
    pending_approval: '⚠️ Onay Bekliyor',
    confirmed: 'Onaylandı',
    in_progress: 'Devam Ediyor',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edildi',
    paid: 'Ödendi',
    unpaid: 'Ödenmedi',
    overdue: 'Gecikmiş',
    planned: 'Planlandı',
    delivered: 'Teslim Edildi',
    processing: 'Onaylandı',
  };
  return texts[status] || status;
}
