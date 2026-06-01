import {
  getStoredSubmissions,
  StoredSubmissionRecord
} from "@/lib/submissionRepository";
import {
  getReviewForSubmission,
  StoredTutorReviewRecord
} from "@/lib/reviewRepository";

export type PortfolioEntry = {
  submission: StoredSubmissionRecord;
  review: StoredTutorReviewRecord;
};

export async function getPublishedPortfolioEntries(): Promise<PortfolioEntry[]> {
  const submissions = await getStoredSubmissions();
  const entries = await Promise.all(
    submissions
    .filter((submission) => submission.status === "feedback_published")
    .map((submission) => {
      return getReviewForSubmission(submission.id).then((review) => {
      return review?.status === "published" ? { submission, review } : null;
      });
    })
  );

  return entries.filter((entry): entry is PortfolioEntry => Boolean(entry));
}

export async function getPublishedFeedbackForSubmission(submissionId: string) {
  const submission = (await getStoredSubmissions()).find(
    (item) => item.id === submissionId
  );

  if (!submission || submission.status !== "feedback_published") {
    return null;
  }

  const review = await getReviewForSubmission(submission.id);

  if (!review || review.status !== "published") {
    return null;
  }

  return { submission, review };
}
