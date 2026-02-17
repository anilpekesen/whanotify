import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

/**
 * OAuth handler - tüm /auth/* path'lerini karşılar.
 * authenticate.admin(request) aşağıdakileri otomatik yapar:
 * - Yeni install: OAuth flow başlatır, Shopify'a redirect eder
 * - Callback: authorization code → access token exchange
 * - Token'ı SQLite session'a kaydeder
 * - /app'e redirect eder
 */
export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  return null;
}
