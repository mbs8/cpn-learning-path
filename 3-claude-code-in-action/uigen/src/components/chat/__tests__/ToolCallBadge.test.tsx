import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";
import { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: "call" | "result" = "result"
): ToolInvocation {
  if (state === "result") {
    return { state, toolCallId: "1", toolName, args, result: {} };
  }
  return { state, toolCallId: "1", toolName, args };
}

test("str_replace_editor create shows Creating <filename>", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/src/App.jsx" })} />);
  expect(screen.getByTestId("tool-call-badge").textContent).toContain("Creating App.jsx");
});

test("str_replace_editor str_replace shows Editing <filename>", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "/src/Card.tsx" })} />);
  expect(screen.getByTestId("tool-call-badge").textContent).toContain("Editing Card.tsx");
});

test("str_replace_editor insert shows Editing <filename>", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "insert", path: "/src/Card.tsx" })} />);
  expect(screen.getByTestId("tool-call-badge").textContent).toContain("Editing Card.tsx");
});

test("str_replace_editor view shows Viewing <filename>", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "/src/index.ts" })} />);
  expect(screen.getByTestId("tool-call-badge").textContent).toContain("Viewing index.ts");
});

test("str_replace_editor undo_edit shows Undoing edit to <filename>", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "undo_edit", path: "/src/App.jsx" })} />);
  expect(screen.getByTestId("tool-call-badge").textContent).toContain("Undoing edit to App.jsx");
});

test("file_manager rename shows Renaming <filename>", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("file_manager", { command: "rename", path: "/src/App.jsx", new_path: "/src/Main.jsx" })} />);
  expect(screen.getByTestId("tool-call-badge").textContent).toContain("Renaming App.jsx");
});

test("file_manager delete shows Deleting <filename>", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("file_manager", { command: "delete", path: "/src/Card.tsx" })} />);
  expect(screen.getByTestId("tool-call-badge").textContent).toContain("Deleting Card.tsx");
});

test("unknown tool falls back to raw tool name", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("some_unknown_tool", {})} />);
  expect(screen.getByTestId("tool-call-badge").textContent).toContain("some_unknown_tool");
});

test("loading state shows spinner and no green dot", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/src/App.jsx" }, "call")} />);
  expect(screen.getByTestId("tool-call-spinner")).toBeDefined();
  expect(screen.queryByTestId("tool-call-done-indicator")).toBeNull();
});

test("result state shows green dot and no spinner", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/src/App.jsx" }, "result")} />);
  expect(screen.getByTestId("tool-call-done-indicator")).toBeDefined();
  expect(screen.queryByTestId("tool-call-spinner")).toBeNull();
});
