"use client";

import { useEffect, useState } from "react";
import { getProductById, getHoldersByProductId } from "@/lib/api";
import type { Product, Client } from "@/lib/types";

type ProductDetailDrawerProps = {
  productId: string | null;
  onClose: () => void;
};

const statusStyle: Record<string, string> = {
  运作中: "bg-emerald-500/20 text-emerald-400",
  募集中: "bg-amber-500/20 text-amber-400",
  已清盘: "bg-zinc-500/20 text-zinc-400",
  封闭期: "bg-sky-500/20 text-sky-400",
};

export function ProductDetailDrawer({ productId, onClose }: ProductDetailDrawerProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [holders, setHolders] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setHolders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getProductById(productId), getHoldersByProductId(productId)])
      .then(([p, h]) => {
        setProduct(p);
        setHolders(h ?? []);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const isOpen = Boolean(productId);

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
        aria-label="产品详情"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--card-border)] bg-[var(--card)] shadow-2xl transition-transform duration-300 ease-out"
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
            产品详情
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
          ) : product ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-xl font-semibold text-[var(--foreground)]">
                  {product.name}
                </h3>
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[product.status] ?? "bg-[var(--surface)] text-[var(--muted)]"}`}
                >
                  {product.status}
                </span>
              </div>
              <dl className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--muted)]">类型</dt>
                  <dd className="font-medium text-[var(--foreground)]">{product.type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--muted)]">最新净值</dt>
                  <dd className="font-medium tabular-nums text-[var(--foreground)]">{product.nav}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--muted)]">成立规模</dt>
                  <dd className="font-medium tabular-nums text-[var(--foreground)]">{product.scale} 亿元</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--muted)]">成立日</dt>
                  <dd className="font-medium text-[var(--foreground)]">{product.establishedAt}</dd>
                </div>
              </dl>
              <div>
                <h4 className="mb-2 font-display text-sm font-semibold text-[var(--foreground)]">
                  持有客户（{holders.length}）
                </h4>
                {holders.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">暂无持有记录</p>
                ) : (
                  <ul className="space-y-2">
                    {holders.map((c) => (
                      <li
                        key={c.id}
                        className="rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-[var(--foreground)]">{c.name}</span>
                        {c.contact && (
                          <span className="ml-2 text-[var(--muted)]">{c.contact}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-[var(--muted)]">未找到该产品</p>
          )}
        </div>
      </aside>
    </>
  );
}
