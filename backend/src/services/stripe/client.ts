/**
 * Cliente mínimo da API REST do Stripe (form-encoded), sem SDK.
 * `fetchImpl` é injetável para os testes nunca falarem com a rede.
 */

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body?: string }) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<any>;
}>;

export class StripeApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'StripeApiError';
  }
}

/** Codifica objetos aninhados no formato do Stripe: a[b][0][c]=v */
export function encodeStripeParams(params: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item !== null && typeof item === 'object') {
          out.push(...encodeStripeParams(item as Record<string, unknown>, `${name}[${index}]`));
        } else {
          out.push(`${encodeURIComponent(`${name}[${index}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else if (typeof value === 'object') {
      out.push(...encodeStripeParams(value as Record<string, unknown>, name));
    } else {
      out.push(`${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`);
    }
  }
  return out;
}

export async function stripePost<T = any>(
  secretKey: string,
  path: string,
  params: Record<string, unknown>,
  fetchImpl: FetchLike = (globalThis as any).fetch as FetchLike
): Promise<T> {
  const response = await fetchImpl(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: encodeStripeParams(params).join('&'),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new StripeApiError(data?.error?.message || `Stripe respondeu ${response.status}`, response.status);
  }
  return data as T;
}
