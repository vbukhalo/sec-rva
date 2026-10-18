This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Live Translation

Listeners open `/listen` on their phones. The translator broadcasts from `/translate/broadcast`. Audio is relayed through [LiveKit Cloud](https://cloud.livekit.io) over WebRTC (sub-second latency).

### Setup

1. Create a LiveKit Cloud project and generate an API key under **Settings → API Keys**.
2. Add these to `.env.local` and to Netlify (**Site configuration → Environment variables**):

   ```
   LIVEKIT_URL=wss://<your-project>.livekit.cloud
   LIVEKIT_API_KEY=...
   LIVEKIT_API_SECRET=...
   BROADCAST_PASSCODE=...   # the translator enters this to go live
   ```

3. Redeploy after changing environment variables.

### On Sunday

- **Translator:** open `/translate/broadcast`, tap **Test microphone**, check the level meter, enter the passcode and tap **Go live**. Keep the page open and the screen on until the service ends.
- **Listeners:** open `/listen` and tap play. Listeners can only join while the translator is live. If they tap play early, the page checks every 15 seconds without joining and connects when the broadcast starts.
- **End broadcast** disconnects every listener immediately. If the translator drops off without ending, listeners are disconnected after 60 seconds.

The free LiveKit plan includes 5,000 participant-minutes per month. Every connected listener and the translator counts, but listeners waiting for the broadcast to start don't. Check usage in the LiveKit dashboard.
