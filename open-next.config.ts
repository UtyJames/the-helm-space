import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Cloudflare provides pg-cloudflare at runtime via nodejs_compat; mark it external so esbuild doesn't try to bundle it.
  external: ["pg-cloudflare", "pg-native"],
});
