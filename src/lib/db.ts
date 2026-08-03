import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Neon over HTTP, not a TCP pool.
 *
 * Every query this app makes is a one-shot: "is this subscriber entitled",
 * "consume this login token", "save this position". That is exactly the shape
 * the HTTP driver exists for, and it sidesteps the sharpest edge of
 * Postgres-on-serverless entirely — there are no connections to pool, so there
 * is no pooler to run and no connection storm when a function scales out.
 *
 * Server-only. Never import this from a "use client" module: DATABASE_URL
 * carries the password.
 */

let cached: NeonQueryFunction<false, false> | null = null;

/**
 * Resolved lazily rather than at module load, so `next build` — which imports
 * every route to collect page data — does not need the database to exist.
 * Routes check `dbConfigured()` first and answer 503, the same shape
 * publish/route.ts uses for its own missing env vars.
 */
export function db(): NeonQueryFunction<false, false> {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  cached = neon(url);
  return cached;
}

export const dbConfigured = () => Boolean(process.env.DATABASE_URL);
