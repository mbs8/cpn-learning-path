import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "@/app/main-content";

vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <>{children}</>,
  useFileSystem: () => ({
    getFileTree: () => [],
    selectedFile: null,
    setSelectedFile: vi.fn(),
    files: new Map(),
    refreshTrigger: 0,
  }),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <>{children}</>,
  useChat: () => ({
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    status: "ready",
  }),
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface" />,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree" />,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor" />,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame" />,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions" />,
}));

afterEach(() => {
  cleanup();
});

test("renders Preview view by default", () => {
  render(<MainContent />);

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();

  const previewTab = screen.getByRole("tab", { name: "Preview" });
  expect(previewTab.getAttribute("data-state")).toBe("active");
});

test("clicking Code tab switches to code view", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const codeTab = screen.getByRole("tab", { name: "Code" });
  await user.click(codeTab);

  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.queryByTestId("preview-frame")).toBeNull();
  expect(codeTab.getAttribute("data-state")).toBe("active");
});

test("clicking Preview after Code switches back", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const codeTab = screen.getByRole("tab", { name: "Code" });
  const previewTab = screen.getByRole("tab", { name: "Preview" });

  await user.click(codeTab);
  expect(codeTab.getAttribute("data-state")).toBe("active");

  await user.click(previewTab);
  expect(previewTab.getAttribute("data-state")).toBe("active");
  expect(screen.getByTestId("preview-frame")).toBeDefined();
});

test("toggle is a controlled component — repeated clicks keep correct active state", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const codeTab = screen.getByRole("tab", { name: "Code" });
  const previewTab = screen.getByRole("tab", { name: "Preview" });

  for (let i = 0; i < 3; i++) {
    await user.click(codeTab);
    expect(codeTab.getAttribute("data-state")).toBe("active");
    expect(previewTab.getAttribute("data-state")).toBe("inactive");

    await user.click(previewTab);
    expect(previewTab.getAttribute("data-state")).toBe("active");
    expect(codeTab.getAttribute("data-state")).toBe("inactive");
  }
});
