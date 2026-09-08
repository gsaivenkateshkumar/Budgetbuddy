import { apiFetch } from "./client";

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

export function sendChatMessage(message: string, history: ChatMessageIn[]): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
}
