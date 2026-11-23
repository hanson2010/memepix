# Tasks

## 1. Upgrade to Auth.js v5 (GitHub only, same behavior)

- [x] 1.1 Install `next-auth@5` beta pinned to an exact version and verify `npm ls next-auth` shows it
- [ ] 1.2 Rewrite `src/lib/auth.ts` for v5 (`NextAuth({...})` exporting `handlers`, `auth`, `signIn`, `signOut`; `trustHost: true`; `secret: secrets.nextauthSecret`), drop the GitHub `issuer` workaround, re-export `handlers` from `src/app/api/auth/[...nextauth]/route.ts`, and make `getAuthSession()` call `auth()`; verify `npx tsc --noEmit` passes and GitHub sign-in and sign-out work locally
- [x] 1.3 Update tests that mock `@/lib/session` or `next-auth` for v5 and verify `npm test` passes

## 2. Google configuration

- [x] 2.1 Add `GOOGLE_CLIENT_SECRET` to `src/lib/secrets.ts`, `GOOGLE_CLIENT_ID` as a setting in `cloudbuild.yaml`, and both to `.env.local.example`; verify `npx tsc --noEmit` passes
- [x] 2.2 Document creating the Google OAuth client (redirect URI `<NEXTAUTH_URL>/api/auth/callback/google`) and the updated `memepix-app-secrets` JSON in README; verify the documented `gcloud` command matches `src/lib/secrets.ts` names

## 3. Account store

- [x] 3.1 Add `users`, `identities`, `pendingMerges` and `merges` collection helpers to `src/lib/firebase.ts`, and `User`, `Identity` types to `src/types`; verify `npx tsc --noEmit` passes
- [x] 3.2 Implement verified-email extraction: Google from `email_verified`, GitHub from the verified primary address in `GET /user/emails`; verify unit tests cover verified, unverified and missing emails for both
- [x] 3.3 Implement sign-in resolution in `src/lib/accounts.ts` as a transaction (existing identity, automatic link to exactly one account by verified email, otherwise a new account), updating identity email, name and image; verify unit tests cover each `account-linking` "Automatic linking" scenario and the `user-auth` "One account per person" scenarios
- [x] 3.4 Implement claiming unowned memes when an identity with a verified email is added to an account; verify unit tests cover the three "Existing memes keep their owners" scenarios
- [x] 3.5 Verify the `identities` (`email`, `emailVerified`) query in 3.3 runs against Firestore without an index error (it does: equality filters need no composite index, so README lists none for it)

## 4. Sign-in wiring and pages

- [x] 4.1 Wire the `signIn`, `jwt` and `session` callbacks to the account store: the token carries `accountId`, `session.user.id` exposes it (with type augmentation), and `jwt` returns `null` when `users/{accountId}` no longer exists; verify unit tests cover a normal sign-in and a removed account
- [x] 4.2 Add the Google provider, and an `/auth/signin` page listing "Sign in with Google" then "Sign in with GitHub" with an error message for `?error=`; point Auth.js `pages.signIn` and `pages.error` to it; verify a component test checks the button order and the error message
- [ ] 4.3 Change `AuthButton` to link to `/auth/signin` when signed out and offer "Account" and "Sign out" when signed in; verify Google and GitHub sign-in work locally and the header shows name and avatar

## 5. Ownership by account

- [x] 5.1 Store `ownerId` and the lowercased `uploadedBy` on new memes and return `ownerId` from the memes API; verify the meme-service test checks both fields
- [x] 5.2 Check `ownerId === session.user.id` in PATCH and DELETE of `/api/memes/[id]`; verify route tests cover owner, non-owner (403) and signed out (401)
- [x] 5.3 Compare `ownerId` with `session.user.id` in `src/app/meme/[id]/client-page.tsx` and `src/components/MemeDetail.tsx`; verify a component test shows edit controls only to the owner
- [x] 5.4 Write `ownerId` on upload records and count by `ownerId` in `/api/upload` and `/api/config`; add the `uploads` (`ownerId`, `timestamp`) index command to README Deploy; verify the upload route test covers the captcha threshold across two identities of one account
- [x] 5.5 Add an idempotent script that lowercases `uploadedBy` on all memes, with a dry-run mode; document it in README Deploy and verify a dry run lists the expected changes against Firestore

## 6. Linking by hand

- [x] 6.1 Add `POST /api/account/link` that sets a signed, httpOnly, single-use `memepix-link` cookie with the session's account ID, valid 10 minutes; verify unit tests cover signing, expiry and a tampered cookie
- [x] 6.2 Handle a link intent in the `signIn` callback: add an unlinked identity, report an already-linked identity, or write a pending merge, then redirect to `/account` with the result and keep the current session; verify unit tests cover all three outcomes and a cancelled link
- [ ] 6.3 Add the `/account` page listing identities with provider and email, "Link Google" and "Link GitHub", and the linked or already-linked messages; verify linking a second provider with a different email works locally

## 7. Merge

- [x] 7.1 Add `GET` and `DELETE /api/account/merges/[id]` returning the other account's identities and meme count, or cancelling; both only for the survivor account; verify route tests cover another account's request (403) and an expired merge
- [x] 7.2 Add `POST /api/account/merges/[id]` that moves identities, memes and uploads in batches, writes the `merges` record and deletes the other account; verify unit tests cover a full merge, retrying after a partial failure, and that moved memes keep `uploadedBy`
- [ ] 7.3 Add the merge confirmation to `/account` with Confirm and Cancel; enable TTL on `pendingMerges.expiresAt` in README Deploy; verify locally that confirming moves memes and the merged-away account's other browser session is signed out

## 8. Unlinking

- [x] 8.1 Add `DELETE /api/account/identities/[id]` that deletes the identity only if it belongs to the session's account and is not the last one; verify route tests cover success, last identity (refused) and another account's identity (refused)
- [ ] 8.2 Show Unlink per identity on `/account` only when the account has more than one; verify locally that an unlinked identity with a different email gets a new account on its next sign-in

## 9. Integration checks

- [ ] 9.1 Walk through the `user-auth` and `account-linking` specs locally with real Google and GitHub accounts and verify each scenario's outcome
- [x] 9.2 Verify `npx tsc --noEmit`, `npm run lint` (no new problems), `npm test` and `npm run build` all pass

## Workflow follow-up

- Deploy following design.md (Migration Plan): Google OAuth client, new `memepix-app-secrets` version, indexes, `pendingMerges` TTL, the `uploadedBy` script, then push to `main`.
- Archive the change after it has been deployed and checked in production.
