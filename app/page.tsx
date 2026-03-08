import Link from "next/link";

const entries = [
  { href: "/products", label: "产品货架", desc: "基金产品列表、筛选与详情" },
  { href: "/clients", label: "客户管理", desc: "客户信息与跟进记录" },
  { href: "/dashboard", label: "数据概览", desc: "业务数据可视化" },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
        渠道销售工作台
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        快速了解在售产品、维护客户关系、查询持有与跟进
      </p>
      <ul className="mt-12 grid gap-4 sm:grid-cols-3">
        {entries.map(({ href, label, desc }, i) => (
          <li
            key={href}
            className="group relative overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 transition-all duration-300 hover:border-[var(--accent-muted)]/50 hover:shadow-lg hover:shadow-[var(--accent)]/5"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <Link href={href} className="block after:absolute after:inset-0">
              <span className="font-display text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                {label}
              </span>
              <p className="mt-2 text-sm text-[var(--muted)]">{desc}</p>
              <span className="mt-4 inline-block text-sm font-medium text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100">
                进入 →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
