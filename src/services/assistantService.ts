import { api } from '@/services/api'

export interface AssistantChatRequest {
  message: string
  policy_type?: string
  top_k?: number
}

export interface AssistantSource {
  document_id: string
  policy_type: string
  title: string
  category: string
  source: string
  similarity: number
}

export interface AssistantChatResponse {
  answer: string
  sources: AssistantSource[]
  model?: string
}

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: AssistantSource[]
  createdAt?: string
}

export async function askAssistant(
  request: AssistantChatRequest,
): Promise<AssistantChatResponse> {
  return api.post<AssistantChatResponse>('/api/v1/assistant/chat', request)
}
