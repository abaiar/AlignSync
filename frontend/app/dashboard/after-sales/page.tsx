"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LifeBuoy,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

type AfterSalesStatus =
  | "pending"
  | "processing"
  | "resolved"
  | "closed"
  | "rejected";

interface AfterSalesItem {
  id: number;
  ticket_no: string;
  type: string;
  category: string;
  item_sn: string;
  title: string;
  status: AfterSalesStatus;
  created_at: string;
}

interface AfterSalesListResponse {
  items: AfterSalesItem[];
  total: number;
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "全部" },
  { value: "pending", label: "待处理" },
  { value: "processing", label: "处理中" },
  { value: "resolved", label: "已解决" },
  { value: "closed", label: "已关闭" },
  { value: "rejected", label: "已拒绝" },
];

const CATEGORY_TABS: { value: string; label: string }[] = [
  { value: "", label: "全部" },
  { value: "camera", label: "相机" },
  { value: "software", label: "软件" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "待处理",
  processing: "处理中",
  resolved: "已解决",
  closed: "已关闭",
  rejected: "已拒绝",
};

function statusTone(
  status: string,
): "warning" | "info" | "success" | "muted" | "danger" {
  switch (status) {
    case "pending":
      return "warning";
    case "processing":
      return "info";
    case "resolved":
      return "success";
    case "closed":
      return "muted";
    case "rejected":
      return "danger";
    default:
      return "muted";
  }
}

const TYPE_LABEL: Record<string, string> = {
  camera_repair: "返修",
  camera_replace: "更换",
  camera_return: "退货",
  software_upgrade: "升级",
  software_reactivate: "重新激活",
  software_replace: "更换",
  software_return: "退货",
};

const CATEGORY_LABEL: Record<string, string> = {
  camera: "相机",
  software: "软件",
};

function deriveCategory(type: string): string {
  if (type.startsWith("camera_")) return "camera";
  if (type.startsWith("software_")) return "software";
  return type;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

const PAGE_SIZE = 20;

export default function AfterSalesListPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<AfterSalesItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      };
      if (status) params.status = status;
      if (category) params.category = category;
      const { data } = await api.get<AfterSalesListResponse | AfterSalesItem[]>(
        "/api/after-sales",
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
      setError("加载售后工单失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [page, status, category]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  function handleStatusChange(v: string) {
    setStatus(v);
    setPage(1);
  }

  function handleCategoryChange(v: string) {
    setCategory(v);
    setPage(1);
  }

  function handleRowClick(id: number) {
    router.push(`/dashboard/after-sales/${id}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canCreate = hasPermission("after_sales:create");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="售后管理"
        description="相机与软件售后工单处理。"
        actions={
          canCreate ? (
            <Button onClick={() => router.push("/dashboard/after-sales/new")}>
              <Plus className="h-4 w-4" />
              新建工单
            </Button>
          ) : null
        }
      />

      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || "all"}
            onClick={() => handleStatusChange(tab.value)}
            className={
              "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors " +
              (status === tab.value
                ? "border-accent text-fg-primary"
                : "border-transparent text-fg-secondary hover:text-fg-primary")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
          {"// 类别"}
        </span>
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value || "all"}
            onClick={() => handleCategoryChange(tab.value)}
            className={
              "rounded border px-3 py-1 text-xs font-medium transition-colors " +
              (category === tab.value
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-fg-secondary hover:text-fg-primary")
            }
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto">
          <Button variant="secondary" onClick={fetchList} title="刷新">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        {loading && items.length === 0 ? (
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
            <Button variant="secondary" onClick={fetchList}>
              重试
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-fg-muted">
            <LifeBuoy className="h-6 w-6" />
            <p className="font-mono text-xs uppercase tracking-widest">暂无工单</p>
          </div>
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <TH>工单号</TH>
                  <TH>类型</TH>
                  <TH>类别</TH>
                  <TH>物品SN</TH>
                  <TH>标题</TH>
                  <TH>状态</TH>
                  <TH>创建时间</TH>
                </tr>
              </THead>
              <TBody>
                {items.map((item) => {
                  const cat = item.category || deriveCategory(item.type);
                  return (
                    <TR
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(item.id)}
                    >
                      <TD className="font-mono text-xs text-fg-secondary">
                        {item.ticket_no || `#${item.id}`}
                      </TD>
                      <TD>{TYPE_LABEL[item.type] ?? item.type}</TD>
                      <TD>{CATEGORY_LABEL[cat] ?? cat}</TD>
                      <TD className="font-mono text-sm">{item.item_sn || "—"}</TD>
                      <TD className="max-w-xs truncate">{item.title || "—"}</TD>
                      <TD>
                        <Badge tone={statusTone(item.status)}>
                          {STATUS_LABEL[item.status] ?? item.status}
                        </Badge>
                      </TD>
                      <TD className="font-mono text-xs text-fg-secondary">
                        {formatDate(item.created_at)}
                      </TD>
                    </TR>
                  );
                })}
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
