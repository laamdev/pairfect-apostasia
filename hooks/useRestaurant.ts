import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

/** Slug del restaurante al que está fijada esta app single-tenant. */
export const RESTAURANT_SLUG =
  process.env.NEXT_PUBLIC_RESTAURANT_SLUG ?? "la-apostasia";

/**
 * Resuelve el único restaurante de esta app (single-tenant) a partir del slug
 * configurado en `NEXT_PUBLIC_RESTAURANT_SLUG`.
 *
 * Estados:
 * - `undefined` → cargando
 * - `null` → el restaurante no existe todavía (ejecuta el seed)
 * - objeto → restaurante con `_id`, `name`, `slug`, `description`, `logoUrl`
 */
export function useRestaurant() {
  return useQuery(api.restaurants.getCurrent, { slug: RESTAURANT_SLUG });
}
