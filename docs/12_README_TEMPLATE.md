# README 템플릿

```md
# Context Sketch Lab / SketchFlow

튜터가 글을 생성·분석하고, 학생의 종이 맥락스케치 활동을 기반으로 관찰, 평가, 피드백, 포트폴리오를 관리하는 튜터링 기반 사고 훈련 플랫폼입니다.

## 핵심 방향

- AI는 이미지 분석을 하지 않습니다.
- 스케치 해석은 튜터가 입력합니다.
- AI는 글 생성, 글 구조 분석, 튜터 피드백 기반 평가/피드백/리포트 초안을 담당합니다.
- 튜터 승인 전 결과는 학생에게 공개되지 않습니다.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- OpenAI API
- Vercel

## Local Setup

\`\`\`bash
npm install
cp .env.example .env.local
npm run dev
\`\`\`

## Environment Variables

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-4.1-mini
\`\`\`

## v1 Scope

- Tutor dashboard
- AI text generation
- AI text structure analysis
- Session creation
- Student sketch submission
- Tutor review
- AI draft evaluation and feedback
- Portfolio
- Reports
- Manual and release notes
\`\`\`
