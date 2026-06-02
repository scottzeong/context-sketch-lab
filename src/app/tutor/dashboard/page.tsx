import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Clock3,
  FilePlus2,
  Sparkles,
  Upload
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";

const metrics = [
  { label: "진행 중 세션", value: "4", detail: "오늘 검토 2건", tone: "green" },
  { label: "승인 대기", value: "7", detail: "피드백 초안 포함", tone: "amber" },
  { label: "이번 주 글 작성", value: "12", detail: "구조 분석 9건", tone: "blue" },
  { label: "활동 학생", value: "38", detail: "3개 Class", tone: "neutral" }
];

const reviewQueue = [
  {
    student: "김민수",
    group: "9-10세 읽기 A",
    session: "발표 전의 떨림",
    status: "관찰 입력 필요",
    time: "12분 전"
  },
  {
    student: "이서윤",
    group: "11-12세 구조화 B",
    session: "작은 선택이 만든 변화",
    status: "피드백 초안 생성",
    time: "35분 전"
  },
  {
    student: "박도윤",
    group: "9-10세 읽기 A",
    session: "새 친구와 다른 기억",
    status: "승인 대기",
    time: "1시간 전"
  }
];

const workflow = [
  {
    icon: Sparkles,
    title: "글 작성",
    copy: "주제, 연령, 분량, 구조를 정해 수업용 글을 만들거나 튜터가 직접 입력합니다."
  },
  {
    icon: BookOpenText,
    title: "구조 분석",
    copy: "중심 생각, 관계, 추론 포인트, 질문 후보를 확인합니다."
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
      eyebrow="Workspace"
      description="오늘 처리할 수업 설계, 제출물 리뷰, 피드백 승인 흐름을 확인합니다."
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
              <h2>수업 운영 흐름</h2>
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
    </AppShell>
  );
}
