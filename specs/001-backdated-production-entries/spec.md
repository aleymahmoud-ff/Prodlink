# Feature Specification: Backdated Production Entries

**Feature Branch**: `001-backdated-production-entries`
**Created**: 2026-05-10
**Status**: Draft
**Input**: User description: "Add a Today/Yesterday toggle to the production form's per-product totals table (default Today). When set to Yesterday, the table aggregates yesterday's entries and any new entries submitted while the toggle is on Yesterday are recorded with yesterday's production date. Add a separate admin-only Exceptional Entry view in the same form that lets administrators record a production entry for any selected date. Non-admins never see the Exceptional Entry view."

## Clarifications

### Session 2026-05-10

- Q: How far across the app should the switch from `created_at`-based aggregation to `production_date`-based aggregation reach? → A: App-wide. Every place that currently aggregates production by insertion timestamp switches to production date.
- Q: Where does the system get the time zone that defines "today" and "yesterday"? → A: User's browser time zone. Each client computes its own day boundaries; the server stores and validates a calendar date supplied by the client, not a UTC timestamp.
- Q: When the clock crosses midnight while the form is open, what does the Yesterday toggle do? → A: Show the resolved date next to the toggle and follow real time. The toggle label always displays the current resolved date (e.g. "Yesterday (May 9)") and updates itself at midnight, so the user always sees the date they are about to save against.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operator records yesterday's leftover production (Priority: P1)

A line operator finishes their shift but does not get a chance to log all of yesterday's production before going home. The next morning they open the production form. The page defaults to Today, but the operator switches the table view to Yesterday. The per-product totals now reflect yesterday's production. The operator records the missing entries; each saved entry is dated to yesterday rather than today, so daily reports remain accurate.

**Why this priority**: This is the immediate, recurring operational pain that triggered the feature. Without it, late-logged production silently rolls into the wrong day, distorting daily totals and reports. It is the smallest, most-needed slice of value and works on its own.

**Independent Test**: An operator account can sign in, switch the toggle to Yesterday, see yesterday's totals, submit a new entry, then re-open the form (still on Yesterday) and see the new entry counted. Switching the toggle back to Today must show today's untouched totals.

**Acceptance Scenarios**:

1. **Given** the operator is on the production form with the toggle defaulting to Today, **When** they change the toggle to Yesterday, **Then** every per-product total in the table updates to reflect only yesterday's entries and the recent-entries section below shows only yesterday's entries.
2. **Given** the toggle is set to Yesterday, **When** the operator submits a new production entry, **Then** the entry is stored with a production date of yesterday and immediately appears in the Yesterday totals.
3. **Given** the toggle is set to Today, **When** the operator submits a new production entry, **Then** the entry is stored with a production date of today (current behavior preserved exactly).
4. **Given** the operator is viewing Yesterday and submits an entry, **When** they switch the toggle back to Today, **Then** the totals immediately reflect Today (their just-submitted Yesterday entry is no longer in the totals) and the operator sees Today's data.
5. **Given** any user reloads the page, **When** the form opens, **Then** the toggle is set to Today regardless of what it was set to when the user last left the page.

---

### User Story 2 - Admin records production for an arbitrary past date (Priority: P2)

A factory administrator discovers, days after the fact, that production from a particular date was never entered (for example after a system outage or lost paper records). They open the production form, open the Exceptional Entry view (which is only visible to administrators), pick the affected date, fill in line / product / quantity / unit / batch / notes, and save. The entry is recorded against the chosen date.

**Why this priority**: Resolves data-integrity gaps that the Today/Yesterday toggle cannot cover. Less frequent than Story 1 but valuable for monthly closes and audit corrections. Independent of Story 1 — even without the toggle, admins can still backdate via this view.

**Independent Test**: An admin account can open the Exceptional Entry view, choose a date 7 days in the past, submit an entry, and find it in that date's history. A non-admin account signed into the same form must not see the Exceptional Entry view at all.

**Acceptance Scenarios**:

1. **Given** an admin is on the production form, **When** they open the Exceptional Entry view, **Then** they can choose any past date or today as the production date and submit an entry against it.
2. **Given** a non-admin (any role other than admin) is on the production form, **When** they look at the form, **Then** the Exceptional Entry view is not visible and is not accessible by direct URL.
3. **Given** an admin submits an Exceptional Entry for a date 7 days ago, **When** anyone views the production data for that date, **Then** the entry is included with that date as its production date and the admin is recorded as the creator for audit.
4. **Given** an admin opens the Exceptional Entry view, **When** they try to choose a future date, **Then** the form prevents selection and the entry cannot be submitted.

---

### Edge Cases

- **Toggling mid-entry**: If a user is mid-way through filling the regular form and switches the Today/Yesterday toggle, any unsaved input is preserved; only the production date that will be assigned on save changes.
- **Day rollover at midnight**: If a user keeps the page open across midnight, the toggle's resolved date labels (e.g., "Today (May 10)") are refreshed automatically and the totals/list re-fetch for the new dates. A Yesterday entry submitted just after midnight is recorded against the new "yesterday," matching what the user sees on screen.
- **Yesterday has zero production**: Switching to Yesterday when no entries were recorded yesterday shows zeroes for every product and an empty recent-entries list. This is normal, not an error.
- **Non-admin tampers with the API directly**: The server must reject any production-date older than yesterday from non-admin callers. Only admins may set arbitrary past dates.
- **Time zone**: "Today" and "Yesterday" are interpreted in the user's browser time zone. The client computes the calendar date and sends it to the server; the server stores it as a calendar date (no time-of-day component) and validates it against the per-role policy.
- **User in a different time zone than the factory**: If a user opens the form from a device set to a different time zone than the rest of the factory, that user's "today" / "yesterday" may differ from a coworker's by one day at the boundary. This is accepted; the operating assumption is that factory staff use the form on-site or on devices set to factory time.
- **Closed reporting period**: If yesterday or the chosen date already falls inside a locked / closed accounting period, this feature still allows submission. Period locking is out of scope.
- **Audit trail**: For every entry, regardless of view, the system continues to record who created it and when it was inserted, even when the production date differs from the insertion timestamp.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The production form MUST display a Today/Yesterday toggle on or above the per-product totals table. Each option MUST display the resolved calendar date alongside its label (e.g., "Today (May 10)", "Yesterday (May 9)") so the user always sees the exact date their submission will be tagged with.
- **FR-002**: The toggle MUST default to Today on every page load. It MUST NOT persist across page reloads or sessions.
- **FR-003**: When the toggle is set to Today, the per-product totals table MUST aggregate only entries whose production date equals today (factory time zone). When set to Yesterday, it MUST aggregate only entries whose production date equals yesterday.
- **FR-004**: When the toggle is set to Today, the recent-entries section below the totals MUST show only entries whose production date equals today; when set to Yesterday, it MUST show only entries whose production date equals yesterday.
- **FR-005**: When the toggle is set to Today, any new entry submitted via the regular form MUST be recorded with a production date of today.
- **FR-006**: When the toggle is set to Yesterday, any new entry submitted via the regular form MUST be recorded with a production date of yesterday.
- **FR-007**: Switching the toggle MUST refresh both the totals table and the recent-entries list to reflect the selected day, without requiring a full page reload.
- **FR-007a**: While the form remains open, the system MUST detect the user's clock crossing midnight and refresh the toggle's resolved date labels and the data shown, so a Yesterday-tagged entry submitted just after midnight is recorded against the new "yesterday" rather than the previous one.
- **FR-008**: The system MUST record each production entry with both (a) the production date it represents and (b) the timestamp at which the row was inserted. Both values MUST be retained for audit.
- **FR-009**: The system MUST display the production date and the creator on each entry shown in the recent-entries list, so users can distinguish backdated entries from entries created today.
- **FR-010**: The form MUST expose a separate Exceptional Entry view (such as a tab, button, or section) that opens a date-picker-driven entry form.
- **FR-011**: The Exceptional Entry view MUST be visible and accessible only to users with the admin role. Non-admin users MUST NOT see any control or label that hints at its existence.
- **FR-012**: The Exceptional Entry view MUST allow an admin to choose any date that is today or earlier (factory time zone). Future dates MUST be rejected.
- **FR-013**: When an admin submits an Exceptional Entry, the system MUST record it with the chosen production date and the admin as creator.
- **FR-014**: The server-side endpoint that creates production entries MUST enforce the role-and-date rules above: non-admin callers may only set the production date to today or yesterday; admin callers may set any past date or today; future dates are rejected for everyone. These checks MUST be performed server-side regardless of what the client sends.
- **FR-015**: All existing production entries created before this feature ships MUST continue to be readable, with their existing creation timestamp treated as their production date for the purposes of the Today/Yesterday views and any aggregation.
- **FR-016**: Aggregations and filters elsewhere in the application that currently filter production data by entry creation timestamp MUST be updated to filter by production date, so that the Today/Yesterday toggle and Exceptional Entry behave consistently with the rest of the app's view of "the day's production."

### Key Entities *(include if feature involves data)*

- **Production Entry**: A single record of how much of which product was produced on a given line. Now carries two distinct date concepts:
  - **Production Date** (new): the calendar day, in factory time zone, that the entry represents. This is the value the Today/Yesterday toggle and the Exceptional Entry view set. This is the day the entry counts toward in totals and reports.
  - **Created At** (existing, unchanged): the exact server timestamp at which the row was inserted. Used only for audit; never for aggregation.
- **User Role**: Existing concept. The Exceptional Entry view and the ability to backdate to dates earlier than yesterday are gated to the `admin` role only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A line operator who needs to log yesterday's leftover production can do so in under 30 seconds from the moment they open the form (toggle → enter quantity → save), without admin assistance.
- **SC-002**: 100% of production entries created via the Yesterday toggle are reflected on yesterday's daily report rather than today's, eliminating the silent drift of late-logged production into the wrong day.
- **SC-003**: An admin can correct a missing day of production (single entry) in under 1 minute via the Exceptional Entry view.
- **SC-004**: Zero entries can be recorded against a future date by any user, including direct calls to the server.
- **SC-005**: Zero non-admin users can record an entry dated more than 1 day in the past, including direct calls to the server.
- **SC-006**: At least 90% of late-logged production volume is tagged to the correct day within the first month after launch (vs. effectively 0% today, where late entries are silently tagged "today").

## Assumptions

- **Time zone**: "Today" and "Yesterday" are interpreted in the user's browser time zone. The client computes the calendar date for each entry and sends it to the server; the server stores it as a calendar date with no time-of-day component. (See Clarifications.)
- **Day boundary**: A calendar day runs from midnight to midnight in the user's browser time zone. There is no shift-based or fiscal-day boundary applied here.
- **No edit of existing entries**: This feature only governs the creation of new entries. Changing the production date of an entry that already exists is out of scope; admins who need to fix a wrongly-dated entry can delete and re-create it (existing capability).
- **No persistence of toggle**: The toggle resets to Today on every page load to avoid accidental backdating the morning after a user left the form on Yesterday.
- **Migration of existing rows**: Historical entries that have only a creation timestamp are treated as if their production date equals the calendar day of their creation timestamp (factory time zone). No backfill UX is required; this happens automatically.
- **Role model unchanged**: The existing `admin` role definition is reused. No new role or permission system is introduced.
- **No reporting-period locking**: The feature does not introduce locked / closed reporting periods. If an organization later wants to prevent backdating into a closed month, that's a follow-up.
- **Audit preserved**: The existing audit information (creator, created-at timestamp) continues to be captured automatically and is not weakened by the addition of the production-date field.
