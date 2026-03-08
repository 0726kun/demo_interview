"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getClientById,
  getHoldingsByClientId,
  getFollowUpsByClientId,
  addFollowUp,
} from "@/lib/api";
import type { Client, Product, FollowUp } from "@/lib/types";

type ClientDetailDrawerProps = {
  clientId: string | null;
  onClose: () => void;
  /** 由智能助手「填入跟进表单」传入的预填数据 */
  initialFollowUp?: { date: string; method: string; content: string };
};

const METHOD_OPTIONS = [
  { value: "电话", label: "电话" },
  { value: "面访", label: "面访" },
  { value: "微信", label: "微信" },
  { value: "邮件", label: "邮件" },
  { value: "其他", label: "其他" },
];

export function ClientDetailDrawer({ clientId, onClose, initialFollowUp }: ClientDetailDrawerProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [holdings, setHoldings] = useState<Product[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ date: "", method: "电话", content: "" });

  const fetchDetail = useCallback(() => {
    if (!clientId) {
      setClient(null);
      setHoldings([]);
      setFollowUps([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getClientById(clientId),
      getHoldingsByClientId(clientId),
      getFollowUpsByClientId(clientId),
    ])
      .then(([c, h, f]) => {
        setClient(c ?? null);
        setHoldings(h ?? []);
        setFollowUps(f ?? []);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    fetchDetail();
    if (clientId) {
      if (initialFollowUp) {
        setForm({
          date: initialFollowUp.date,
          method: initialFollowUp.method,
          content: initialFollowUp.content,
        });
      } else {
        setForm({
          date: new Date().toISOString().slice(0, 10),
          method: "电话",
          content: "",
        });
      }
    }
  }, [fetchDetail, clientId, initialFollowUp]);

  const handleSubmitFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !form.date.trim() || !form.content.trim()) return;
    setSubmitting(true);
    addFollowUp(clientId, {
      date: form.date,
      method: form.method,
      content: form.content.trim(),
    })
      .then(() => {
        setForm({ date: "", method: "电话", content: "" });
        return getFollowUpsByClientId(clientId);
      })
      .then(setFollowUps)
      .finally(() => setSubmitting(false));
  };

  const isOpen = Boolean(clientId);

  return (
    <>
      <div
        role="presentation"
        aria-hidden={!isOpen}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={onClose}
      />
      <aside
        aria-label="客户详情"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--card-border)] bg-[var(--card)] shadow-2xl transition-transform duration-300 ease-out"
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
            客户详情
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            aria-label="关闭"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            </div>
          ) : client ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-xl font-semibold text-[var(--foreground)]">
                  {client.name}
                </h3>
                {(client.contact || client.phone) && (
                  <dl className="mt-2 space-y-1 text-sm">
                    {client.contact && (
                      <div>
                        <dt className="text-[var(--muted)]">身份/渠道</dt>
                        <dd className="text-[var(--foreground)]">{client.contact}</dd>
                      </div>
                    )}
                    {client.phone && (
                      <div>
                        <dt className="text-[var(--muted)]">电话</dt>
                        <dd className="tabular-nums text-[var(--foreground)]">{client.phone}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>

              <div>
                <h4 className="font-display text-sm font-semibold text-[var(--foreground)]">
                  持有产品（{holdings.length}）
                </h4>
                {holdings.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">暂无持有产品</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {holdings.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-[var(--foreground)]">{p.name}</span>
                        <span className="ml-2 text-[var(--muted)]">{p.type}</span>
                        <span className="ml-2 tabular-nums text-[var(--muted)]">净值 {p.nav}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="font-display text-sm font-semibold text-[var(--foreground)]">
                  跟进记录（{followUps.length}）
                </h4>
                {followUps.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">暂无跟进记录</p>
                ) : (
                  <ul className="mt-2 space-y-3">
                    {followUps.map((f) => (
                      <li
                        key={f.id}
                        className="rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2 text-[var(--muted)]">
                          <time dateTime={f.date}>{f.date}</time>
                          <span className="font-medium text-[var(--accent)]">{f.method}</span>
                        </div>
                        <p className="mt-1 text-[var(--foreground)]">{f.content}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <form
                onSubmit={handleSubmitFollowUp}
                className="rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-4"
              >
                <h4 className="font-display text-sm font-semibold text-[var(--foreground)]">
                  新增跟进
                </h4>
                <div className="mt-3 space-y-3">
                  <div>
                    <label htmlFor="follow-date" className="block text-xs text-[var(--muted)]">
                      日期
                    </label>
                    <input
                      id="follow-date"
                      type="date"
                      required
                      value={form.date}
                      onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label htmlFor="follow-method" className="block text-xs text-[var(--muted)]">
                      方式
                    </label>
                    <select
                      id="follow-method"
                      value={form.method}
                      onChange={(e) => setForm((prev) => ({ ...prev, method: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                    >
                      {METHOD_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="follow-content" className="block text-xs text-[var(--muted)]">
                      内容
                    </label>
                    <textarea
                      id="follow-content"
                      required
                      rows={3}
                      placeholder="如：电话沟通，讨论了XX产品认购意向"
                      value={form.content}
                      onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                      className="mt-1 w-full resize-y rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "提交中…" : "保存跟进"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <p className="text-center text-[var(--muted)]">未找到该客户</p>
          )}
        </div>
      </aside>
    </>
  );
}
