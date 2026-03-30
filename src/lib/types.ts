export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  service: "google" | "github" | "slack" | "system";
  scopes: string[];
  status: "success" | "failed" | "pending_approval" | "denied";
  details: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  stepUpRequired: boolean;
}

export interface ConnectedService {
  id: string;
  name: string;
  connection: string;
  icon: string;
  connected: boolean;
  scopes: string[];
  lastUsed?: string;
  tokenStatus: "active" | "expiring" | "expired" | "not_connected";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  toolCalls?: ToolCallInfo[];
}

export interface ToolCallInfo {
  name: string;
  service: string;
  scopes: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  status: "executing" | "completed" | "failed" | "awaiting_approval";
  result?: string;
}
