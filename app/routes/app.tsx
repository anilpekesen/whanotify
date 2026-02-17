import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "~/shopify.server";

/**
 * Authenticated Layout Route
 *
 * Bu route /app/* altındaki tüm sayfaları sarar.
 * - AppProvider: Shopify App Bridge + Polaris entegrasyonu
 * - NavMenu: Shopify Admin sidebar'ında görünen navigasyon
 * - boundary.error / boundary.headers: iframe için zorunlu
 */
export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export async function loader({ request }: LoaderFunctionArgs) {
  // Her /app/* sayfasında authentication kontrolü yapılır
  await authenticate.admin(request);
  return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
}

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      {/* Shopify Admin sidebar'ındaki navigasyon menüsü */}
      <NavMenu>
        <Link to="/app" rel="home">
          Dashboard
        </Link>
        <Link to="/app/whatsapp">WhatsApp</Link>
        <Link to="/app/templates">Şablonlar</Link>
        <Link to="/app/subscription">Abonelik</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

/**
 * ErrorBoundary - @shopify/shopify-app-remix zorunlu kılar.
 * Shopify iframe context'inde hataları düzgün göstermek için gerekli.
 */
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

/**
 * headers - Content-Security-Policy ve diğer iframe headerları
 * Shopify Admin'de embedded çalışmak için zorunlu.
 */
export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
