/**
 * Format angka nominal ke format mata uang Rupiah
 * Contoh: 15000000 -> "Rp 15.000.000"
 */
export function formatCurrency(
  amount: number,
  currency: string = "IDR",
  options?: { showCurrencyPrefix?: boolean }
): string {
  const prefix =
    options?.showCurrencyPrefix !== false
      ? currency === "IDR"
        ? "Rp "
        : `${currency} `
      : "";
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat(
    currency === "IDR" ? "id-ID" : "en-US",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }
  ).format(absAmount);

  return `${prefix}${formatted}`;
}

/**
 * Format tanggal cerdas untuk aktivitas transaksi
 */
export function formatRelativeDate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeString = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `Hari ini, ${timeString}`;
  }

  if (isYesterday) {
    return `Kemarin, ${timeString}`;
  }

  const isSameYear = date.getFullYear() === now.getFullYear();
  const dateString = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    ...(isSameYear ? {} : { year: "numeric" }),
  });

  return `${dateString}, ${timeString}`;
}
