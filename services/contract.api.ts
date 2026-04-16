import api from "./lib/axios";

export interface FeedbackConfiguration {
  isCommentsActivated: boolean;
  feedbackTitle: string;
  feedbackSubTitle: string;
  isNoteActivated: boolean;
}

export interface ContractConfigResponse {
  feedbackConfiguration: FeedbackConfiguration | null;
  appVersion: string;
}

export interface FeedbackSubmitBody {
  score?: number;
  comment?: string;
  skip: boolean;
}

export async function submitFeedback(body: FeedbackSubmitBody): Promise<void> {
  console.log("══════════════════════════════════════");
  console.log("🌐 POST /api/contract/config/feedback", JSON.stringify(body));
  console.log("══════════════════════════════════════");

  await api.post("/api/contract/config/feedback", body);

  console.log("✅ Feedback submitted successfully");
}

export async function getContractConfig(): Promise<ContractConfigResponse> {
  console.log("══════════════════════════════════════");
  console.log("🌐 GET /api/contract/config");
  console.log("══════════════════════════════════════");

  const res = await api.get<ContractConfigResponse>("/api/contract/config");

  console.log("══════════════════════════════════════");
  console.log("📥 CONTRACT CONFIG RESPONSE:", JSON.stringify(res.data, null, 2));
  console.log("══════════════════════════════════════");

  return res.data;
}
