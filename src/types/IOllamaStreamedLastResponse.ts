export interface IOllamaStreamedLastResponse {
  model: string;
  createdAt: string;
  response: string;
  done: boolean;
  context: number[];
  totalDuration: number;
  loadDuration: number;
  promptEvalCount: number;
  promptEvalDuration: number;
  evalCount: number;
  evalDuration: number;
}
