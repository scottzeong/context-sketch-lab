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
import { createSupabaseServerClient } from "@/lib/supabase/server";

type QueueRow = {
  id: string;
  student_name: string | null;
  status: "submitted" | "under_review" | "feedback_published";
  updated_at: string;
  learning_sessions?: { title: string | null; group_name: string | null } | null;
};

const submissionStatusLabels: Record<QueueRow["status"], string> = {
  submitted: "관찰 입력 필요",
  under_review: "피드백 작성 중",
  feedback_published: "피드백 공개"
};

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

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMinutes < 1) {
    return "방금 전";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  return `${Math.floor(diffHours / 24)}일 전`;
}

export default async function TutorDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    publishedSessions,
    pendingSubmissions,
    recentTexts,
    classes,
    queueResult
  ] = await Promise.all([
    supabase
      .from("learning_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .in("status", ["submitted", "under_review"]),
    supabase
      .from("texts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStart.toISOString()),
    supabase
      .from("learning_groups")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("submissions")
      .select("id, student_name, status, updated_at, learning_sessions(title, group_name)")
      .in("status", ["submitted", "under_review"])
      .order("updated_at", { ascending: false })
      .limit(5)
  ]);

  const metrics = [
    {
      label: "진행 중 세션",
      value: String(publishedSessions.count || 0),
      detail: "공개 상태 세션",
      tone: "green"
    },
    {
      label: "검토 대기",
      value: String(pendingSubmissions.count || 0),
      detail: "제출/검토 중 제출물",
      tone: "amber"
    },
    {
      label: "이번 주 글 작성",
      value: String(recentTexts.count || 0),
      detail: "최근 7일 저장 글",
      tone: "blue"
    },
    {
      label: "운영 Class",
      value: String(classes.count || 0),
      detail: "등록된 Class",
      tone: "neutral"
    }
  ];
  const reviewQueue = (queueResult.data || []) as unknown as QueueRow[];

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
            {reviewQueue.length ? (
              reviewQueue.map((item) => (
                <article className="queue-item" key={item.id}>
                  <div>
                    <strong>{item.student_name || "학생"}</strong>
                    <p>{item.learning_sessions?.title || "제목 없는 세션"}</p>
                    <small>{item.learning_sessions?.group_name || "Class 미지정"}</small>
                  </div>
                  <div className="queue-meta">
                    <span className="status review">{submissionStatusLabels[item.status]}</span>
                    <small>
                      <Clock3 aria-hidden="true" size={14} />
                      {formatRelativeTime(item.updated_at)}
                    </small>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state compact">
                <strong>검토 대기 제출물이 없습니다.</strong>
                <p>내일부터 실제 수업 데이터를 입력하면 이 영역에 최신 제출물이 표시됩니다.</p>
              </div>
            )}
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
