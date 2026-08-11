# Product Overview Prompt Kit

A product-agnostic prompt set for generating the **one-page product write-up** — the
paragraph-per-question summary you put at the top of a README, in a pitch deck, on an
about page, in an RFP response, or in front of a stakeholder who has ninety seconds.

Works in any AI tool that can read text: ChatGPT, Claude, Claude Code, Gemini, Copilot,
Cursor, Windsurf, DeepSeek, Perplexity — anything that returns prose.

**What you get:** six labelled sections — problem, approach, audience, how it works,
outputs, benefits — in a fixed order, each one a tight paragraph, plus a separate roadmap
line so nothing in the main body overclaims.

**Why a fixed format:** every reader is looking for a different one of those six things.
A fixed order lets them jump straight to theirs. It also makes two products directly
comparable, which is what a portfolio, a product catalogue or a board pack actually needs.

---

## 0. Fill in this brief first

Everything in `{{DOUBLE_BRACES}}` below is replaced from this brief. The single biggest
quality lever is section **EVIDENCE** — a write-up derived from the real thing reads
completely differently from one derived from a description of the real thing.

```text
PRODUCT NAME:      {{e.g. Northwind Ops}}
CATEGORY:          {{what kind of thing it is — app, platform, CLI, service, library}}
ONE-LINE PITCH:    {{what it does, for whom — one sentence, no adjectives}}

EVIDENCE (point the tool at the truth, in priority order)
  codebase:        {{repo path or "attached" — the strongest source by far}}
  requirements:    {{path to a requirements/spec/PRD doc}}
  UI strings:      {{path to i18n files, or the screens themselves}}
  schema:          {{path to the DB schema or data model}}
  existing copy:   {{website, deck, README — treat as claims to verify, not facts}}

AUDIENCE
  primary reader:  {{who this write-up is for — buyer, engineer, auditor, investor}}
  their question:  {{the one thing they need answered}}
  reading context: {{README top / deck slide / sales one-pager / RFP section}}

SUBSTANCE
  problem today:   {{how people do this now, and precisely why that hurts}}
  key mechanism:   {{the one design decision that makes this work — the thing to explain}}
  roles/personas:  {{who touches it, and what each one does}}
  main workflow:   {{the 4-6 steps from empty state to delivered value}}
  outputs:         {{the concrete artifacts a user walks away with}}
  differentiators: {{3-6, each phrased as a benefit with the reason attached}}

BOUNDARIES (this is what keeps the write-up honest)
  shipped:         {{what actually works today}}
  roadmap:         {{built-ish, planned, or promised but not there yet}}
  out of scope:    {{things people will assume you do, that you deliberately do not}}

CONSTRAINTS
  length:          {{~450 words default; 250 for a slide, 800 for an RFP}}
  tone:            {{plain and specific / formal / technical}}
  region/locale:   {{spelling, currency, date format, languages supported}}
```

Two rules that decide whether it reads as real:

1. **Use the product's own nouns.** If the app says "production line", "waste entry",
   "approval level", the write-up says those words. Generic substitutes ("items",
   "records", "workflow steps") are the tell that nobody looked at the product.
2. **Every claim needs a mechanism.** "Fast" is a slogan. "A whole line's output is one
   grid and one Save, not one form per product" is a claim a reader can check. The
   benefits section is where write-ups go soft — hold the line there.

---

## 1. Master prompt — paste once

```text
You are a product writer producing a one-page overview of a piece of software, for a
reader who has ninety seconds and a specific question.

SOURCE OF TRUTH
{{Point at the evidence: "Read the codebase at ./src", "Use the attached requirements
doc", "The UI strings are in ./locales/en.json"}}
Derive every factual claim from that source. Where the source is silent, ask me rather
than inventing. Where the source contradicts existing marketing copy, trust the source
and tell me about the contradiction.

OUTPUT FORMAT — exactly this, in this order
A one-sentence bolded opening line: what the product is, for whom, in plain words.
Then six labelled paragraphs:
  - What problem it solves — how the job is done today and precisely why that hurts.
    Concrete failure, not abstract inefficiency.
  - Methodology / approach — the design decisions that make it work. This is the section
    that proves you understand the product; spend your best sentences here.
  - Who it's for — the roles that touch it and what each one does. Include how access or
    permissions differ between them if that is a real distinction.
  - How it works — the path from empty state to delivered value as 4-6 numbered steps
    inside one paragraph. Steps must be things a user does, not features that exist.
  - Main outputs — the concrete artifacts a user walks away with. Name them the way the
    product names them, including file formats, report names and identifiers.
  - Key benefits — 4-6, each one a short bolded label followed by the mechanism that
    earns it. A benefit with no mechanism attached gets cut.
Then, separately and last, one short "On the roadmap" paragraph for anything not shipped,
and one sentence for anything deliberately out of scope.

HARD RULES
- The six sections describe only what exists today. Anything planned, partial, or
  promised goes in the roadmap paragraph — never in the body, never hedged into the body
  with "designed to" or "can be extended to".
- Use the product's exact vocabulary for every domain noun, screen name and role.
- No adjective survives without evidence. Cut "powerful", "seamless", "robust",
  "cutting-edge", "revolutionary", "state-of-the-art", "game-changing" outright.
- No invented numbers. No customer names, logos or quotes unless I supply them. No
  performance figures, percentages or time savings unless they are in the source.
- Concrete over abstract everywhere: name the file format, the role, the record type.
- Plain sentences. No em-dash-heavy stacking, no rhetorical questions, no "Imagine if…",
  no closing call to action.
- Target {{450}} words for the six sections, excluding the roadmap paragraph.

BEFORE YOU WRITE
List, in three bullets, the strongest specific detail you found for the approach section,
the outputs section, and the benefits section. If any of the three is weak or missing,
say so and ask me for it. Then write the overview.
```

> If your tool cannot read the source, paste the requirements doc and the UI string file
> into the conversation before the master prompt. A write-up from a description of a
> product is roughly half as good as one from the product.

---

## 2. Variants — same brief, different reader

Run these after the master prompt, in the same conversation, so they inherit the facts.

```text
Cut this to {{250}} words for a single slide. Keep the opening line, the problem, and
three benefits with their mechanisms. Drop the roadmap paragraph.
```
```text
Rewrite for a {{technical evaluator}}: lead with the data model and the mechanism, name
the actual formats, protocols and integration points, and drop the benefits framing.
```
```text
Rewrite for an {{RFP response}} at {{800}} words: expand "how it works" into the full
path including administration and setup, and expand the outputs section to name every
artifact and its format. Add a compliance sentence to any section that touches an
auditable record.
```
```text
Produce a comparison-ready version: same six sections, but every paragraph under 60 words
so this product can sit in a table beside {{N}} others.
```
```text
Now write the 40-word and 15-word versions, for a directory listing and a page subtitle.
```

---

## 3. Fix-up prompts

Paste these when the first attempt misses. These are the failures that actually happen:

```text
The benefits section is slogans. Every benefit must name the mechanism that earns it —
"fast because a whole line is one grid and one Save" not "fast". Cut any benefit you
cannot attach a mechanism to, even if that leaves fewer than I asked for.
```
```text
This describes features, not the job. Rewrite "how it works" as the path a real
{{role}} takes on a real day, from the moment they open it to the moment they have what
they came for.
```
```text
You have claimed {{X}}, which is on the roadmap, not shipped. Move it to the roadmap
paragraph and re-check every other claim in the body against the source the same way.
```
```text
The vocabulary is generic. Replace {{"records", "items", "users"}} with the product's own
terms — pull them from {{the nav labels and column headers}} and use them word for word.
```
```text
The approach section restates the feature list. Instead, explain the one design decision
that makes this work and why it was made that way — the thing a competitor would get
wrong.
```
```text
Too abstract. For each of the six sections, replace the vaguest sentence with a specific:
a named artifact, a named role, a named format, or a real constraint.
```
```text
This reads like AI marketing copy. Remove every adjective that is not doing factual work,
break up the stacked clauses, and delete anything that sounds like it was written to
impress rather than to inform.
```

---

## 4. Notes per tool

- **Agentic coding tools (Claude Code, Cursor, Windsurf, Copilot agent):** these can read
  the repo, which is the whole game. Say "read the requirements doc, the i18n strings and
  the DB schema before writing" and the vocabulary comes out right for free. Ask for the
  three-bullet evidence list first — if it cannot find a strong detail for the outputs
  section, that is a real finding about the product, not a prompting failure.
- **Chat-only tools (ChatGPT, Claude, Gemini, DeepSeek):** paste the requirements doc and
  the UI strings as attachments before the master prompt. Without them you will get a
  competent write-up of a generic product in your category.
- **Search-grounded tools (Perplexity, ChatGPT with browsing):** useful for the "problem
  today" paragraph only — how the job is currently done in that industry. Do not let them
  source anything about *your* product from the web; they will find your own old copy and
  launder it back to you as fact.
- **Any tool:** if the output would fit any competitor with the product name swapped, it
  has failed. That swap test is the fastest quality check there is.

---

## 5. Pre-flight checklist

Before this goes anywhere:

- [ ] Swap test: replacing the product name with a competitor's makes it read false
- [ ] Every claim in the six sections is shipped, not planned
- [ ] Every benefit has a mechanism attached
- [ ] Domain nouns match the product's own words exactly
- [ ] No invented numbers, customers, quotes or performance figures
- [ ] "How it works" is steps a person takes, not features that exist
- [ ] Outputs are named as artifacts, with formats
- [ ] Read aloud without wincing; no unearned adjectives left
- [ ] Someone who has used the product agrees it is accurate
- [ ] Length matches where it is going

---

## 6. Worked example

`PRODUCT-OVERVIEW-EXAMPLE.md` in this folder is this kit fully filled in for a real
product (ProdLink, a factory production data collection app), written from its codebase,
requirements doc and i18n strings. Read it alongside the blank kit when you are unsure how
specific a section should get — the answer is almost always "more specific than you think".

Two things it does that are worth copying:

- The approach paragraph explains **factory day** — one design decision, explained once,
  that makes the rest of the product make sense. Every good overview has one of these.
- The roadmap paragraph names five unshipped things plainly, including one the product
  deliberately will not do. Being explicit about the boundary makes the shipped claims
  more credible, not less.
