/** INR with Indian digit grouping (₹1,23,456). Implemented manually so it is identical on Hermes, iOS and Android. */
export function formatINR(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  const negative = n < 0;
  const abs = Math.abs(Math.round(n * 100) / 100);
  const [intPart, dec] = abs.toFixed(2).split('.') as [string, string];
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
  return `${negative ? '−' : ''}₹${grouped}${dec === '00' ? '' : `.${dec}`}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${formatDate(iso)}, ${h % 12 || 12}:${m} ${h < 12 ? 'am' : 'pm'}`;
}

export function timeAgo(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatDate(iso);
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
