# Novara Academy

Personal university guidance for LOCUS Startup Hackathon 2026, Case 02: Admission Journey.

## Problem and audience

International undergraduate applicants, including students in grades 9–12 and gap-year applicants, need to connect academic interests, exam results and financial constraints to a shortlist and concrete next actions. Scattered university pages alone do not explain what to do next.

## Solution and user journey

The website collects a student profile, explains university options, compares at least two choices and provides a personal roadmap with progress tracking. Students can edit individual sections and request a new assessment. Searchable school countries and AP/A Level subjects reduce free-text entry.

The product has two explicitly different result modes:

- **Live AI assessment:** the server sends the consented academic profile to OpenAI and requests research on official university domains. It validates the returned structure and source references. Categories express qualitative judgments, not admission probabilities.
- **Demo matching:** a deterministic preference score and illustrative cost data let reviewers inspect the interface without paying for an API. Demo results are labeled and are never presented as a successful AI response.

Website: https://novara-academy.abduraimrahmonkulov0.workers.dev
Repository: https://github.com/rahmonkulov/Novara-academy

The repository must be accessible to judges. The owner must verify that access before submission.

## Stack and architecture

- React 19, TypeScript, Next.js App Router conventions hosted through Vinext and Vite.
- Cloudflare Workers serves the application and its server routes.
- OpenAI Responses API with the `web_search` tool. Default model: `gpt-5.5`, overridable with `OPENAI_MODEL` when the account has access to a compatible model.
- Zod validates profiles and AI reports.
- Tailwind CSS, Radix/shadcn components and Lucide icons provide general UI primitives. Inter is bundled with its license.
- Browser localStorage saves profiles and reports only after the user accepts local saving.
- Optional Resend email delivery and Cloudflare D1 store temporary verification challenges and request limits.

`app/page.tsx` manages questionnaire, profile editing and demo views. `app/data.ts` holds the illustrative university catalogue, validation and demo ranking. `app/profile-controls.tsx` contains searchable selectors. `app/api/match/route.ts` handles AI research. `app/ai-results.tsx` displays sourced results. `app/api/email/route.ts` handles optional verification.

The browser calls the server. Only the server calls OpenAI or Resend. API secrets never belong in browser code or the repository.

## Local development

Use Node 22.16 or newer and the pnpm version declared in package.json.

```sh
pnpm install --frozen-lockfile
pnpm run dev
pnpm run typecheck
pnpm run test
pnpm run build
```

## Existing Cloudflare deployment

This repository stores the application inside `Novara-academy-cloudflare/novara-academy`.

| Setting | Value |
| --- | --- |
| Worker | novara-academy |
| Root directory | Novara-academy-cloudflare/novara-academy |
| Build command | pnpm run build |
| Deploy command | pnpm run deploy |
| Production branch | main |
| Build variable | NODE_VERSION=22.16.0 |

This update sets `LIVE_AI_ENABLED` to `true` in wrangler.json so a Git deployment will keep AI enabled. AI calls still require a valid runtime `OPENAI_API_KEY` secret, API billing, and model access. Retain the existing secret in Cloudflare. Do not paste it into GitHub. To pause AI, set the flag to `false` in both the dashboard and source configuration.

The public AI endpoint does not yet have per-user authentication or a durable AI spending limit. Keep initial testing small and monitor usage. Email verification is optional and is not an authentication gate for AI.

## Optional real email verification

Email is **not required** to obtain an assessment. When the service is unavailable, the UI hides the send-code controls and explains that users can continue. No fake code or success state is used.

To activate actual sending:

1. Configure a sender domain in Resend. The default test sender cannot deliver to arbitrary testers. Use a sender on a domain verified in your account.
2. In Cloudflare, create a D1 database named `novara-email`.
3. Run the SQL from `migrations/0001_email.sql` in that database's SQL console, or use Wrangler's D1 migration commands.
4. Add a D1 binding to this Worker with the exact variable name `EMAIL_DB` and select the database.
5. Add runtime Secret `RESEND_API_KEY` and runtime variable `EMAIL_FROM` with the authorized sender, e.g. `Novara Academy <admissions@your-verified-domain>`.
6. Keep the D1 binding in wrangler.json for subsequent Git deployments. Add a `d1_databases` array with `binding: "EMAIL_DB"`, `database_name: "novara-email"`, the actual `database_id`, and `migrations_dir: "migrations"`. Never invent the database ID.
7. Deploy and request a code to an address you control. Verify receipt, the six-digit code, and resend behavior.

The server stores HMAC hashes of emails and codes, not plain codes. Challenges expire after ten minutes and allow five guesses. Atomic SQL counters limit sends to one per email per minute, five per email per hour, and twenty per IP per hour. Successful verification deletes the challenge. Expired records are cleaned during subsequent sends. The API key is also the HMAC key, so rotating it invalidates outstanding challenges.

Verification confirms email ownership for the current UI session. It does not create a user account, authenticate requests, or send the assessment by email.

## Test scenario for judges

1. Open the website on desktop or mobile. Start a profile, or inspect the labeled example profile.
2. Search `United States` in Country of school and select it. Choose `Gap year / graduated` and enter the remaining school context.
3. Select up to three majors and enter valid scores or `N/A`.
4. Add AP Calculus BC with grade 5 and an A Level Mathematics grade from the selectors. Remove or complete any empty subject row.
5. Enter five activities (N/A is allowed), optional honors/essay, learning preferences, dream schools and budget. Accept the required consent.
6. Consent separately to AI processing and choose Generate my AI assessment. If the API is unavailable, the page reports the error and preserves the answers. Choose demo matching explicitly only to examine demo behavior.
7. Inspect at least three recommendations. Open official sources. Compare at least two universities and mark a roadmap action complete.
8. Choose Edit profile. Open Budget & destinations directly, change a value, then Save & review profile. Select Review & update results and generate a fresh assessment. Existing answers remain populated.
9. Test light and dark themes. The dark header blends the supplied logo into the background.
10. With email configured, request and verify a code. Without it, verify that assessment remains accessible.

## Validation and known limits

- TypeScript and production build pass for this update.
- Offline email integration tests execute real SQLite statements with a mocked delivery provider. They check verification, reuse, expired codes, attempt limits, resend limits, origin rejection and missing configuration.
- Profile tests verify country selection, gap year and structured qualification validation.
- A live OpenAI assessment and real email delivery have **not** been verified in this workspace. The owner must test the deployed account before claiming either works end to end.
- Browser visual testing of the updated deployment remains required. The local preview could not be reached from the provided browser environment.
- The initial catalogue contains 16 universities. Its major tags, costs, style labels and demo fit numbers are illustrative, not verified admission facts.
- Official-source presence checks establish traceability, not the truth of every generated claim. Human review is necessary, especially for programme eligibility, language, deadlines and aid.
- Full Support enrollment, payment, calendar reminders and cross-device user accounts are not connected.
- AP/A Level subject lists are curated choices, not a guarantee of complete exam-board coverage. Existing free-text qualification results remain readable.

## Team and use of AI

Project lead: Abduraim Rahmonqulov. Product direction, branding and feature requirements came from the project owner. Code, debugging and documentation were developed with AI coding assistance. Add any other registered team members and their actual roles before submission. Do not claim a fabricated team or development history.

## Sources and reusable components

- Supplied official `LOCUS_Hackathon_2026_Case_2_Admission_Journey.pdf` and hackathon regulations.
- Each university's official admissions URL appears in `app/data.ts`. Live reports return retrieved official sources.
- OpenAI Responses API: https://platform.openai.com/docs/api-reference/responses
- Resend sending API: https://resend.com/docs/api-reference/emails/send-email
- Cloudflare Workers and D1: https://developers.cloudflare.com/workers/ and https://developers.cloudflare.com/d1/
- Country display names use runtime CLDR/Intl data and ISO country codes.
- User-supplied Novara Academy logo. Inter font license: `public/fonts/LICENSE.txt`.
- Reusable React UI primitives and libraries are declared in package.json and pnpm-lock.yaml. FreshMatch was a user-supplied functional reference. Novara uses its own visual styling and implements its own code.

## Submission

Submit through aistartify.com with participation code **LOCUSCASE2**. Include the working product URL, accessible GitHub repository with actual history, this README/technical reference, a demo video no longer than three minutes and a PDF presentation no longer than eight slides. The official case lists the deadline as 19 September 2026, 12:00 Astana time. Final code belongs in main before the deadline. Do not fabricate commits or timestamps.
