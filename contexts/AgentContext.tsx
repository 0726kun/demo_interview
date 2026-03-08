"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type AgentMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  followUpAction?: {
    clientId: string;
    clientName: string;
    date: string;
    method: string;
    content: string;
  };
  navigatePath?: string;
};

export type PendingFollowUp = {
  clientId: string;
  date: string;
  method: string;
  content: string;
};

type AgentContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  messages: AgentMessage[];
  sendMessage: (text: string) => Promise<void>;
  pendingFollowUp: PendingFollowUp | null;
  setPendingFollowUp: (v: PendingFollowUp | null) => void;
  clearPendingFollowUp: () => void;
};

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [pendingFollowUp, setPendingFollowUpState] = useState<PendingFollowUp | null>(null);

  const clearPendingFollowUp = useCallback(() => setPendingFollowUpState(null), []);

  const setPendingFollowUp = useCallback(
    (data: PendingFollowUp | null) => {
      setPendingFollowUpState(data);
      if (data) {
        setOpen(false);
        router.push("/clients");
      }
    },
    [router]
  );

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: AgentMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);

    let content = "";
    let followUpAction: AgentMessage["followUpAction"];
    let navigatePath: string | undefined;

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        content = data?.error ?? `请求失败（${res.status}）`;
      } else {
        content = data.content ?? "";
        followUpAction = data.followUpAction;
        navigatePath = data.navigatePath;
      }
    } catch (e) {
      content = `网络错误：${e instanceof Error ? e.message : "请稍后重试"}`;
    }

    const assistantMsg: AgentMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content,
      followUpAction,
      navigatePath,
    };
    setMessages((prev) => [...prev, assistantMsg]);

    if (navigatePath) {
      setOpen(false);
      router.push(navigatePath);
    }
  }, [router]);

  const value: AgentContextValue = {
    open,
    setOpen,
    messages,
    sendMessage,
    pendingFollowUp,
    setPendingFollowUp,
    clearPendingFollowUp,
  };

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used within AgentProvider");
  return ctx;
}
