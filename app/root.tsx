import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { addDocumentResponseHeaders } from "~/shopify.server";

export const links: LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
];

/**
 * Root loader - Content-Security-Policy headerlarını ekler.
 * Shopify'ın app'i Admin iframe'inde göstermesine izin verir.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  addDocumentResponseHeaders(request, new Headers());
  return json({});
}

/**
 * Root layout - Tüm sayfaların temel HTML wrapper'ı.
 *
 * NOT: Polaris AppProvider ve Frame burada YOK.
 * Bunlar app.tsx (authenticated layout) içinde tanımlandı.
 * root.tsx sadece auth flow ve webhook route'larına hizmet eder.
 */
export default function App() {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
