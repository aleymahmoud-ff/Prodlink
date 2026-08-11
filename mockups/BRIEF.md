# ProdLink — Screenshot Mockup Brief

Section 0 of the UI Screenshot Mockup Prompt Kit, filled in from the real ProdLink
codebase. Everything the generated screens use comes from here.

```text
PRODUCT NAME:      ProdLink
ONE-LINE PITCH:    Production data collection for pastry factories — production,
                   waste, damage and reprocessing captured on the line, with a
                   multi-level waste approval workflow and ISO-compliant PDF forms.
PRIMARY USER:      Production Engineer on an assigned line; Admin configures the system
DEMO PERSONA:      Rania Fadel — Admin (Plant Systems)
DEMO ORG/TENANT:   Golden Crust Pastries Co.

SCREENS (11):      Login, Dashboard, Production Entry, Waste Entry, Waste Approvals,
                   Damage Entry, Export Waste Report, Settings › Users,
                   Settings › Lines, Settings › Products, Settings › Approval Levels

BRAND
  primary colour:  #2563eb  (blue-600 — page header tiles, admin active tab)
  logo gradient:   #6366f1 → #9333ea  (indigo-500 → purple-600, the sidebar mark)
  accent colours:  indigo #6366f1 · emerald #10b981 · rose #f43f5e · amber #f59e0b ·
                   purple #a855f7 · cyan #06b6d4 · blue #3b82f6 · slate #64748b
                   (these are the real per-nav-item tints in Sidebar.tsx)
  neutrals:        page #f6f8fb · card #ffffff · border #e2e8f0 · text #0f172a ·
                   muted #64748b · inner surface #f8fafc
  font:            system UI stack (matches globals.css — no webfont to inline)
  corner radius:   12px controls · 16px cards  (rounded-xl / rounded-2xl)
  logo:            wordmark "ProdLink" + "Production Manager", three-box glyph in a
                   gradient tile

APP SHELL
  navigation:      left sidebar 288px + per-page sticky header (as built)
  nav items:       Dashboard · Production · Waste · Damage · Reprocessing · Approvals
                   — then an "Admin" group with Settings (admin role only)
  header shows:    page icon tile, page title, subtitle, and per-page actions on the right
  sidebar footer:  signed-in user card — avatar, full name, email, role pill

DEMO DATA (all fictional)
  people:          Rania Fadel (Admin) · Omar Kassab (Production Engineer) ·
                   Layla Nasser (Production Engineer) · Sami Rahal (Production Engineer) ·
                   Tarek Mansour (Approver, Shift Supervisor) ·
                   Hana Darwish (Approver, QA Manager) ·
                   Fouad Chami (Approver, Plant Manager) · Dina Aboud (Viewer)
  lines:           L-01 Croissant Line 1 (finished) · L-02 Croissant Line 2 (finished) ·
                   L-03 Danish Pastry Line (finished) · L-04 Puff Pastry Sheeting (semi) ·
                   L-05 Baklava Line (finished) · L-06 Cake Sponge Line (semi) ·
                   L-07 Filling & Cream Prep (semi) · L-08 Petit Four Line (finished) ·
                   L-09 Biscuit Line (finished) · L-10 Dough Mixing Hall (semi)
  products:        PF-1042 Butter Croissant 60g · PF-1043 Mini Croissant 25g ·
                   PF-1088 Pain au Chocolat 70g · PF-2011 Cheese Danish 80g ·
                   PF-2014 Apricot Danish 80g · PF-4102 Baklava Assorted 1kg ·
                   PF-4110 Kunafa Tray 2kg · PF-6120 Petit Four Box 24pc ·
                   PF-7005 Vanilla Sponge Sheet · SF-3301 Puff Pastry Sheet 5kg ·
                   SF-3308 Croissant Dough Block · SF-5001 Vanilla Cream Base
  domain nouns:    line · product · production entry · waste entry · damage entry ·
                   reprocessing entry · reason · approval level · batch number ·
                   unit of measure · production date
  waste reasons:   Expired shelf life · Contamination risk · Burnt / over-baked ·
                   Fallen on floor · Failed QA inspection · Oven malfunction ·
                   Packaging failure
  damage reasons:  Crushed in transfer · Deformed shape · Cracked surface ·
                   Torn packaging · Underweight portion
  reproc. reasons: Rework into dough · Re-sheeting · Re-cream filling · Re-pack ·
                   Trim recovery
  approval levels: L1 Shift Supervisor (sequential) · L2 QA Manager (sequential) ·
                   L3 Plant Manager (sequential) · L4 Finance Controller (parallel)
  units:           Unit / Piece · Kilogram (kg) · Gram (g) · Liter (L) · Milliliter (ml) ·
                   Box · Carton · Tray   (exactly the UNIT_OPTIONS list in the app)
  plausible sizes: 18,472 units produced today · 7 pending approvals · 214.6 kg waste ·
                   96 reprocessing entries · 24 lines · 318 products · 41 users
```

## Vocabulary rules applied

Every nav label, column header, badge and button string below was taken verbatim from
`src/shared/i18n/locales/en.json` or from the page components:

| Where | Strings used |
| --- | --- |
| Nav | Dashboard, Production, Waste, Damage, Reprocessing, Approvals, Settings |
| Dashboard | Today's Production, Pending Approvals, Today's Waste, Reprocessing, Recent Activity, Welcome back |
| Production | Filter Production Line, Line Type, Production Line, Products for …, Set all rows, All to Today, All to Yesterday, Code, Product, Date, Quantity, Unit, My Total, All Users, Save Entries, Show History, Exceptional Entry, Production date, Recorded at, Recorded By |
| Waste | Waste Entry, Approval Required, New Entry, Waste Reason, Submit for Approval, Batch Number, Pending/Approved/Rejected |
| Approvals | Waste Approvals, Filter by Status, Waste Entries, Approve to L2, Reject, Mark Form Signed |
| Export | Export Waste Report, Report Filters, About Waste Reports |
| Settings | General, Users, Lines, Products, Reasons, Approval Levels, System Status |

## Deliberate departures

Two places where the mockups show more than the shipped UI, because a marketing shot
of a mostly-empty dashboard sells nothing:

1. **Dashboard** adds a 7-day output chart, a waste-by-reason breakdown and a line
   status list next to the real stat cards and Recent Activity feed. The data is all
   data ProdLink already stores; the charts are the "advanced dashboards" listed as a
   future enhancement in `REQUIREMENTS.md` §6.
2. **Login** shows the animated gradient background from `globals.css` as a static
   composition, since a screenshot cannot animate.

Everything else is a faithful rendering of what the app does today.
