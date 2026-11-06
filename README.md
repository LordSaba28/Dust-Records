# Dust Records

## Local

```bash
npm install
npm run dev
```

## Vercel

Import the GitHub repo. Leave the framework on Vite / Other.

- Install: `npm install`
- Build: `npm run build`

The build writes `.vercel/output`. Vercel uses that. Do not set an output folder.

Environment:

- `VITE_AUTH_ENABLED` = `false`
- Do not set `DATABASE_URL`. The site uses Supabase, already in the code.
- Optional: `XAI_API_KEY` so the chat answers. Without it, chat says the desk is offline.

Studio is `/access`. Label desk is `/admin`.
