# Roter Faden

Roter Faden is a tutor-led reading and thinking workflow for generating learning texts, analyzing their structure, guiding paper-based context sketch activities, and turning tutor observations into feedback, evaluation, portfolios, and reports.

## v1 Direction

The product direction changed from AI image interpretation to tutor-led sketch interpretation.

- AI does not analyze children's sketch images.
- Tutors review sketches and enter observations, key connections, misconceptions, strengths, and next steps.
- AI supports text generation, text structure analysis, rubric draft evaluation, feedback drafts, and report drafts.
- AI outputs are drafts. Tutors edit and approve before anything is shown to students or parents.

## Core AI Roles

- Text Generator Agent
- Text Structure Analyzer Agent
- Tutor Feedback Evaluation Agent
- Feedback Writer Agent
- Report Draft Agent

## Tech Stack

- Next.js App Router
- TypeScript
- Supabase Auth/Postgres/Storage/RLS
- OpenAI API
- Vercel

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Current Status

The documentation has been revised for the new v1 scope. The existing local prototype still contains the earlier Phase 0 image-analysis spike and should be replaced next with the text generation, text structure analysis, and tutor feedback evaluation spike described in `/docs`.

