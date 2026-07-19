import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client — used by Server Components, Server Actions, and Route
 * Handlers. Reads/writes the session via cookies, per @supabase/ssr's Next.js App Router
 * pattern. Session refresh itself happens in middleware.ts.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component (not a Server Action/Route Handler) — the
            // middleware's session refresh already covers this, safe to ignore.
          }
        },
      },
    }
  );
}
