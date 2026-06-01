import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Clock3,
  FilePlus2,
  Sparkles,
  Upload,
  Users
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";

const metrics = [
  { label: "진행 중 세션", value: "4", detail: "오늘 검토 2건", tone: "green" },
  { label: "승인 대기", value: "7", detail: "피드백 초안 포함", tone: "amber" },
  { label: "이번 주 글 생성", value: "12", detail: "구조 분석 9건", tone: "blue" },
  { label: "활동 학생", value: "38", detail: "3개 그룹", tone: "neutral" }
];

const reviewQueue = [
  {
    student: "김민수",
    group: "AGE_9_10 독해 A",
    session: "발표 전의 웃음소리",
    status: "관찰 입력 필요",
    time: "12분 전"
  },
  {
    student: "이지아",
    group: "AGE_11_12 구조화 B",
    session: "작은 선택이 만든 변화",
    status: "AI 피드백 초안 생성",
    time: "35분 전"
  },
  {
    student: "박도윤",
    group: "AGE_9_10 독해 A",
    session: "두 친구의 다른 기억",
    status: "승인 대기",
    time: "1시간 전"
  }
];

const workflow = [
  {
    icon: Sparkles,
    title: "글 생성",
    copy: "주제, 연령, 분량, 구조를 정해 수업용 글 초안을 만듭니다."
  },
  {
    icon: BookOpenText,
    title: "구조 분석",
    copy: "중심 생각, 관계, 추론 포인트, 활동지 제안을 확인합니다."
  },
  {
    icon: Upload,
    title: "학생 제출",
    copy: "학생은 종이 스케치 사진과 자기 설명을 제출합니다."
  },
  {
    icon: CheckCircle2,
    title: "튜터 승인",
    copy: "튜터 관찰을 기반으로 평가와 피드백 초안을 확정합니다."
  }
];

export default function TutorDashboardPage() {
  return (
    <AppShell
      title="Tutor Dashboard"
      eyebrow="v1 Workspace"
      description="오늘 처리할 수업 설계, 제출물 리뷰, 피드백 승인 흐름을 한 화면에서 확인합니다."
      action={
        <Link className="primary-link" href="/tutor/workbench">
          <FilePlus2 aria-hidden="true" size={18} />
          <span>새 글 만들기</span>
        </Link>
      }
    >
      <section className="metric-grid" aria-label="Tutor overview">
        {metrics.map((metric) => (
          <article className={`metric-card ${metric.tone}`} key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Review Queue</p>
              <h2>검토 대기 제출물</h2>
            </div>
            <Link className="quiet-link" href="/tutor/submissions">
              전체 보기
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>

          <div className="queue-list">
            {reviewQueue.map((item) => (
              <article className="queue-item" key={`${item.student}-${item.session}`}>
                <div>
                  <strong>{item.student}</strong>
                  <p>{item.session}</p>
                  <small>{item.group}</small>
                </div>
                <div className="queue-meta">
                  <span className="status review">{item.status}</span>
                  <small>
                    <Clock3 aria-hidden="true" size={14} />
                    {item.time}
                  </small>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Flow</p>
              <h2>v1 수업 운영 흐름</h2>
            </div>
          </div>

          <div className="flow-list">
            {workflow.map((step, index) => {
              const Icon = step.icon;

              return (
                <article className="flow-item" key={step.title}>
                  <span className="flow-index">{index + 1}</span>
                  <Icon aria-hidden="true" size={19} />
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.copy}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Next Build</p>
            <h2>다음 구현 대상</h2>
          </div>
        </div>
        <div className="next-grid">
          <div>
            <Users aria-hidden="true" size={20} />
            <strong>Supabase Auth</strong>
            <p>튜터, 학생, 관리자 역할 기반 라우팅을 연결합니다.</p>
          </div>
          <div>
            <BookOpenText aria-hidden="true" size={20} />
            <strong>Session Builder</strong>
            <p>저장된 글을 수업 세션으로 묶고 배포 상태를 관리합니다.</p>
          </div>
          <div>
            <CheckCircle2 aria-hidden="true" size={20} />
            <strong>Review Workspace</strong>
            <p>학생 제출물, 튜터 관찰, 승인 흐름을 구현합니다.</p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
