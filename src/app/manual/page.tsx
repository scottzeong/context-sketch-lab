import Link from "next/link";

const sections = [
  {
    title: "관리자",
    items: [
      "사용자 계정을 생성하고 역할을 admin, tutor, student, parent로 지정합니다.",
      "글 작성 화면의 연령, 난이도, 분량, 글 구조 드롭다운 메뉴를 추가, 수정, 삭제합니다.",
      "보호자와 학생 연결을 승인하고 계정 상태를 활성 또는 비활성으로 관리합니다."
    ]
  },
  {
    title: "튜터",
    items: [
      "글 작성에서 AI 글 생성 또는 직접 글 입력을 선택합니다.",
      "작성된 글을 구조 분석한 뒤 Text 저장소에 저장하고 수업 세션에 연결합니다.",
      "학생 제출물을 확인하고 관찰, 강점, 오해, 다음 과제를 입력해 피드백 초안을 만듭니다.",
      "리포트 메뉴에서 학생별 누적 기록을 편집, 저장, 인쇄 또는 PDF 출력합니다."
    ]
  },
  {
    title: "학생",
    items: [
      "배정된 세션에서 읽기 글을 확인하고 종이에 맥락 스케치를 작성합니다.",
      "스케치 사진과 간단한 설명을 제출합니다.",
      "튜터가 공개한 피드백과 포트폴리오 누적 기록을 확인합니다."
    ]
  },
  {
    title: "보호자",
    items: [
      "관리자가 연결한 학생의 공개 피드백과 요약 리포트를 확인합니다.",
      "튜터 내부 메모나 관리자 기능에는 접근할 수 없습니다."
    ]
  }
];

export default function ManualPage() {
  return (
    <main className="manual-page">
      <section className="manual-hero">
        <p className="eyebrow">HTML Manual</p>
        <h1>Roter Faden 매뉴얼</h1>
        <p>역할별 핵심 사용 흐름과 운영 기준을 한 화면에서 확인합니다.</p>
        <Link className="primary-link" href="/login">
          로그인으로 이동
        </Link>
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
  );
}
