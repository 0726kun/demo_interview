"use client";

import { useCallback, useEffect, useState } from "react";
import { getClients } from "@/lib/api";
import type { Client } from "@/lib/types";
import { useAgent } from "@/contexts/AgentContext";
import { ClientDetailDrawer } from "@/components/ClientDetailDrawer";

type ClientsViewProps = {
  /** 服务端首屏数据，无搜索时直接使用 */
  initialClients: Client[];
};

export function ClientsView({ initialClients }: ClientsViewProps) {
  const { pendingFollowUp, clearPendingFollowUp } = useAgent();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (pendingFollowUp) setSelectedId(pendingFollowUp.clientId);
  }, [pendingFollowUp]);

  const hasSearch = Boolean(searchQuery.trim());

  const fetchClients = useCallback(() => {
    setLoading(true);
    getClients({ search: searchQuery || undefined })
      .then(setClients)
      .finally(() => setLoading(false));
  }, [searchQuery]);

  useEffect(() => {
    if (hasSearch) fetchClients();
    else setClients(initialClients);
  }, [hasSearch, fetchClients, initialClients]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const showLoading = hasSearch && loading;
  const list = hasSearch ? clients : initialClients;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        客户管理
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        客户列表、持有产品与跟进记录
      </p>

      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input
          type="search"
          placeholder="搜索客户姓名或身份/渠道…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-64 rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] sm:w-80"
          aria-label="搜索客户"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
        >
          搜索
        </button>
      </form>

      <div className="mt-6">
        {showLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-16 text-center text-[var(--muted)]">
            暂无匹配客户，试试调整搜索条件
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <li
                key={c.id}
                className="group cursor-pointer rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 transition-all duration-200 hover:border-[var(--accent-muted)]/50 hover:shadow-lg hover:shadow-[var(--accent)]/5"
                onClick={() => setSelectedId(c.id)}
              >
                <h3 className="font-display font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  {c.name}
                </h3>
                {c.contact && (
                  <p className="mt-1 text-sm text-[var(--muted)]">{c.contact}</p>
                )}
                {c.phone && (
                  <p className="mt-0.5 text-xs tabular-nums text-[var(--muted)]">{c.phone}</p>
                )}
                <span className="mt-3 inline-block text-xs text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100">
                  查看详情与跟进 →
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ClientDetailDrawer
        clientId={selectedId}
        onClose={() => {
          if (pendingFollowUp && selectedId === pendingFollowUp.clientId) clearPendingFollowUp();
          setSelectedId(null);
        }}
        initialFollowUp={
          pendingFollowUp && selectedId === pendingFollowUp.clientId
            ? { date: pendingFollowUp.date, method: pendingFollowUp.method, content: pendingFollowUp.content }
            : undefined
        }
      />
    </div>
  );
}
