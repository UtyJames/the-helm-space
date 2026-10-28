This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Bachs payments

The booking form creates a hosted Bachs checkout. A signed `collection.succeeded` or paid `checkout.completed` webhook records the payment; the return page only reads booking status and never treats the redirect as proof of payment.

1. Start with a Bachs sandbox secret key and the sandbox API URL from `.env.example`.
2. In the Bachs Developer Portal, add an HTTPS webhook endpoint pointing to `https://<your-domain>/api/webhooks/bachs`, subscribe to `collection.succeeded` and `checkout.completed`, then copy that endpoint's signing secret.
3. Configure `BACHS_SECRET_KEY`, `BACHS_API_URL`, `BACHS_WEBHOOK_SECRET`, and `NEXT_PUBLIC_APP_URL` in the local environment or deployment secret settings. Keep the API key and webhook signing secret private.
4. For production, use the production API URL with a live key and the production webhook endpoint's signing secret. Do not mix sandbox keys with production URLs or vice versa.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
