# Proposal

## Why

Memepix only offers GitHub sign-in, which leaves out the many visitors who have a Google account but no GitHub account. Adding Google sign-in raises a second problem: one person can end up with two separate accounts, each owning some of their memes. Today a meme's owner is just the email address it was uploaded with, so neither the two accounts nor their memes can be brought together.

## What Changes

- Add Google sign-in. The sign-in screen lists Google first, then GitHub.
- Introduce a Memepix user account (stable user ID) that one or more provider identities (a Google account, a GitHub account) belong to. Signing in with any linked identity signs in to the same account.
- Link identities automatically: when someone signs in with a provider identity that has no account yet, and its verified email matches an identity already on an account, the new identity joins that account. An unverified email never links.
- Let a signed-in user link another provider by hand, for identities with different emails. If that provider identity already has its own Memepix account, merge the two: memes, upload history and linked identities move to the account the user is signed in to, and the other account is removed.
- Let a user see and unlink their identities, but never the last one.
- Meme ownership moves from the uploader's email to the user ID, so edit and delete rights follow the account and survive a merge. The uploader's email is still stored on each meme. Existing memes are claimed by an account when an identity with the uploader's verified email signs in or is linked to it.
- The captcha threshold (10 uploads in 30 minutes) counts per account, not per email.
- Upgrade next-auth from v4 to v5 (Auth.js).
- **BREAKING** (data): meme documents gain an owner user ID, and the ownership check uses it in place of the email.
- **BREAKING** (sessions): v5 uses a different session cookie, so everyone is signed out once when it is deployed.

## Capabilities

### New Capabilities

- `user-auth`: signing in and out with Google or GitHub (Google listed first), the Memepix user account and its provider identities, and who counts as a meme's owner.
- `account-linking`: linking provider identities automatically by verified email or by hand, unlinking them, and merging two accounts when the identity being linked already belongs to another account.

### Modified Capabilities

None. No existing spec covers sign-in or ownership; `meme-upload` and `meme-sharing` keep their current requirements.

## Impact

- **Code:** `src/lib/auth.ts` (providers, sign-in and session callbacks), `src/lib/session.ts`, the ownership checks in `src/app/api/memes/[id]/route.ts`, `src/app/api/upload/route.ts` and `src/app/api/config/route.ts` (per-account upload counting), `src/components/AuthButton.tsx`, and a new account page and API for linking, unlinking and merging.
- **Data:** new Firestore collections for users and provider identities; an owner ID field on `memes` and `uploads`; a one-time script that lowercases `uploadedBy` on existing memes.
- **Configuration:** a Google OAuth client. `GOOGLE_CLIENT_ID` becomes a setting in `cloudbuild.yaml`, and `GOOGLE_CLIENT_SECRET` is added to the `memepix-app-secrets` JSON. The Google client needs the callback URL `<NEXTAUTH_URL>/api/auth/callback/google`.
- **Dependencies:** `next-auth` moves from v4 to v5. Its configuration, route handler and server-side session calls change, the GitHub `issuer` workaround for v4's openid-client goes away, and the session cookie name changes.
- **Affected parties:** the maintainer, who owns code, deployment and the Google Cloud and OAuth setup, and existing users, who keep their memes and should notice no change except the new sign-in option and account page.

## Rollback Plan

- Redeploy the previous Cloud Run revision (`gcloud run services update-traffic memepix --to-revisions=<previous>=100`). Because v4 and v5 use different session cookies, everyone is signed out once more.
- The change only adds data: memes keep their `uploadedBy` email, and new memes still record it, so the previous revision's email-based ownership keeps working, including for memes uploaded during the rollout.
- Memes uploaded by a Google-only account remain viewable after a rollback, but their owner can't edit or delete them until the change is redeployed, because the old code offers no Google sign-in.
- Merges and automatic links can't be undone automatically. Each merge is logged with the IDs of both accounts and the memes moved, so it can be reversed by hand if needed.
- The new collections and fields can stay in place during a rollback; the old code ignores them.
