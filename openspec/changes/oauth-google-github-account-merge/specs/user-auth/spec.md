# Spec Delta

## Purpose

Lets people sign in to Memepix with a Google or GitHub account, gives each person one Memepix account that any of their linked provider identities signs in to, and decides who owns a meme.

## ADDED Requirements

### Requirement: Sign-in providers
The system SHALL offer sign-in with Google and with GitHub, listing Google first and GitHub second.

#### Scenario: Sign-in options shown in order
- **GIVEN** a visitor who is not signed in
- **WHEN** they open the sign-in options
- **THEN** the system shows "Sign in with Google" followed by "Sign in with GitHub"

#### Scenario: Sign in with Google
- **GIVEN** a visitor who is not signed in
- **WHEN** they choose Google and approve access on Google
- **THEN** the system signs them in and shows their name and avatar in the header

#### Scenario: Sign in with GitHub
- **GIVEN** a visitor who is not signed in
- **WHEN** they choose GitHub and approve access on GitHub
- **THEN** the system signs them in and shows their name and avatar in the header

#### Scenario: Provider sign-in cancelled or failed
- **GIVEN** a visitor who is not signed in
- **WHEN** they cancel on the provider's page, or the provider returns an error
- **THEN** the system leaves them signed out and shows that sign-in did not complete

### Requirement: One account per person
The system SHALL keep a Memepix account with a stable account ID, to which one or more provider identities belong. An identity belongs to at most one account, and signing in with any identity on an account SHALL sign in to that account.

#### Scenario: First sign-in creates an account
- **GIVEN** a provider identity that belongs to no account
- **AND** its email does not qualify for automatic linking
- **WHEN** the person signs in with it
- **THEN** the system creates a new account with that identity as its only identity

#### Scenario: Returning identity signs in to its account
- **GIVEN** an account with a Google identity and a GitHub identity
- **WHEN** the person signs in with either identity
- **THEN** the system signs them in to that same account

#### Scenario: Account ID does not change
- **GIVEN** an account
- **WHEN** its name, avatar or email at a provider changes, or identities are linked or unlinked
- **THEN** the account keeps the same account ID

### Requirement: Sign out
The system SHALL let a signed-in user sign out, ending their session for all of their identities.

#### Scenario: Sign out
- **GIVEN** a signed-in user
- **WHEN** they choose "Sign out"
- **THEN** the system ends the session and shows the sign-in options again

### Requirement: Meme ownership by account
The system SHALL record the uploader's account ID on each new meme and SHALL treat that account as the meme's owner. It SHALL keep recording the uploader's email on each meme.

#### Scenario: New meme records its owner
- **GIVEN** a signed-in user
- **WHEN** they upload a meme
- **THEN** the meme records their account ID as owner and their email as uploader

#### Scenario: Owner edits or deletes from any linked identity
- **GIVEN** a meme owned by an account with Google and GitHub identities
- **WHEN** the owner signs in with either identity and edits or deletes the meme
- **THEN** the system allows the change

#### Scenario: Non-owner is refused
- **GIVEN** a meme owned by another account
- **WHEN** a signed-in user tries to edit or delete it
- **THEN** the system refuses with a "forbidden" error and leaves the meme unchanged

#### Scenario: Signed-out user is refused
- **GIVEN** a visitor who is not signed in
- **WHEN** they try to upload, edit or delete a meme
- **THEN** the system refuses with an "unauthorized" error

### Requirement: Existing memes keep their owners
When an identity with a verified email is added to an account, including when a new account is created for it, the system SHALL make that account the owner of every meme that has no owner yet and whose uploader email matches, ignoring letter case.

#### Scenario: Uploader signs in after the change
- **GIVEN** a meme uploaded before this change with uploader email "A@example.com" and no owner
- **WHEN** someone signs in with a GitHub identity whose verified email is "a@example.com"
- **THEN** the meme's owner is the account that identity belongs to

#### Scenario: Unverified email claims nothing
- **GIVEN** a meme with uploader email "a@example.com" and no owner
- **WHEN** someone signs in with an identity whose email "a@example.com" the provider does not report as verified
- **THEN** the meme still has no owner

#### Scenario: Owned memes are not reassigned
- **GIVEN** a meme already owned by an account
- **WHEN** an identity with a verified email equal to the meme's uploader email is added to a different account
- **THEN** the meme keeps its owner

### Requirement: Upload limit per account
The system SHALL count uploads per account when deciding whether to require a captcha: after 10 uploads by the same account within 30 minutes, it SHALL require a captcha for the next upload.

#### Scenario: Limit spans linked identities
- **GIVEN** an account with Google and GitHub identities
- **AND** 6 uploads in the last 30 minutes while signed in with Google
- **WHEN** the person signs in with GitHub and uploads 4 more
- **THEN** the system requires a captcha for the next upload

#### Scenario: Below the limit
- **GIVEN** an account with fewer than 10 uploads in the last 30 minutes
- **WHEN** the person uploads
- **THEN** the system does not require a captcha
