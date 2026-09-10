# Illustrated Shelley Station

## Changes
- Theme-matched, AI-generated 3D artwork: one hero scene and 18 category/task illustrations, optimized to WebP. Every catalog agent and prompt receives artwork through a shared category resolver; illustrations are shared within categories, not 222 individually generated portraits.
- Illustrated banners for all workspace views, asset previews, empty states, and public workflow shares.
- Pointer-responsive perspective tilt, floating annotations, image hover details, persisted motion control, and reduced-motion support.
- Six repo-optimization prompts: security hardening, design polish, bug finder, performance, accessibility, and test coverage. They include repository/branch/scope context, bounded review, verification requirements, and approval guardrails.
- Quick prompts appear in the searchable/filterable library, can be copied or customized and saved, and select Coding mode when used.
- Restored missing Inter font assets and updated the framework dependencies to patched versions.

## Runtime
Use the existing PostgreSQL setup (`DATABASE_URL` and `npx drizzle-kit push`). Existing Drizzle persistence, workspace isolation, versioning, and sharing are preserved. No new database schema is required beyond the repository's existing schema.

Live agent execution still requires the existing `SHELLEY_API_URL` server connection and its model credentials. The app does not simulate completed runs when no model server is configured. Prompts can be read, copied, customized, and saved without one.

## Artwork
Generated with the image tool available in this environment. That tool does not expose a model selector, so these assets are **not claimed to use GPT image 2.5**. Source contact sheets are in `public/images`; `node scripts/prepare-art.mjs` reproduces the optimized assets. Typography: Inter, under the included font license.

## Verification
```sh
npx next typegen
npm exec tsc -- --noEmit --pretty false
npm run build
# Against the running production preview, after applying the existing schema:
node scripts/illustrated-smoke.mjs
```
The smoke test covers navigation, quick-prompt instructions and Coding mode, filters, database persistence, public sharing, mobile overflow, reduced motion, persisted animation controls, and browser errors. Screenshots are written to ignored `artifacts/`.

Go and Vue sources are unchanged. Live-model execution requires a separately configured Shelley server and is not part of the standalone smoke test.
