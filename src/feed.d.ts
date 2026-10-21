export interface Finding {
  code: string;
  severity: "error" | "warning";
  field: string;
  message: string;
}

export interface ItemReport {
  id: string;
  title: string;
  suggestedTitle: string;
  findings: Finding[];
}

export interface AuditReport {
  ok: boolean;
  format: string;
  truncated: boolean;
  errors: Finding[];
  items: ItemReport[];
  counts: { items: number; errors: number; warnings: number };
}

export function auditFeedText(text: string, maxItems?: number): AuditReport;
