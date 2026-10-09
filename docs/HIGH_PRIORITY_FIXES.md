# High-priority workflow fixes

## Behavior changes

- New dashboard passports use `SC-<full Firestore document ID>`. Existing IDs are retained during verification. Existing duplicate IDs are not automatically renamed: those require a deliberate data audit to avoid breaking references.
- Rescue claims and proof submissions use transactions against the latest report. Dashboard dispatch requires a registered responder; older in-progress reports without a helper can now be assigned. Assigned reports appear in the responder's mobile Profile > My Reports & Tasks.
- Medical entries and their in-app notifications commit together. Each submission has an ID for safe retries within the form session. Push delivery failure does not undo a saved treatment. Entries include the signed-in staff UID.
- Archive replaces permanent deletion. History, ownership and linked applications remain available. Archived animals are excluded from public status-based listings and cannot be approved for adoption, edited clinically, or reactivated by stale mobile status actions.
- Push registration uses `users/{uid}.expoPushTokens` instead of the old singular field. The phone remembers its registrations, removes only its own tokens before signing out, and serializes registration against logout. Logout requires a successful server cleanup; on failure the app keeps the session open and asks the user to retry.

## Rollout

Update both the mobile JavaScript and dashboard together. Reload the installed development app with Metro running; no native dependencies changed, so these fixes do not require rebuilding the APK.

The dashboard intentionally ignores legacy `expoPushToken` values because they may point to logged-out accounts. Existing users need to open the updated mobile app with notifications permitted to register in the new field. In-app notifications continue to be stored regardless of push registration. Push delivery remains best-effort; a server delivery worker and receipt processing are not part of these fixes.

No production documents or deployed Firebase rules were modified. Confirm the deployed rules permit staff to read responder profiles, update passport archive/verification fields, and atomically save medical entries plus notifications. Users need access to their own push-token fields. Rules must independently enforce ownership, roles, and allowed lifecycle transitions; client transactions are not an authorization boundary.

## Validation completed

- Dashboard: 20 Node regression tests, production Vite build, and lint on the new dashboard utility/service modules.
- Mobile: 16 Node regression tests and Android production JavaScript/Hermes export.
- Transaction tests use an optimistic in-memory harness with retry and atomic failure behavior. They do not exercise deployed Firebase rules.

## Phone and dashboard smoke checks

Use test records rather than real clinical records.

1. Register two animals, then verify both. Their IDs must differ and remain unchanged after verification.
2. Open one pending rescue on two accounts and claim simultaneously. Only one should win. Dispatch another from the dashboard and verify it appears in the chosen user's Profile tasks. Submit proof, close the report from the dashboard, and confirm a stale upload cannot reopen it.
3. Save a treatment and verify one history entry and one owner notification. Test a denied write or network failure and retry without creating duplicate records.
4. Archive a test animal. Confirm its history remains readable, public listings exclude it, and old adoption applications cannot be approved.
5. Sign into account A on a phone, then sign out and enter account B. Verify the token is removed from A, remains registered to B, and another device still logged into A retains its registration.

