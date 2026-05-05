"use client";

import { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

function getLabel(toolName: string, args: Record<string, unknown>): string {
  const filename = args.path
    ? String(args.path).split("/").pop() ?? String(args.path)
    : null;

  if (toolName === "str_replace_editor" && filename) {
    switch (args.command) {
      case "create":
        return `Creating ${filename}`;
      case "str_replace":
      case "insert":
        return `Editing ${filename}`;
      case "view":
        return `Viewing ${filename}`;
      case "undo_edit":
        return `Undoing edit to ${filename}`;
    }
  }

  if (toolName === "file_manager" && filename) {
    switch (args.command) {
      case "rename":
        return `Renaming ${filename}`;
      case "delete":
        return `Deleting ${filename}`;
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const isDone = toolInvocation.state === "result";
  const label = getLabel(toolInvocation.toolName, toolInvocation.args as Record<string, unknown>);

  return (
    <div
      data-testid="tool-call-badge"
      className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200"
    >
      {isDone ? (
        <div data-testid="tool-call-done-indicator" className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 data-testid="tool-call-spinner" className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
