# ProdLink — Product Overview

**ProdLink is a bilingual production data collection app for factories — it replaces the
paper forms on the line with real-time entry, a configurable multi-level waste approval
chain, and ISO-ready disposal records.**

**What problem it solves** — Factories running 24/7 across dozens of lines still capture
production, waste, damage and reprocessing on paper. Sheets get lost between shifts,
totals are re-keyed into spreadsheets days later, and when an auditor asks who authorised
a disposal, the answer is a signature on a form in a drawer. ProdLink moves capture to the
moment and place it happens, and keeps the approval trail attached to the record instead
of alongside it.

**Methodology / approach** — One shared entry model across four record types — production,
waste, damage, reprocessing — each carrying line, product, quantity, unit of measure,
batch/lot number, reason and notes, with the user and timestamp captured automatically.
Only waste carries an approval workflow, because it is the only record with a compliance
obligation; damage and reprocessing are recorded and routed. Everything structural — lines,
products, reason lists, approval levels and their approvers — is admin-configured rather
than hard-coded, so the app matches the plant's actual topology instead of the other way
round. Production is recorded against a **factory day** rather than an insertion
timestamp, so a shift that crosses midnight still books to the day it belongs to.

**Who it's for** — Production engineers entering data for their assigned lines; shift
supervisors, QA managers and plant managers approving waste; admins configuring the plant;
managers and viewers reading dashboards. Access is scoped two ways at once — by role
(admin, production engineer, approver, viewer) and by line assignment — so an engineer only
ever sees the lines they actually work.

**How it works** — 1) An admin sets up production lines (finished vs semi-finished),
products (manual entry or CSV/Excel import), reason lists per record type, and the approval
chain; 2) an engineer picks a line and enters quantities for all of that line's products in
a single grid, flipping any row to yesterday when a shift crossed midnight; 3) waste entries
submit into the approval chain — sequential levels one at a time, or parallel where every
approver on a level signs at once; 4) approvers approve or reject with a comment from the
approvals queue, and each entry shows exactly where it is in the chain; 5) once the chain
clears, export the filtered PDF waste report, collect the physical signatures, and mark
**Form Approved** so the digital and paper records agree.

**Main outputs** — Per-line production totals with a live "my entries vs all users" split,
so two engineers on the same line never double-count; a waste queue with per-level approval
state, approver names and rejection comments; damage and reprocessing registers by line,
product and reason; a filterable **ISO 22000 waste disposal record (WD-04)** as a printable
PDF carrying batch numbers, reasons and the approver at each level, with signature blocks;
and a dashboard of today's production, pending approvals, waste and reprocessing with a
recent-activity feed across all four record types.

**Key benefits** — **Fast** — a whole line's output is one grid and one Save, not one form
per product. **Accountable** — every record carries who entered it and when, and every waste
disposal carries who approved it at which level. **Audit-ready** — the ISO form comes out of
the same data the floor entered, so the paper record and the database cannot drift.
**Configurable** — approval depth, sequential vs parallel, reason lists and per-line
signatories are settings, not code changes. **Bilingual** — full Arabic and English with a
per-user switch and an admin-set default, for floors that operate in both. **Access-safe** —
role-based permissions plus line-level scoping, so data entry stays in the right hands.

**On the roadmap** — PWA install manifest and push notifications for approvers; external
database sync for the product master (including Microsoft 365 F&O as a source); push-back of
entries to the ERP; and advanced trend dashboards. Offline capture is explicitly out of
scope — ProdLink needs a connection.

---

*Illustrative screenshots of every screen described above are in this folder — see
`CATALOG.md` for what each one shows.*
