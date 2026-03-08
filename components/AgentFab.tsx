"use client";

import { useAgent } from "@/contexts/AgentContext";

export function AgentFab() {
  const { setOpen } = useAgent();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--background)] shadow-lg transition-transform hover:scale-105 hover:shadow-[var(--accent)]/30"
      aria-label="打开智能助手"
      title="智能助手"
    >
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </button>
  );
}
