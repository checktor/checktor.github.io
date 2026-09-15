export interface ChatResponse {
  choices: Choice[],
}

interface Choice {
  finish_reason: string,
  index: number
  message: Message
}

interface Message {
  role: string,
  content: string
}
