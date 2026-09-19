# Install the Novara website update

1. Download and extract `Novara-Academy-Update.zip` on your computer.
2. Inside it, find `Novara-academy-cloudflare`. It contains `novara-academy` with the complete updated code.
3. Open your GitHub repository at its top level (the Code tab).
4. Choose Add file > Upload files. Drag the extracted `Novara-academy-cloudflare` folder into the upload area. Keep its folders intact. Do not upload from inside the ZIP or drag files one by one.
5. Commit the update to main. Matching file paths replace old versions. You do not need to delete the repository or recreate the Cloudflare Worker.
6. Cloudflare should build the new commit automatically. Keep Root directory set to `Novara-academy-cloudflare/novara-academy`, build `pnpm run build`, deploy `pnpm run deploy`.
7. Retain the existing OPENAI_API_KEY secret. This code keeps LIVE_AI_ENABLED=true. No key is included in the ZIP.
8. After deployment succeeds, refresh the website and test Country of school, Gap year, AP/A Level selections, Edit profile and dark mode. Generate one real AI assessment and review its source links.

## Included fixes

- Searchable school countries, with keyboard and mouse selection.
- Gap year / graduated option supported by both form and AI endpoint.
- Searchable AP and A Level subjects with selectable scores, multiple rows and duplicate checks.
- Section-based profile editing. Existing answers remain populated. Cancel restores the previous profile and report.
- Dark-mode logo styling removes the visible white rectangle and makes the artwork light.
- Real optional email send/verify code, with expired-code handling, attempt limits and resend limits.
- Updated README and technical reference, with six offline regression tests.

## Email setup still required

The OpenAI key does not send emails. This update includes a Resend + D1 verification flow, but real delivery requires those services. Follow the optional email setup in README.md. Until configured, visitors can get an assessment without email and no broken send-code button appears.

## Verification

Production build, TypeScript and six offline tests pass. Live AI and real email delivery require a test on your deployed account. Updated browser visual checks remain to be completed after deployment because the local preview could not be reached from the browser environment.

The update is prepared locally. It has not been pushed to your private GitHub repository or deployed by this chat.
