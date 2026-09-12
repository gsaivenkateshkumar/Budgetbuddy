import { apiFetch } from "./client";
import { getToken } from "@/lib/auth/session";

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface AIStatus {
  configured: boolean;
  provider: string;
}

export function getAIStatus(): Promise<AIStatus> {
  return apiFetch<AIStatus>("/ai/status");
}

export interface ChatMessageIn {
  role: "user" | "assistant";
  content: string;
}

export interface ToolCallSummary {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatResponse {
  reply: string;
  tool_calls: ToolCallSummary[];
}

export function sendChatMessage(
  message: string,
  history: ChatMessageIn[],
  businessId?: number
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/ai/chat", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message, history, business_id: businessId ?? null }),
  });
}
