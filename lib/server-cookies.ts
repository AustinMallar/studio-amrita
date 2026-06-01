import "server-only";

/** Next.js only allows `cookies().set` / `delete` in Route Handlers and Server Actions. */
export function isReadonlyCookiesError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("Cookies can only be modified in a Server Action or Route Handler")
  );
}
