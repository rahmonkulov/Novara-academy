# Novara Academy — Cloudflare edition

Upload the CONTENTS of this folder to the root of your GitHub repository (not the zip itself).

Cloudflare Workers Git build settings:
- Worker name: novara-academy
- Build command: pnpm run build
- Deploy command: pnpm run deploy
- Root directory: /
- Build environment: NODE_VERSION=22.16.0

No API keys are included. After deployment add OPENAI_API_KEY as a runtime Secret under Worker Settings / Variables and Secrets. Never add it to GitHub or a NEXT_PUBLIC variable.

Live AI is intentionally disabled initially. Before enabling LIVE_AI_ENABLED=true, protect the deployment with Cloudflare Access (including the workers.dev address) or implement authenticated, rate-limited access. This export does not inherit the private ChatGPT Site gate. Change LIVE_AI_ENABLED in wrangler.json to true only once access protection is verified; Git deployments reapply vars.

AI reports require an active OpenAI API account and model access. The backend defaults to gpt-5.5; OPENAI_MODEL can override it with a compatible Responses/web-search model. Real AI requests and recommendation accuracy have NOT been validated. Sourced qualitative assessments are not admission probabilities.

Email verification/delivery and Full Support enrollment are not connected. Demo university figures are illustrative. The quiz, demo results, comparisons, local roadmap tracking and printable reports are implemented.

Development: pnpm install --frozen-lockfile; pnpm run dev.
