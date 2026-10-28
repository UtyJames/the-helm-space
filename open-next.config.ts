// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { defineCloudflareConfig } = require("@opennextjs/cloudflare") as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cfg = defineCloudflareConfig({ external: ["pg-cloudflare", "pg-native"] });
export default cfg;