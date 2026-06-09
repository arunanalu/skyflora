import 'server-only';
import { unstable_cache } from 'next/cache';

// Cache desabilitado quando DISABLE_API_CACHE=true (recomendado para dev local).
// Em produção, TTL é eterno — a rota POST /api/revalidate é a única fonte da verdade
// para invalidação, acionada pelo webhook do ETL via revalidateTag().
const CACHE_DISABLED = process.env.DISABLE_API_CACHE === 'true';

export function withCache<T>(
  fn: () => Promise<T>,
  keys: string[],
  tags: string[],
): Promise<T> {
  if (CACHE_DISABLED) return fn();
  return unstable_cache(fn, keys, { revalidate: false, tags })();
}
