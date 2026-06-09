import 'server-only';
import { unstable_cache } from 'next/cache';

// Cache desabilitado quando DISABLE_API_CACHE=true (recomendado para dev local).
// Em produção, a variável deve estar ausente — dados são cacheados por REVALIDATE_SECONDS.
const CACHE_DISABLED = process.env.DISABLE_API_CACHE === 'true';
const REVALIDATE_SECONDS = 3600; // 1 hora

/**
 * Envolve `fn` com o Data Cache do Next.js (unstable_cache).
 * - `keys`: identificadores únicos da entrada no cache (ex: ['climate-state', '12', '2024'])
 * - `tags`: tags para revalidação sob demanda via revalidateTag()
 */
export function withCache<T>(
  fn: () => Promise<T>,
  keys: string[],
  tags: string[],
): Promise<T> {
  if (CACHE_DISABLED) return fn();
  return unstable_cache(fn, keys, { revalidate: REVALIDATE_SECONDS, tags })();
}
