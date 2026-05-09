import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

import { useAuth } from "@/hooks/use-auth";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import {
  getAnonWorkData,
  clearAnonWork,
} from "@/lib/anon-work-tracker";

const mockedSignIn = vi.mocked(signInAction);
const mockedSignUp = vi.mocked(signUpAction);
const mockedGetProjects = vi.mocked(getProjects);
const mockedCreateProject = vi.mocked(createProject);
const mockedGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockedClearAnonWork = vi.mocked(clearAnonWork);

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAnonWorkData.mockReturnValue(null);
    mockedGetProjects.mockResolvedValue([]);
    mockedCreateProject.mockResolvedValue({ id: "new-id" } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    test("exposes signIn, signUp, and isLoading=false", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  describe("signIn — happy paths", () => {
    test("on success with anon work, creates project from anon data, clears anon work, and navigates", async () => {
      mockedSignIn.mockResolvedValue({ success: true } as any);
      mockedGetAnonWorkData.mockReturnValue({
        messages: [{ role: "user", content: "hi" }],
        fileSystemData: { "/a.tsx": { type: "file", content: "x" } },
      } as any);
      mockedCreateProject.mockResolvedValue({ id: "anon-proj" } as any);

      const { result } = renderHook(() => useAuth());
      let returned: any;
      await act(async () => {
        returned = await result.current.signIn("a@b.com", "pw");
      });

      expect(returned).toEqual({ success: true });
      expect(mockedSignIn).toHaveBeenCalledWith("a@b.com", "pw");
      expect(mockedCreateProject).toHaveBeenCalledTimes(1);
      const arg = mockedCreateProject.mock.calls[0][0];
      expect(arg.messages).toEqual([{ role: "user", content: "hi" }]);
      expect(arg.data).toEqual({ "/a.tsx": { type: "file", content: "x" } });
      expect(arg.name).toMatch(/Design from /);
      expect(mockedClearAnonWork).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledWith("/anon-proj");
      expect(mockedGetProjects).not.toHaveBeenCalled();
    });

    test("on success with no anon work and existing projects, navigates to the first project", async () => {
      mockedSignIn.mockResolvedValue({ success: true } as any);
      mockedGetAnonWorkData.mockReturnValue(null);
      mockedGetProjects.mockResolvedValue([
        { id: "p1" },
        { id: "p2" },
      ] as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pw");
      });

      expect(mockedCreateProject).not.toHaveBeenCalled();
      expect(mockedClearAnonWork).not.toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/p1");
    });

    test("on success with no anon work and no projects, creates a new project and navigates to it", async () => {
      mockedSignIn.mockResolvedValue({ success: true } as any);
      mockedGetAnonWorkData.mockReturnValue(null);
      mockedGetProjects.mockResolvedValue([]);
      mockedCreateProject.mockResolvedValue({ id: "fresh" } as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pw");
      });

      expect(mockedCreateProject).toHaveBeenCalledTimes(1);
      const arg = mockedCreateProject.mock.calls[0][0];
      expect(arg.messages).toEqual([]);
      expect(arg.data).toEqual({});
      expect(arg.name).toMatch(/^New Design #\d+$/);
      expect(pushMock).toHaveBeenCalledWith("/fresh");
    });
  });

  describe("signIn — edge & error cases", () => {
    test("returns failure result and does no navigation/project work", async () => {
      mockedSignIn.mockResolvedValue({
        success: false,
        error: "bad creds",
      } as any);

      const { result } = renderHook(() => useAuth());
      let returned: any;
      await act(async () => {
        returned = await result.current.signIn("a@b.com", "wrong");
      });

      expect(returned).toEqual({ success: false, error: "bad creds" });
      expect(mockedGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockedGetProjects).not.toHaveBeenCalled();
      expect(mockedCreateProject).not.toHaveBeenCalled();
      expect(mockedClearAnonWork).not.toHaveBeenCalled();
      expect(pushMock).not.toHaveBeenCalled();
    });

    test("anon work present but with empty messages array falls through to projects path", async () => {
      mockedSignIn.mockResolvedValue({ success: true } as any);
      mockedGetAnonWorkData.mockReturnValue({
        messages: [],
        fileSystemData: {},
      } as any);
      mockedGetProjects.mockResolvedValue([{ id: "p-existing" }] as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pw");
      });

      expect(mockedClearAnonWork).not.toHaveBeenCalled();
      expect(mockedCreateProject).not.toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/p-existing");
    });

    test("resets isLoading to false even when the action throws", async () => {
      mockedSignIn.mockRejectedValue(new Error("network down"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await expect(
          result.current.signIn("a@b.com", "pw")
        ).rejects.toThrow("network down");
      });

      expect(result.current.isLoading).toBe(false);
      expect(pushMock).not.toHaveBeenCalled();
    });

    test("isLoading is true while the action is pending and false after it resolves", async () => {
      let resolveAction: (v: any) => void = () => {};
      mockedSignIn.mockImplementation(
        () =>
          new Promise((res) => {
            resolveAction = res;
          })
      );

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("a@b.com", "pw");
      });

      await waitFor(() => expect(result.current.isLoading).toBe(true));

      await act(async () => {
        resolveAction({ success: false });
        await signInPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    test("on success, runs the post-sign-in flow (uses anon work when available)", async () => {
      mockedSignUp.mockResolvedValue({ success: true } as any);
      mockedGetAnonWorkData.mockReturnValue({
        messages: [{ role: "user", content: "hello" }],
        fileSystemData: {},
      } as any);
      mockedCreateProject.mockResolvedValue({ id: "signup-proj" } as any);

      const { result } = renderHook(() => useAuth());
      let returned: any;
      await act(async () => {
        returned = await result.current.signUp("a@b.com", "pw");
      });

      expect(returned).toEqual({ success: true });
      expect(mockedSignUp).toHaveBeenCalledWith("a@b.com", "pw");
      expect(mockedClearAnonWork).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledWith("/signup-proj");
    });

    test("on failure, returns the result and skips post-sign-in work", async () => {
      mockedSignUp.mockResolvedValue({
        success: false,
        error: "email taken",
      } as any);

      const { result } = renderHook(() => useAuth());
      let returned: any;
      await act(async () => {
        returned = await result.current.signUp("a@b.com", "pw");
      });

      expect(returned).toEqual({ success: false, error: "email taken" });
      expect(mockedGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockedCreateProject).not.toHaveBeenCalled();
      expect(pushMock).not.toHaveBeenCalled();
    });

    test("resets isLoading to false even when signUp throws", async () => {
      mockedSignUp.mockRejectedValue(new Error("server error"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await expect(
          result.current.signUp("a@b.com", "pw")
        ).rejects.toThrow("server error");
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
