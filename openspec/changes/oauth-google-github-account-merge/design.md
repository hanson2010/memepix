# Design

## Context

See proposal.md (Why) and the `user-auth` and `account-linking` specs for the required behavior.

Current state:
- next-auth v4 with the GitHub provider and JWT sessions (`src/lib/auth.ts`), no database adapter. Server code calls `getServerSession` through `src/lib/session.ts`; client components use `useSession`, `signIn('github')` and `signOut()` from `next-auth/react`.
- There are no user records. A meme's owner is the `uploadedBy` email, compared case-insensitively in four places: the API in `src/app/api/memes/[id]/route.ts` (PATCH and DELETE), and the client in `src/app/meme/[id]/client-page.tsx` and `src/components/MemeDetail.tsx`.
- Upload records (`uploads`) are counted by email for the captcha threshold, and expire through Firestore TTL on `expiresAt`.
- Firestore is accessed through `firebase-admin`; settings are env vars from `cloudbuild.yaml`, secrets come from the `memepix-app-secrets` JSON (`src/lib/secrets.ts`).

## Goals / Non-Goals

**Goals:**
- Keep all account, identity and merge logic in one server module that can be unit-tested without a browser.
- One Firestore read per authenticated request at most, to detect accounts removed by a merge.
- Existing memes are claimed by their uploaders without an offline matching step.

**Non-Goals:**
- Email/password sign-in or providers other than Google and GitHub.
- Deleting an account, undoing a merge from the app, or an admin screen for accounts.
- Database sessions; sessions stay JWT cookies.

## Decisions

### 1. Auth.js v5 with JWT sessions and our own account store, no adapter
Upgrade to `next-auth@5` (beta, as in family-tree). `src/lib/auth.ts` exports `{ handlers, auth, signIn, signOut }` from `NextAuth({...})`; the route handler re-exports `handlers`; `getAuthSession()` becomes `auth()`. Client calls stay on `next-auth/react`. `trustHost: true` and `secret: secrets.nextauthSecret` as in family-tree. The secret keeps its name `NEXTAUTH_SECRET` so the `memepix-app-secrets` JSON needs no rename. Callback URLs stay `/api/auth/callback/{provider}`, so the GitHub OAuth app is unchanged.

Accounts and identities are written by our own code in the `signIn` and `jwt` callbacks.
- *Alternative: an Auth.js Firestore adapter with `allowDangerousEmailAccountLinking`.* Rejected: it links on email without checking that the provider verified it, cannot merge two existing accounts, and pushes us towards database sessions.

### 2. Data model
- `users/{accountId}`: `name`, `image`, `createdAt`, `updatedAt`. `accountId` is a random Firestore ID. It is not a provider's ID, because an account can have several providers.
- `identities/{provider}:{providerAccountId}`: `accountId`, `provider`, `providerAccountId`, `email` (lowercased), `emailVerified`, `name`, `image`, `linkedAt`. The deterministic document ID makes "an identity belongs to at most one account" a property of the store, and turns the sign-in lookup into a single read.
- `memes`: new `ownerId`. `uploadedBy` stays and is stored lowercased.
- `uploads`: new `ownerId`, replacing `email` for counting. `email` is still written for the rollback period.
- `pendingMerges/{id}`: `survivorId`, `otherId`, `identityId`, `expiresAt` (10 minutes), removed by Firestore TTL like `uploads` and `tags`.
- `merges/{id}`: `at`, `survivorId`, `removedId`, `identityIds`, `memeIds`. Kept indefinitely so a merge can be reversed by hand.

New composite index: `uploads` (`ownerId`, `timestamp`). The `identities` lookup by email and `emailVerified` uses only equality filters, which Firestore serves from its single-field indexes (checked against the project).

### 3. Sign-in resolution
In the `signIn` callback, without a link intent (see 5), inside a Firestore transaction:
1. Read `identities/{provider}:{id}`. If it exists, its account signs in; update its email, name and image.
2. Otherwise, if the email is verified, query identities with that email and `emailVerified == true`. If they belong to exactly one account, add the identity to that account.
3. Otherwise create a new `users` document and the identity.

The transaction covers two first sign-ins racing for the same identity. The `jwt` callback then reads the identity document to put `accountId` into the token, and `session.user.id` exposes it. Types are extended with module augmentation.

**Verified email per provider:**
- Google: the `email_verified` claim of the ID token.
- GitHub: the profile's email is neither always present nor known to be verified. We call `GET /user/emails` with the access token (scope `user:email`, already requested) and use the primary address only if it is marked `verified`. This also removes the email lookup the v4 provider did.

### 4. Ending sessions of removed accounts
On every invocation, the `jwt` callback reads `users/{accountId}`. If the document is gone, because the account was merged away, it returns `null` and Auth.js clears the session. That is one read per `auth()` or `/api/auth/session` call, which is negligible at Memepix's traffic.
- *Alternative: re-check only every few minutes.* Rejected, because the spec says the next request is signed out.

### 5. Linking by hand with a link intent cookie
Auth.js without an adapter would simply replace the session when a signed-in user signs in again. So before linking, the account page calls `POST /api/account/link` with the provider. The server sets a short-lived (10 minutes), signed, httpOnly `memepix-link` cookie holding the current `accountId`. The client then calls `signIn(provider, { redirectTo: '/account' })`.

When the `signIn` callback sees a valid intent, it clears the cookie and does not sign in the new identity. Instead it:
- adds the identity to the intent account if it has no account, and redirects to `/account?linked=<provider>`;
- redirects to `/account?already=<provider>` if the identity is already on this account;
- writes a `pendingMerges` document and redirects to `/account?merge=<id>` if the identity is on another account.

The callback returns these redirect URLs, which aborts the new sign-in, so the existing session for the intent account stays in place.
- *Alternative: sign in as the new identity and merge into it.* Rejected: the spec keeps the user in the account they started from.

### 6. Merge
The `/account?merge=<id>` view shows the other account's identities and its meme count (a `count()` query), with Confirm and Cancel.
- **Confirm** calls `POST /api/account/merges/<id>`, which checks that the session's account is the `survivorId` and that the pending merge has not expired. It then moves, in batches of up to 500 writes:
  1. identities, first, so that new sign-ins resolve to the survivor right away;
  2. memes (`ownerId`);
  3. uploads (`ownerId`);
  4. then it writes the `merges` record and deletes `users/{otherId}` and the pending merge.
  Every step selects by `ownerId == otherId` or `accountId == otherId`, so if it fails partway, confirming again finishes the job.
- **Cancel** deletes the pending merge.
- *Alternative: one transaction.* Rejected: Firestore caps a transaction at 500 writes, and an account can own more memes than that.

### 7. Unlinking
`DELETE /api/account/identities/<identityId>` runs a transaction: it checks that the identity belongs to the session's account and that the account has more than one identity, then deletes the identity document. The deleted identity then belongs to no account, and the next sign-in with it is resolved as in 3.

### 8. Ownership and claiming existing memes
- **Checks:** ownership is `meme.ownerId === session.user.id`. The API exposes `ownerId` on memes, and both client checks compare it with `session.user.id` instead of emails.
- **Claiming:** existing memes have no `ownerId`, and no accounts exist before release, so there is nothing to match offline. Whenever an identity with a verified email is created or added to an account, the server claims memes where `uploadedBy == email` that have no `ownerId`. Firestore cannot query a missing field, so it filters those results in code.
- **Before release:** a one-off script lowercases `uploadedBy` on all memes, so the equality query matches whatever case the uploader's email had. The v4 code lowercases both sides of its comparison, so running the script while v4 is live is safe.

### 9. Pages and components
- **Sign-in page:** `/auth/signin` shows "Sign in with Google" then "Sign in with GitHub", plus an error message when `?error=` is present. Auth.js `pages.signIn` and `pages.error` both point to it. `AuthButton` links to this page when the user is signed out, and when signed in it offers "Account" and "Sign out".
- **Account page:** `/account` lists identities, offers "Link Google" and "Link GitHub", an Unlink button per identity when there is more than one, and the merge confirmation.
- **Account APIs:** under `/api/account/`. Each one requires a session and acts only on the session's account.

### 10. Configuration
- `GOOGLE_CLIENT_ID` is a setting in `cloudbuild.yaml` and `.env.local.example`.
- `GOOGLE_CLIENT_SECRET` joins `src/lib/secrets.ts` and the `memepix-app-secrets` JSON.
- The Google OAuth client needs `<NEXTAUTH_URL>/api/auth/callback/google` as a redirect URI, for both local and production.

## Risks / Trade-offs

- **Auth.js v5 is a beta release.** → Pin the exact version. family-tree already runs it on Next.js 16. All imports from `next-auth` stay in `src/lib/auth.ts` and `src/lib/session.ts`, which limits the upgrade surface.
- **A verified email at one provider takes over the matching account.** Whoever controls a Google account with a verified email joins the GitHub account with that email. → This is the intended rule. It relies on the providers' verification, and unverified emails never link or claim memes.
- **Some old memes may never be claimed.** A meme whose uploader's GitHub email is no longer their verified primary email is not claimed automatically. → It stays read-only; it can be fixed by hand by setting `ownerId`, guided by the `uploadedBy` email.
- **A partial merge leaves the two accounts in between.** → Every step is idempotent, and the pending merge stays until the merge finishes, so confirming again completes it. If the pending merge expires first, the user links the identity again.
- **Extra Firestore reads.** Each session check costs one read, and each sign-in a transaction. → Acceptable at current traffic; revisit if reads show up in billing.
- **Two cookies during linking.** The link cookie and the session cookie coexist for up to 10 minutes. → The link cookie is signed with the auth secret, bound to the account ID and single-use, so it cannot link to an account the browser is not signed in to.

## Migration Plan

1. Create a Google OAuth client with redirect URIs for local and production.
2. Add `GOOGLE_CLIENT_SECRET` as a new version of `memepix-app-secrets`, and `GOOGLE_CLIENT_ID` to `cloudbuild.yaml`.
3. Create the `uploads` composite index, and enable TTL on `pendingMerges.expiresAt`.
4. Run the script that lowercases `uploadedBy` (safe while the old version is live).
5. Push to `main` to deploy. Everyone is signed out once. Memes are claimed as their uploaders sign in.
6. Rollback is described in proposal.md (Rollback Plan). The fields and collections this change adds are ignored by the old version.
