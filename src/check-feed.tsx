import { Action, ActionPanel, Form, List } from "@raycast/api";
import { useState } from "react";
import { auditFeedText, type AuditReport, type ItemReport } from "./feed";

type FormValues = {
  feed: string;
};

function itemTitle(item: ItemReport): string {
  return item.title || item.id || "(no id)";
}

function FeedResult({ report, onReset }: { report: AuditReport; onReset: () => void }) {
  const feedErrors = report.errors.map((row) => row.message).join(" ");
  return (
    <List
      searchBarPlaceholder="Filter products"
      actions={
        <ActionPanel>
          <Action title="Check another feed" onAction={onReset} />
        </ActionPanel>
      }
    >
      {feedErrors ? <List.Item title="Feed" subtitle={feedErrors} /> : null}
      {report.items.map((item, index) => {
        const errors = item.findings.filter((row) => row.severity === "error").length;
        const warnings = item.findings.length - errors;
        const subtitle = item.findings.length
          ? item.findings.map((row) => row.code).join(", ")
          : "No finding";
        return (
          <List.Item
            key={item.id + ":" + String(index)}
            title={itemTitle(item)}
            subtitle={subtitle}
            accessories={[{ text: String(errors) + " errors, " + String(warnings) + " warnings" }]}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard
                  title="Copy findings"
                  content={itemTitle(item) + "\n" + (item.findings.map((row) => row.message).join("\n") || "No finding")}
                />
                <Action title="Check another feed" onAction={onReset} />
              </ActionPanel>
            }
          />
        );
      })}
      {!report.items.length && !feedErrors ? <List.EmptyView title="No product row" /> : null}
    </List>
  );
}

export default function Command() {
  const [report, setReport] = useState<AuditReport | null>(null);

  if (report) {
    return <FeedResult report={report} onReset={() => setReport(null)} />;
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Check feed"
            onSubmit={(values: FormValues) => {
              setReport(auditFeedText(values.feed));
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Description text="At most 500 products. The text stays on this machine. This does not sign in to Merchant Center." />
      <Form.TextArea id="feed" title="Feed" placeholder="Paste RSS, Atom, or CSV." />
    </Form>
  );
}
