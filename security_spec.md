# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every document in `/users/{userId}` must have `userId == request.auth.uid` and `data.ownerId == request.auth.uid`. No user may read or write another user's progress document.
2. **Verified Email Requirement**: All writes to `/users/{userId}` and `/users/{userId}/goals/{goalId}` require `request.auth.token.email_verified == true`.
3. **Master Gate Relational Sync**: A goal document in `/users/{userId}/goals/{goalId}` can only be read, created, updated, or deleted if the parent `/users/{userId}` document exists and its `ownerId` matches `request.auth.uid`.
4. **Bounded Arrays & Strings**: `completedModules` and `completedScenarioIds` are strictly bounded to `<= 10` elements; all strings enforce strict `.size()` upper bounds matching `firebase-blueprint.json`.
5. **Temporal Integrity & Immutability**: `createdAt` and `ownerId` are immutable after creation; `createdAt` (on create) and `updatedAt` (on create/update) must equal `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Payload 1 (Identity Spoofing)**: Authenticated user `uid_A` attempts to create `/users/uid_A` with `ownerId: "uid_B"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Cross-Tenant Read/PII Leak)**: Authenticated user `uid_A` attempts `get` on `/users/uid_B`. -> `PERMISSION_DENIED`
3. **Payload 3 (Unverified Email Write)**: User with `email_verified: false` attempts `create` on `/users/uid_A`. -> `PERMISSION_DENIED`
4. **Payload 4 (Shadow Field Injection)**: Payload includes required fields plus `isAdmin: true` ghost key. -> `PERMISSION_DENIED`
5. **Payload 5 (ID Poisoning)**: Document ID `{goalId}` contains special characters (`goal/../admin`) or exceeds 128 chars. -> `PERMISSION_DENIED`
6. **Payload 6 (String Denial-of-Wallet)**: `architectName` is a 10,000-character string (exceeds `maxLength: 120`). -> `PERMISSION_DENIED`
7. **Payload 7 (Unbounded Array Overflow)**: `completedModules` array has 50 items (exceeds `maxLength: 10`). -> `PERMISSION_DENIED`
8. **Payload 8 (Client Timestamp Forgery)**: `updatedAt` is a client-supplied past timestamp instead of `request.time`. -> `PERMISSION_DENIED`
9. **Payload 9 (Immortal Field Mutation)**: `update` operation attempts to mutate `createdAt` or `ownerId`. -> `PERMISSION_DENIED`
10. **Payload 10 (Orphaned Subcollection Write)**: User attempts to create `/users/uid_A/goals/goal_1` when parent `/users/uid_A` does not exist. -> `PERMISSION_DENIED`
11. **Payload 11 (Value Poisoning on Update)**: `update` operation passes `dailyTargetMinutes: "sixty"` (string instead of int). -> `PERMISSION_DENIED`
12. **Payload 12 (Unauthorized List Scraping)**: User attempts unscoped `list` query on `/users/{userId}/goals` where `resource.data.ownerId != request.auth.uid`. -> `PERMISSION_DENIED`
