"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Cpu,
  KeyRound,
  Camera,
  ScanLine,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";

interface DeviceCamera {
  id: number;
  sn: string;
  model: string;
  position_label: string;
}

interface DeviceSoftwareLock {
  lock_id: string;
  software_version: string;
  function_version: string;
}

interface DeviceDetail {
  id: number;
  device_sn: string;
  device_name: string;
  model: string;
  status: string;
  assembled_by: string | null;
  assembled_at: string | null;
  software_lock: DeviceSoftwareLock | null;
  cameras: DeviceCamera[];
}

function statusTone(status: string): "info" | "success" | "danger" | "muted" {
  switch (status) {
    case "assembled":
      return "info";
    case "sold":
      return "success";
    case "returned":
      return "danger";
    default:
      return "muted";
  }
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    assembled: "已组装",
    sold: "已售出",
    returned: "已退回",
  };
  return map[status] ?? status;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false });
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

export default function DeviceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchDevice() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<DeviceDetail>(
          `/api/devices/${params.id}`,
        );
        if (!cancelled) setDevice(data);
      } catch {
        if (!cancelled) setError("加载设备详情失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDevice();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="设备详情"
        description={`ID #${params.id}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
            {device && (
              <Link
                href={`/dashboard/traceability?device_sn=${encodeURIComponent(device.device_sn)}`}
              >
                <Button>
                  <ScanLine className="h-4 w-4" />
                  查看追溯
                </Button>
              </Link>
            )}
          </div>
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
      ) : device ? (
        <div className="flex flex-col gap-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <Cpu className="h-4 w-4 text-fg-muted" />
            </CardHeader>
            <CardContent className="p-0">
              <DetailRow label="内部ID">
                <span className="font-mono">#{device.id}</span>
              </DetailRow>
              <DetailRow label="设备SN">
                <span className="font-mono">{device.device_sn}</span>
              </DetailRow>
              <DetailRow label="设备名称">
                {device.device_name || "—"}
              </DetailRow>
              <DetailRow label="型号">{device.model || "—"}</DetailRow>
              <DetailRow label="状态">
                <Badge tone={statusTone(device.status)}>
                  {statusLabel(device.status)}
                </Badge>
              </DetailRow>
              <DetailRow label="组装人">
                {device.assembled_by || "—"}
              </DetailRow>
              <DetailRow label="组装时间">
                <span className="font-mono text-xs">
                  {formatDate(device.assembled_at)}
                </span>
              </DetailRow>
            </CardContent>
          </Card>

          {/* BOM items */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Software lock */}
            <Card>
              <CardHeader>
                <CardTitle>软件锁</CardTitle>
                <KeyRound className="h-4 w-4 text-fg-muted" />
              </CardHeader>
              <CardContent className="p-0">
                {device.software_lock ? (
                  <>
                    <DetailRow label="锁ID">
                      <span className="font-mono">
                        {device.software_lock.lock_id}
                      </span>
                    </DetailRow>
                    <DetailRow label="软件版本">
                      {device.software_lock.software_version || "—"}
                    </DetailRow>
                    <DetailRow label="功能版本">
                      {device.software_lock.function_version || "—"}
                    </DetailRow>
                  </>
                ) : (
                  <p className="px-4 py-6 text-center font-mono text-xs uppercase tracking-widest text-fg-muted">
                    未绑定软件锁
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Cameras */}
            <Card>
              <CardHeader>
                <CardTitle>相机列表</CardTitle>
                <Camera className="h-4 w-4 text-fg-muted" />
              </CardHeader>
              <CardContent className="p-0">
                {device.cameras && device.cameras.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {device.cameras.map((cam) => (
                      <li key={cam.id} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm text-fg-primary">
                              {cam.sn}
                            </p>
                            <p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                              {cam.model || "—"}
                            </p>
                          </div>
                          <Badge tone="info">{cam.position_label}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-6 text-center font-mono text-xs uppercase tracking-widest text-fg-muted">
                    未绑定相机
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
