"use client";

import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useAgent } from "@/contexts/AgentContext";

export function AgentPanel() {
  const { open, setOpen, messages, sendMessage, setPendingFollowUp } = useAgent();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    try {
      await sendMessage(text);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        role="presentation"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        aria-hidden
        onClick={() => setOpen(false)}
      />
      <aside
        aria-label="智能助手"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--card-border)] bg-[var(--card)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
            智能助手
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            aria-label="关闭"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="border-b border-[var(--card-border)] px-4 py-2 text-xs text-[var(--muted)]">
          试试：「张总持有哪些债券型产品」「稳健增长一号被谁持有」「今天和李总电话聊了…」「打开数据概览」
        </p>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {messages.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              输入问题或描述，我会帮您查询或生成跟进建议。
            </p>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "ml-6 bg-[var(--accent)]/20 text-[var(--foreground)]"
                      : "mr-6 bg-[var(--surface)] text-[var(--foreground)]"
                  }`}
                >
                  <div className="agent-message">
                    {m.role === "assistant" ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="my-1.5">{children}</p>,
                          ul: ({ children }) => <ul className="my-1.5 list-disc pl-5">{children}</ul>,
                          ol: ({ children }) => <ol className="my-1.5 list-decimal pl-5">{children}</ol>,
                          li: ({ children }) => <li className="my-0.5">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-[var(--accent)]">{children}</strong>,
                          code: ({ children }) => <code className="rounded bg-[var(--background)] px-1 py-0.5 text-xs">{children}</code>,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                  </div>
                  {m.role === "assistant" && m.followUpAction && (
                    <button
                      type="button"
                      onClick={() => {
                        setPendingFollowUp({
                          clientId: m.followUpAction!.clientId,
                          date: m.followUpAction!.date,
                          method: m.followUpAction!.method,
                          content: m.followUpAction!.content,
                        });
                      }}
                      className="mt-2 w-full rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-[var(--background)] hover:opacity-90"
                    >
                      填入跟进表单
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div ref={listEndRef} />
        </div>
        <form
          onSubmit={handleSubmit}
          className="border-t border-[var(--card-border)] p-3"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入问题或描述…"
              disabled={sending}
              className="flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-60"
              aria-label="输入消息"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90 disabled:opacity-50"
            >
              {sending ? "…" : "发送"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
