# Spec Delta

## Purpose

Brings a person's Google and GitHub identities together on one Memepix account: automatically when their verified emails match, or by hand, merging two accounts when both already exist.

## ADDED Requirements

### Requirement: Automatic linking by verified email
When someone signs in with an identity that belongs to no account, and the provider reports its email as verified, the system SHALL add the identity to the account that has another identity with the same verified email, ignoring letter case, instead of creating a new account.

#### Scenario: Google sign-in joins existing GitHub account
- **GIVEN** an account with a GitHub identity whose verified email is "a@example.com"
- **WHEN** the person signs in for the first time with a Google identity whose verified email is "A@example.com"
- **THEN** the system adds the Google identity to that account and signs them in to it

#### Scenario: Unverified email does not link
- **GIVEN** an account with an identity whose verified email is "a@example.com"
- **WHEN** someone signs in for the first time with an identity whose email "a@example.com" the provider does not report as verified
- **THEN** the system creates a new account for that identity and links nothing

#### Scenario: Only verified emails are matched
- **GIVEN** an account whose only identity has an unverified email "a@example.com"
- **WHEN** someone signs in for the first time with an identity whose verified email is "a@example.com"
- **THEN** the system creates a new account for that identity

#### Scenario: Email matches several accounts
- **GIVEN** two accounts that each have an identity with verified email "a@example.com"
- **WHEN** someone signs in for the first time with an identity whose verified email is "a@example.com"
- **THEN** the system creates a new account for that identity and links nothing

### Requirement: Account page lists identities
The system SHALL show a signed-in user an account page listing each identity on their account with its provider and email, and offering to link Google or GitHub.

#### Scenario: View linked identities
- **GIVEN** a signed-in user whose account has a Google identity and a GitHub identity
- **WHEN** they open the account page
- **THEN** the system lists both identities with their provider and email

### Requirement: Link an identity by hand
The system SHALL let a signed-in user link another identity by signing in to that provider from the account page. An identity that belongs to no account SHALL be added to the user's account.

#### Scenario: Link an identity that has no account
- **GIVEN** a signed-in user whose account has only a GitHub identity
- **WHEN** they choose "Link Google" and approve access with a Google identity that belongs to no account
- **THEN** the system adds the Google identity to their account and lists it on the account page

#### Scenario: Identity already on this account
- **GIVEN** a signed-in user
- **WHEN** they link an identity that already belongs to their account
- **THEN** the system changes nothing and says the identity is already linked

#### Scenario: Linking cancelled
- **GIVEN** a signed-in user on the account page
- **WHEN** they cancel on the provider's page
- **THEN** the system changes nothing and the user stays signed in to their account

### Requirement: Merge accounts on linking
When a signed-in user links an identity that belongs to another account, the system SHALL show what that account holds and ask for confirmation. On confirmation it SHALL merge the other account into the signed-in account; if declined, it SHALL change nothing.

#### Scenario: Confirmation shows what will move
- **GIVEN** a signed-in account A
- **AND** another account B with a Google identity and 3 memes
- **WHEN** the user of A links that Google identity
- **THEN** the system shows that account B's identities and 3 memes will move to account A, and asks for confirmation

#### Scenario: Merge confirmed
- **GIVEN** the confirmation to merge account B into account A
- **WHEN** the user confirms
- **THEN** all of B's identities, memes and upload records belong to A
- **AND** account B no longer exists
- **AND** the user stays signed in to A and can edit and delete the memes that came from B

#### Scenario: Merge declined
- **GIVEN** the confirmation to merge account B into account A
- **WHEN** the user declines
- **THEN** both accounts, their identities and their memes stay as they were

#### Scenario: Merged memes keep their uploader email
- **GIVEN** a meme from account B with uploader email "b@example.com"
- **WHEN** B is merged into A
- **THEN** the meme's owner is A and its uploader email is still "b@example.com"

#### Scenario: Sessions of the merged account end
- **GIVEN** account B is signed in on another device
- **WHEN** B is merged into A
- **THEN** that device's next request is treated as signed out

### Requirement: Merges are recorded
The system SHALL record each merge with the time, the surviving account ID, the removed account ID, the identities moved and the IDs of the memes moved.

#### Scenario: Merge record written
- **WHEN** account B is merged into account A
- **THEN** the system stores a record naming A, B, the moved identities and the moved meme IDs

### Requirement: Unlink an identity
The system SHALL let a signed-in user unlink an identity from their account, unless it is the account's only identity. An unlinked identity SHALL belong to no account.

#### Scenario: Unlink one of two identities
- **GIVEN** a signed-in user whose account has a Google identity and a GitHub identity
- **WHEN** they unlink the GitHub identity
- **THEN** the account keeps only the Google identity, and all its memes

#### Scenario: Last identity cannot be unlinked
- **GIVEN** a signed-in user whose account has one identity
- **WHEN** they view the account page
- **THEN** the system offers no way to unlink that identity, and refuses a request to do so

#### Scenario: Signing in again with an unlinked identity
- **GIVEN** a GitHub identity that was unlinked from an account
- **WHEN** someone signs in with it
- **THEN** the system treats it as an identity that belongs to no account, so it links automatically if its verified email matches an identity on exactly one account, and otherwise gets a new account
