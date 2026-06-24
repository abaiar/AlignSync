"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Cpu,
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

interface DeviceItem {
  id: number;
  device_sn: string;
  device_name: string;
  model: string;
  status: string;
  assembled_at: string | null;
}

interface DeviceListResponse {
  items: DeviceItem[];
  total: number;
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

const PAGE_SIZE = 20;

export default function DeviceListPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<DeviceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<DeviceListResponse | DeviceItem[]>(
        "/api/devices",
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
      setError("加载设备列表失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  function handleRowClick(id: number) {
    router.push(`/dashboard/devices/${id}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canRegister = hasPermission("device:register");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="设备管理"
        description="设备组装、状态与追溯管理。"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={fetchDevices} title="刷新">
              <RefreshCw className="h-4 w-4" />
              刷新
            </Button>
            {canRegister ? (
              <Button onClick={() => router.push("/dashboard/devices/new")}>
                <Plus className="h-4 w-4" />
                新增设备
              </Button>
            ) : null}
          </div>
        }
      />

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
            <Button variant="secondary" onClick={fetchDevices}>
              重试
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-fg-muted">
            <Cpu className="h-6 w-6" />
            <p className="font-mono text-xs uppercase tracking-widest">暂无数据</p>
          </div>
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <TH>设备SN</TH>
                  <TH>设备名称</TH>
                  <TH>型号</TH>
                  <TH>状态</TH>
                  <TH>组装时间</TH>
                </tr>
              </THead>
              <TBody>
                {items.map((device) => (
                  <TR
                    key={device.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(device.id)}
                  >
                    <TD className="font-mono text-sm">{device.device_sn}</TD>
                    <TD>{device.device_name || "—"}</TD>
                    <TD>{device.model || "—"}</TD>
                    <TD>
                      <Badge tone={statusTone(device.status)}>
                        {statusLabel(device.status)}
                      </Badge>
                    </TD>
                    <TD className="font-mono text-xs text-fg-secondary">
                      {formatDate(device.assembled_at)}
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
