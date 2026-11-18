# Novara Academy

University guidance for international applicants: a college-fit questionnaire with a personal roadmap, and a College Explorer with real admissions data for US colleges.

- Live site: https://novara-academy.abduraimrahmonkulov0.workers.dev
- The app lives in [`Novara-academy-cloudflare/novara-academy`](Novara-academy-cloudflare/novara-academy). Its README covers setup, architecture, secrets and deployment.

Cloudflare Workers Builds settings: root directory `Novara-academy-cloudflare/novara-academy`, build command `pnpm run build`, deploy command `pnpm run deploy`, production branch `main`, build variable `NODE_VERSION=22.16.0`.

Never commit API keys. Add them as runtime Secrets in the Cloudflare dashboard.
