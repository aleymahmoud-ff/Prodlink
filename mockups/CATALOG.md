# ProdLink Screenshot Catalog

Eleven screens, each rendered light and dark at 1920×1080. Files are in `png/`
(`<screen>.png` and `<screen>-dark.png`); the sources that produce them are in
`dist/<screen>.html`.

**All data in these images is illustrative and fictional.** No real customer, employee,
batch, or figure appears in any of them. Caption them accordingly wherever they are
published.

---

### `login` — Sign In

The split sign-in screen: a gradient brand panel carrying the product promise and three
proof numbers (24 lines, 318 products, 24/7), and the actual credentials form with
username/password, Google sign-in, and the notice that accounts are created by an
administrator. **Use it** as the opening image of a case study, or as the hero on a
landing page — it is the only screen that carries a headline, so it does the work a hero
shot normally needs a caption for. Pairs well with `dashboard` immediately after.

### `dashboard` — Dashboard

The whole-product shot. Welcome banner with the signed-in persona and factory day, the
four real stat cards (Today's Production, Pending Approvals, Today's Waste,
Reprocessing), a seven-day output chart against an 18,000-unit daily target, today's
waste split by reason, and the Recent Activity feed mixing production, waste, damage and
reprocessing entries. **Use it** as the lead image everywhere — website hero, app-store
listing, deck cover, the first image in a case study. If you only ship one screenshot,
ship this one.

### `production` — Production Entry

The screen an engineer actually lives in: line-type and line filters, the bulk
Today/Yesterday date control, and the product grid for L-01 Croissant Line 1 with inline
quantity entry, per-row date toggles, unit-of-measure dropdowns, and running My Total /
All Users columns. One row is flipped to Yesterday and highlighted, which is the detail
that shows backdated entry exists. **Use it** wherever you need to prove the product is
built for speed on the floor rather than for a back office — the "how it works" section,
or the second image of a case study.

### `waste` — Waste Entry

The waste capture form with the amber "Approval Required" banner above it, filled with a
real submission (Kunafa Tray 2kg, 18.4 kg, Failed QA inspection, batch BK-2608-A17), and
the submission history below showing the full mix of statuses: two pending at different
levels, four approved — two of those also form-signed — and one rejected. **Use it** to
introduce the waste workflow before showing the approvals screen. The status column is
the whole story in one glance.

### `approvals` — Waste Approvals

Four waste entries as an approver sees them: two awaiting a Level 2 decision with
Approve-to-L3 and Reject buttons and red "waiting 27h / 31h" flags, one fully approved
but still needing the paper form signed, and one rejected with the reviewer's comment
explaining why it should be reclassified. **Use it** as the "hard problem solved" image —
multi-level approval with a real audit trail is the feature competitors on paper forms
cannot match. Strongest single argument in the pack.

### `damage` — Damage Entry

The damage form and its history table. Deliberately simpler than waste — no approval
banner, no status column — because damage is recorded before it is classified as waste or
reprocessing, and the footer says so. **Use it** in documentation and in feature grids
where you need a third data-entry screen; it is not a hero image.

### `waste-export` — Export Waste Report

Report filters on the left (line, date range, approval status, category checkboxes with
per-category counts) and a live preview of the generated WD-04 Waste Disposal Record on
the right: ISO 22000 clause reference, report metadata, eleven itemised disposal rows
with batch numbers and approvers, a declaration paragraph, and three signature blocks.
**Use it** for anything compliance-facing — the ISO section of a sales page, a
regulated-industry deck, an RFP response. This is the screen that answers "but our auditor
needs paper."

### `admin-users` — Settings › Users

Thirteen users across every role — Admin, Production Engineer, Approver, Viewer — with
line assignments shown as chips, creation dates, and one deactivated account with no lines
assigned. The footer states that Google sign-in is limited to accounts created here.
**Use it** to answer access-control questions in a deck or docs.

### `admin-lines` — Settings › Lines

Thirteen production lines with codes, finished vs semi-finished type, the per-line Form
Approver, product counts and status. Two rows carry problems: L-12 has no Form Approver
(flagged in the footer, because waste reports for that line cannot be signed off) and
L-13 is decommissioned. **Use it** to show the product understands a real plant's
topology, and in onboarding documentation.

### `admin-products` — Settings › Products

The product catalog with line and category filters, a search field, and Import CSV /
Add Manually actions. Eleven of 318 products across five categories with their units of
measure and assigned lines; the last row is an inactive product with no line assigned.
**Use it** wherever you discuss getting data in — the manual / CSV / database-sync story
starts on this screen.

### `admin-approval-levels` — Settings › Approval Levels

The configuration screen for the approval chain — four levels, three sequential and one
parallel, with assigned approvers as stacked avatars — above a live workflow diagram
tracing one entry from submission through Level 4, with the stuck Level 2 highlighted in
amber. Explanations of sequential vs parallel vs Form Approved sit underneath, and an
amber callout points out that Level 2 has a single approver and a queue. **Use it** as the
depth shot: it proves the workflow is configurable rather than hard-coded, which is the
usual objection.

---

## Suggested orders

**Three-image website strip** — `dashboard`, `approvals`, `waste-export`.
The whole product, the hard problem, the compliance proof.

**Five-image case study** — `login`, `dashboard`, `production`, `approvals`,
`admin-approval-levels`. Opens on the promise, shows daily use, then the workflow and its
configuration.

**Light/dark pair** — `dashboard.png` beside `dashboard-dark.png`. A pair communicates
more than two unrelated screens, and this one shows the theming holds up.

## Alt text

Descriptive alt text, ready to paste:

| Screen | Alt text |
| --- | --- |
| login | ProdLink sign-in screen with username, password and Google sign-in options |
| dashboard | ProdLink dashboard showing today's production, pending approvals, a seven-day output chart and recent entries |
| production | ProdLink production entry grid with per-product quantities, units and today/yesterday date toggles |
| waste | ProdLink waste entry form and submission history with pending, approved and rejected statuses |
| approvals | ProdLink waste approvals queue showing multi-level approval decisions and rejection comments |
| damage | ProdLink damage entry form and recent damage records by line and reason |
| waste-export | ProdLink waste report export with filters and a preview of the ISO 22000 waste disposal record |
| admin-users | ProdLink user management showing roles and per-user production line assignments |
| admin-lines | ProdLink line management listing production lines, types and form approvers |
| admin-products | ProdLink product catalog with categories, units of measure and assigned lines |
| admin-approval-levels | ProdLink approval level configuration with a diagram of the waste approval workflow |
