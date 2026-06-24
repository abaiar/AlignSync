"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";

interface SoftwareLockDetail {
  id: number;
  lock_id: string;
  software_version: string;
  function_version: string;
  function_list: string[];
  expire_date: string;
  status: string;
  bound_enterprise_id: number | null;
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

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0">
      <span className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
        {label}
      </span>
      <span className="text-sm text-fg-primary">{children}</span>
    </div>
  );
}

export default function SoftwareLockDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [lock, setLock] = useState<SoftwareLockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchLock() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<SoftwareLockDetail>(
          `/api/software-locks/${params.id}`,
        );
        if (!cancelled) setLock(data);
      } catch {
        if (!cancelled) setError("加载软件锁详情失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLock();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="软件锁详情"
        description={`ID #${params.id}`}
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        }
      />

      {loading ? (
        <Card>
          <div className="flex items-center justify-center gap-2 py-16 font-mono text-xs uppercase tracking-widest text-fg-muted">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            加载中…
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="flex items-center gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
            <Button variant="secondary" onClick={() => router.back()}>
              返回列表
            </Button>
          </div>
        </Card>
      ) : lock ? (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DetailRow label="锁ID">
                <span className="font-mono">{lock.lock_id}</span>
              </DetailRow>
              <DetailRow label="软件版本">
                {lock.software_version || "—"}
              </DetailRow>
              <DetailRow label="功能版本">
                {lock.function_version || "—"}
              </DetailRow>
              <DetailRow label="到期日">
                <span className="font-mono text-xs">
                  {formatDate(lock.expire_date)}
                </span>
              </DetailRow>
              <DetailRow label="状态">
                <Badge tone={statusTone(lock.status)}>
                  {statusLabel(lock.status)}
                </Badge>
              </DetailRow>
              <DetailRow label="绑定企业">
                <span className="font-mono text-xs">
                  {lock.bound_enterprise_id ?? "—"}
                </span>
              </DetailRow>
            </CardContent>
          </Card>

          {/* Function list */}
          <Card>
            <CardHeader>
              <CardTitle>功能列表</CardTitle>
            </CardHeader>
            <CardContent>
              {lock.function_list && lock.function_list.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {lock.function_list.map((fn, idx) => (
                    <Badge key={`${fn}-${idx}`} tone="info">
                      {fn}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-xs uppercase tracking-wider text-fg-muted">
                  无功能授权
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
