"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Crosshair,
  LayoutDashboard,
  BarChart3,
  Camera,
  KeyRound,
  ClipboardList,
  Wallet,
  Truck,
  Cpu,
  ScanLine,
  LifeBuoy,
  Users,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  permission?: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  // 首页/落地页：对所有已登录用户始终可见，无权限门控
  { label: "统计概览", href: "/dashboard", icon: LayoutDashboard },
  // 统计汇总详情页：仍受 statistics:view 权限门控
  { label: "统计汇总", href: "/dashboard/statistics", permission: "statistics:view", icon: BarChart3 },
  { label: "相机管理", href: "/dashboard/cameras", permission: "camera:view", icon: Camera },
  { label: "软件锁管理", href: "/dashboard/software-locks", permission: "software_lock:view", icon: KeyRound },
  { label: "采购管理", href: "/dashboard/purchase-orders", permission: "purchase_order:view", icon: ClipboardList },
  { label: "财务管理", href: "/dashboard/payments", permission: "payment:view", icon: Wallet },
  { label: "发货管理", href: "/dashboard/shipments", permission: "shipment:view", icon: Truck },
  { label: "设备管理", href: "/dashboard/devices", permission: "device:view", icon: Cpu },
  { label: "追溯查询", href: "/dashboard/traceability", permission: "traceability:query", icon: ScanLine },
  { label: "售后管理", href: "/dashboard/after-sales", permission: "after_sales:view", icon: LifeBuoy },
  { label: "用户管理", href: "/dashboard/users", permission: "user:manage", icon: Users },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, hydrated, logout, hasPermission } = useAuth();

  // Redirect to /login if not authenticated (after hydration completes)
  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
    }
  }, [hydrated, token, router]);

  // 无 permission 字段的项（如首页"统计概览"）对所有已登录用户始终可见；
  // 有 permission 字段的项按权限门控过滤
  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission)),
    [hasPermission, user],
  );

  const activeItem = useMemo(() => {
    // Exact match for /dashboard, otherwise prefix match
    const exact = NAV_ITEMS.find((i) => i.href === pathname);
    if (exact) return exact;
    return NAV_ITEMS.find((i) => pathname.startsWith(i.href + "/"));
  }, [pathname]);

  const pageTitle = activeItem?.label ?? "控制台";

  // Hold render until hydrated to avoid auth flash
  if (!hydrated || !token) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-fg-muted">
          <Crosshair className="h-4 w-4 animate-pulse text-accent" />
          正在初始化系统…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — 240px */}
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
          <div className="flex h-7 w-7 items-center justify-center border border-accent/50 bg-accent/10">
            <Crosshair className="h-4 w-4 text-accent" />
          </div>
          <span className="font-display text-base font-extrabold tracking-tight">
            AlignSync
          </span>
        </div>

        {/* Navigation */}
        <nav className="scrollbar-thin flex-1 overflow-y-auto py-3">
          <p className="px-4 pb-2 font-mono text-[10px] uppercase tracking-widest text-fg-muted">
            {"// Modules"}
          </p>
          <ul className="flex flex-col gap-0.5 px-2">
            {visibleItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded px-2.5 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-surface-elevated text-fg-primary"
                        : "text-fg-secondary hover:bg-surface-elevated/60 hover:text-fg-primary",
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-accent" />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-accent" : "text-fg-muted group-hover:text-fg-secondary",
                      )}
                    />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
            {visibleItems.length === 0 && (
              <li className="px-2.5 py-4 font-mono text-xs text-fg-muted">
                无可用模块
              </li>
            )}
          </ul>
        </nav>

        {/* User info */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-border bg-surface-elevated font-mono text-xs font-medium text-accent">
              {user?.real_name?.[0] ?? user?.username?.[0] ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg-primary">
                {user?.real_name || user?.username}
              </p>
              <p className="truncate font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                {user?.enterprise_name || "—"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface/60 px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-base font-bold tracking-tight text-fg-primary">
              {pageTitle}
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
              {pathname}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-fg-primary">
                {user?.real_name || user?.username}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                {user?.roles?.[0] ?? "—"}
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="flex h-8 w-8 items-center justify-center rounded border border-border text-fg-secondary transition-colors hover:border-danger/40 hover:text-danger"
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="scrollbar-thin flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
