"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

type CameraStatus = "in_stock" | "used" | "shipped" | "returned";

interface CameraItem {
  id: number;
  sn: string;
  model: string;
  status: CameraStatus;
  created_at: string;
}

interface CameraListResponse {
  items: CameraItem[];
  total: number;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "全部状态" },
  { value: "in_stock", label: "在库" },
  { value: "used", label: "使用中" },
  { value: "shipped", label: "已发货" },
  { value: "returned", label: "已退回" },
];

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

const PAGE_SIZE = 20;

export default function CameraListPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<CameraItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [snInput, setSnInput] = useState("");
  const [sn, setSn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCameras = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      };
      if (status) params.status = status;
      if (sn) params.sn = sn;
      const { data } = await api.get<CameraListResponse | CameraItem[]>(
        "/api/cameras",
        { params },
      );
      if (Array.isArray(data)) {
        setItems(data);
        setTotal(data.length);
      } else {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      setError("加载相机列表失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [page, status, sn]);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  function handleStatusChange(v: string) {
    setStatus(v);
    setPage(1);
  }

  function handleSearch() {
    setSn(snInput.trim());
    setPage(1);
  }

  function handleRowClick(id: number) {
    router.push(`/dashboard/cameras/${id}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canSync = hasPermission("camera:sync");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="相机管理"
        description="相机标定数据同步与状态管理。"
        actions={
          canSync ? (
            <Button onClick={() => router.push("/dashboard/cameras/sync")}>
              <Plus className="h-4 w-4" />
              同步相机
            </Button>
          ) : null
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
              状态
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-9 rounded border border-border bg-surface-elevated px-3 font-sans text-sm text-fg-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Input
              label="序列号搜索"
              name="sn"
              value={snInput}
              onChange={(e) => setSnInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="输入相机 SN"
            />
          </div>
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="h-4 w-4" />
            查询
          </Button>
          <Button variant="secondary" onClick={fetchCameras} title="刷新">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Table */}
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
            <Button variant="secondary" onClick={fetchCameras}>
              重试
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-fg-muted">
            <Camera className="h-6 w-6" />
            <p className="font-mono text-xs uppercase tracking-widest">暂无数据</p>
          </div>
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <TH>内部ID</TH>
                  <TH>SN</TH>
                  <TH>型号</TH>
                  <TH>状态</TH>
                  <TH>创建时间</TH>
                </tr>
              </THead>
              <TBody>
                {items.map((cam) => (
                  <TR
                    key={cam.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(cam.id)}
                  >
                    <TD className="font-mono text-xs text-fg-secondary">
                      #{cam.id}
                    </TD>
                    <TD className="font-mono text-sm">{cam.sn}</TD>
                    <TD>{cam.model || "—"}</TD>
                    <TD>
                      <Badge tone={statusTone(cam.status)}>
                        {STATUS_LABEL[cam.status] ?? cam.status}
                      </Badge>
                    </TD>
                    <TD className="font-mono text-xs text-fg-secondary">
                      {formatDate(cam.created_at)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            {/* Pagination */}
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
