import { AppShell } from "@/components/AppShell";

const sections = [
  {
    title: "관리자",
    items: [
      "Settings에서 사용자 계정과 role을 관리합니다.",
      "운영 옵션에서 연령, 난이도, 분량, 글구조, 루브릭 평가구조, 루브릭 가중치를 설정합니다.",
      "글구조와 루브릭 평가구조에는 AI 프롬프트에 사용할 설명을 직접 입력할 수 있습니다.",
      "Classes, Sessions, Texts, Reports는 참조 중심으로 확인합니다."
    ]
  },
  {
    title: "튜터",
    items: [
      "글 작성에서 AI 글 생성 또는 직접 글 입력을 선택합니다.",
      "작성한 글을 저장한 뒤 구조 분석을 실행하고 Text 저장소에 누적합니다.",
      "Class와 세션을 만들고 학생 제출물을 검토합니다.",
      "AI 피드백 초안을 만든 뒤 튜터가 수정한 최종본만 공개합니다.",
      "리포트에서 학생별 누적 기록을 편집, 저장, 인쇄 또는 PDF 출력합니다."
    ]
  },
  {
    title: "학생",
    items: [
      "배정된 세션에서 읽기 글을 확인하고 맥락 스케치를 작성합니다.",
      "스케치 이미지와 간단한 자기 설명을 제출합니다.",
      "튜터가 공개한 피드백과 포트폴리오 누적 기록을 확인합니다."
    ]
  },
  {
    title: "보호자",
    items: [
      "관리자가 연결을 승인한 학생의 공개 피드백을 확인합니다.",
      "보호자 요약 리포트를 확인하고 인쇄 또는 PDF로 저장합니다.",
      "튜터 내부 메모와 관리자 기능에는 접근할 수 없습니다."
    ]
  }
];

export default function ManualPage() {
  return (
    <AppShell
      title="Manual"
      eyebrow="Roter Faden"
      description="역할별 핵심 사용 흐름과 운영 기준을 확인합니다."
    >
      <main className="manual-page">
        <section className="manual-hero">
          <p className="eyebrow">HTML Manual</p>
          <h1>Roter Faden 매뉴얼</h1>
          <p>역할별 핵심 사용 흐름과 운영 기준을 한 화면에서 확인합니다.</p>
        </section>

        <section className="manual-grid">
          {sections.map((section) => (
            <article className="panel" key={section.title}>
              <h2>{section.title}</h2>
              <ul className="manual-list">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
