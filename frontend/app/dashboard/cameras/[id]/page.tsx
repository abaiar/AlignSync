"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle, Camera } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

type CameraStatus = "in_stock" | "used" | "shipped" | "returned";

interface CameraDetail {
  id: number;
  sn: string;
  model: string;
  status: CameraStatus;
  created_at: string;
  intrinsics: unknown;
  extrinsics: unknown;
}

const STATUS_LABEL: Record<string, string> = {
  in_stock: "在库",
  used: "使用中",
  shipped: "已发货",
  returned: "已退回",
};

function statusTone(status: string): "success" | "info" | "warning" | "danger" {
  switch (status) {
    case "in_stock":
      return "success";
    case "used":
      return "info";
    case "shipped":
      return "warning";
    case "returned":
      return "danger";
    default:
      return "info";
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

function formatJson(value: unknown): string {
  if (value === null || value === undefined) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
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

export default function CameraDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [camera, setCamera] = useState<CameraDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchCamera() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<CameraDetail>(
          `/api/cameras/${params.id}`,
        );
        if (!cancelled) setCamera(data);
      } catch {
        if (!cancelled) setError("加载相机详情失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCamera();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const canSync = hasPermission("camera:sync");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="相机详情"
        description={`内部ID #${params.id}`}
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
      ) : camera ? (
        <div className="flex flex-col gap-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DetailRow label="内部ID">
                <span className="font-mono">#{camera.id}</span>
              </DetailRow>
              <DetailRow label="SN">
                <span className="font-mono">{camera.sn}</span>
              </DetailRow>
              <DetailRow label="型号">{camera.model || "—"}</DetailRow>
              <DetailRow label="状态">
                <Badge tone={statusTone(camera.status)}>
                  {STATUS_LABEL[camera.status] ?? camera.status}
                </Badge>
              </DetailRow>
              <DetailRow label="创建时间">
                <span className="font-mono text-xs">
                  {formatDate(camera.created_at)}
                </span>
              </DetailRow>
            </CardContent>
          </Card>

          {/* Calibration data */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>内参 (Intrinsics)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto scrollbar-thin font-mono text-xs leading-relaxed text-fg-secondary">
                  {formatJson(camera.intrinsics)}
                </pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>外参 (Extrinsics)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto scrollbar-thin font-mono text-xs leading-relaxed text-fg-secondary">
                  {formatJson(camera.extrinsics)}
                </pre>
              </CardContent>
            </Card>
          </div>

          {canSync && (
            <div className="flex justify-end">
              <Button onClick={() => router.push("/dashboard/cameras/sync")}>
                <Camera className="h-4 w-4" />
                同步标定数据
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
