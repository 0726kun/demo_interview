"use client";

import { useCallback, useEffect, useState } from "react";
import { getProducts } from "@/lib/api";
import type { Product, ProductType, ProductStatus } from "@/lib/types";
import { ProductDetailDrawer } from "@/components/ProductDetailDrawer";

const TYPES: { value: "" | ProductType; label: string }[] = [
  { value: "", label: "全部类型" },
  { value: "股票型", label: "股票型" },
  { value: "债券型", label: "债券型" },
  { value: "混合型", label: "混合型" },
  { value: "货币型", label: "货币型" },
  { value: "指数型", label: "指数型" },
];

const STATUSES: { value: "" | ProductStatus; label: string }[] = [
  { value: "", label: "全部状态" },
  { value: "运作中", label: "运作中" },
  { value: "募集中", label: "募集中" },
  { value: "已清盘", label: "已清盘" },
  { value: "封闭期", label: "封闭期" },
];

const statusBadge: Record<ProductStatus, string> = {
  运作中: "bg-emerald-500/20 text-emerald-400",
  募集中: "bg-amber-500/20 text-amber-400",
  已清盘: "bg-zinc-500/20 text-zinc-400",
  封闭期: "bg-sky-500/20 text-sky-400",
};

type ProductsViewProps = {
  /** 服务端首屏数据，无筛选时直接使用，避免首屏再请求 */
  initialProducts: Product[];
};

export function ProductsView({ initialProducts }: ProductsViewProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"" | ProductType>("");
  const [statusFilter, setStatusFilter] = useState<"" | ProductStatus>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const hasFilters = Boolean(typeFilter || statusFilter || searchQuery.trim());

  const fetchProducts = useCallback(() => {
    setLoading(true);
    getProducts({
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      search: searchQuery || undefined,
    })
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [typeFilter, statusFilter, searchQuery]);

  useEffect(() => {
    if (hasFilters) fetchProducts();
    else setProducts(initialProducts);
  }, [hasFilters, fetchProducts, initialProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const showLoading = hasFilters && loading;
  const list = hasFilters ? products : initialProducts;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        产品货架
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        按类型、状态筛选，或搜索产品名称
      </p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="search"
            placeholder="搜索产品名称…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-56 rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            aria-label="搜索产品"
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
          >
            搜索
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "" | ProductType)}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            aria-label="按类型筛选"
          >
            {TYPES.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "" | ProductStatus)}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            aria-label="按状态筛选"
          >
            {STATUSES.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        {showLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-16 text-center text-[var(--muted)]">
            暂无匹配产品，试试调整筛选或搜索条件
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p, i) => (
              <li
                key={p.id}
                className="group cursor-pointer rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 transition-all duration-200 hover:border-[var(--accent-muted)]/50 hover:shadow-lg hover:shadow-[var(--accent)]/5"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => setSelectedId(p.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                    {p.name}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[p.status]}`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{p.type}</p>
                <dl className="mt-3 flex gap-4 text-sm">
                  <div>
                    <dt className="text-[var(--muted)]">净值</dt>
                    <dd className="font-medium tabular-nums text-[var(--foreground)]">{p.nav}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">规模</dt>
                    <dd className="font-medium tabular-nums text-[var(--foreground)]">{p.scale} 亿</dd>
                  </div>
                </dl>
                <span className="mt-3 inline-block text-xs text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100">
                  查看详情 →
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ProductDetailDrawer productId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
