# Firestore Security Specification

This security specification verifies that user game progress data in Firestore is protected against unauthorized tampering, identity spoofing, value poisoning, and denial of wallet attacks.

## 1. Data Invariants

- **Ownership Integrity**: A user can only read, create, or update a document where the document ID matches their authenticated UID (`request.auth.uid`). No other authenticated or anonymous users can read or write to their data.
- **Timestamp Integrity**: The `updatedAt` field must be exactly equal to `request.time` during all write operations (never trusted to be client-provided).
- **Structure and Schema Integrity**: All required fields (`userId`, `currentLevelIndex`, `totalScore`, `points`, `bestScores`, `coins`, `unlockedBallIds`, `equippedBallId`, `updatedAt`) must be present with proper types and sizes.

## 2. The "Dirty Dozen" Payloads (Tampering Attacks)

We assert that each of these malicious payloads will be securely rejected (`PERMISSION_DENIED`) by our security rules:

1. **Spoofed Owner UID**: Attempt to read or write to `users/different_user_uid` as `test_user_123`.
2. **Missing required fields**: Creating a user profile without `coins`.
3. **Negative Coins**: Attempt to write `coins` as `-100`.
4. **Invalid type for keys**: Writing `currentLevelIndex` as `"twenty"`.
5. **Junk Field Inject / Shadow fields (Value Poisoning)**: Injecting `{ "isVerifiedAdmin": true }` into the profile document.
6. **Mismatched UID payload**: Authenticating as `uid1` but passing `"userId": "uid2"` in the JSON payload fields.
7. **Client Timestamp Spoofing**: Setting `updatedAt` to a fixed date in 2030 instead of `request.time`.
8. **Massive Over-Sized Best Scores**: Setting `bestScores` as a list of 100,000 values to drain document read memory.
9. **Junk Character Document ID**: Using an ID with 500 length or invalid non-alphanumeric character structures.
10. **Equipped Unbought Ball**: Attempting to equip a ball ID that is not present in the user's `unlockedBallIds` list.
11. **Excessive Unlocked Balls array**: Bypassing shop limit and posting 1000 items in `unlockedBallIds`.
12. **Anonymous Sign-in write**: Modifying public database states with a non-verified anonymous token.

## 3. Firestore Rules Structure

We will implement standard, robust security logic in the `firestore.rules` file:
- Authenticated User Match checks on `request.auth.uid`.
- strict helper function validation on schema structure.
- Temporal sync on standard metadata.
