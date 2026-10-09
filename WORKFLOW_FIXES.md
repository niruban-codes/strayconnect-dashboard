# Workflow fixes and release checks — 10 October 2026

Implemented across the mobile app and dashboard:

- Adoption submissions use a stable per-user/per-pet ID, reject legacy duplicates, require a verified pet and verified email, and track pending applications on the pet. Profile displays application status.
- Adoption approval transfers ownership, preserves ownership history, closes competing applications, and writes applicant notifications in one transaction. Rejection also notifies the applicant.
- Rescue registration prefills report details and creates one linked passport per report, with concurrent registration protection. Intake requires rescue proof review or resolution.
- Missing/found restores the previous pet status instead of always resetting to owned. Missing pets appear in the SOS feed.
- Event input validates real future dates in Sri Lanka time. Approval and organizer notification are atomic; mobile event cards and details use the stored date. The feed updates at day rollover.
- Email verification refreshes on app focus/foreground and before gated actions. Profile includes a manual verification check.
- Main feeds display a retry action when their Firestore subscription fails.

## Validation and release

Run `node --test tests/*.test.mjs` in each repository. Tests use an in-memory transaction harness; they do not validate deployed Firestore security rules. Dashboard: `npm run build`. Mobile: `npx expo export --platform android`.

These changes contain no native dependencies or configuration updates. Start Metro with `npm start` and reload the existing development app. Restart/reload the dashboard development server as needed. Release both clients together: older mobile clients do not maintain the pending application registry, so their concurrent submissions cannot receive the same closure guarantee.

## Live checks still required

No Firestore rules or indexes are versioned in either repository, and deployed rules were not inspected or changed. Verify with test accounts that:

1. Applicants can read their own application paths and create their application while updating only the pet's pendingAdoptionRequestIds field. Rules must restrict this to adding their own valid application; do not grant general animal-edit access.
2. Staff can atomically update adoption decisions, competing requests, ownership and applicant notifications. Applicants must not be able to approve requests or transfer ownership themselves.
3. Report intake can atomically link the report and create its deterministic animal document; repeat clicks create no duplicate.
4. Owners can mark their pets missing/found and see the SOS feed update, preserving an adopted pet's adoption status.
5. Event approval creates the organizer notification, and email verification takes effect without signing out.
6. Feed permission/network failures show a recoverable error rather than an endless spinner.

Background push delivery still requires backend work; these decision notifications are in-app records. Historical duplicate applications and malformed event records were not deleted or migrated. End-to-end device and live backend validation remains required before production release.
