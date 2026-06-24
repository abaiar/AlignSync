"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

interface SoftwareLockItem {
  id: number;
  lock_id: string;
  software_version: string;
  function_version: string;
  expire_date: string;
  status: string;
  bound_enterprise_id: number | null;
}

interface SoftwareLockListResponse {
  items: SoftwareLockItem[];
  total: number;
}

function statusTone(status: string): "success" | "info" | "warning" | "danger" | "muted" {
  switch (status) {
    case "active":
      return "success";
    case "pending":
      return "warning";
    case "expired":
      return "danger";
    case "revoked":
      return "muted";
    default:
      return "info";
  }
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: "有效",
    pending: "待激活",
    expired: "已过期",
    revoked: "已吊销",
  };
  return map[status] ?? status;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("zh-CN");
  } catch {
    return iso;
  }
}

const PAGE_SIZE = 20;

export default function SoftwareLockListPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<SoftwareLockItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<SoftwareLockListResponse | SoftwareLockItem[]>(
        "/api/software-locks",
        { params: { skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE } },
      );
      if (Array.isArray(data)) {
        setItems(data);
        setTotal(data.length);
      } else {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      setError("加载软件锁列表失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLocks();
  }, [fetchLocks]);

  function handleRowClick(id: number) {
    router.push(`/dashboard/software-locks/${id}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canSync = hasPermission("software_lock:sync");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="软件锁管理"
        description="软件授权锁的同步与状态管理。"
        actions={
          canSync ? (
            <Button onClick={() => router.push("/dashboard/software-locks/sync")}>
              <Plus className="h-4 w-4" />
              同步授权
            </Button>
          ) : null
        }
      />

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-wider text-fg-muted">
            {"// 软件锁列表"}
          </p>
          <Button variant="secondary" onClick={fetchLocks} title="刷新">
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 font-mono text-xs uppercase tracking-widest text-fg-muted">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            加载中…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="flex items-center gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
            <Button variant="secondary" onClick={fetchLocks}>
              重试
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-fg-muted">
            <KeyRound className="h-6 w-6" />
            <p className="font-mono text-xs uppercase tracking-widest">暂无数据</p>
          </div>
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <TH>锁ID</TH>
                  <TH>软件版本</TH>
                  <TH>功能版本</TH>
                  <TH>到期日</TH>
                  <TH>状态</TH>
                  <TH>绑定企业</TH>
                </tr>
              </THead>
              <TBody>
                {items.map((lock) => (
                  <TR
                    key={lock.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(lock.id)}
                  >
                    <TD className="font-mono text-sm">{lock.lock_id}</TD>
                    <TD>{lock.software_version || "—"}</TD>
                    <TD>{lock.function_version || "—"}</TD>
                    <TD className="font-mono text-xs text-fg-secondary">
                      {formatDate(lock.expire_date)}
                    </TD>
                    <TD>
                      <Badge tone={statusTone(lock.status)}>
                        {statusLabel(lock.status)}
                      </Badge>
                    </TD>
                    <TD className="font-mono text-xs text-fg-secondary">
                      {lock.bound_enterprise_id ?? "—"}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="font-mono text-xs uppercase tracking-wider text-fg-muted">
                共 {total} 条 · 第 {page}/{totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
