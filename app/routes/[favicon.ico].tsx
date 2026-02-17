import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  // Serve favicon.ico from public directory
  try {
    const faviconPath = join(process.cwd(), "public", "favicon.ico");
    const favicon = readFileSync(faviconPath);
    return new Response(favicon, {
      headers: {
        "Content-Type": "image/x-icon",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
