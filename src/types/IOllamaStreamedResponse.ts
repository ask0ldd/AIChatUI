export interface IOllamaStream {
  model: string;
  created_at: Date;
  response: string;
  done: boolean;
}