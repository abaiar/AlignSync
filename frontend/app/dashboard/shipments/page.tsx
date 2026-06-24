"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Truck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import api from "@/lib/api";

type ShipmentStatus = "shipped" | "received";

interface ShipmentListItem {
  id: number;
  order_id: number;
  order_no?: string;
  logistics_company: string;
  tracking_no: string;
  target_enterprise?: string;
  status: ShipmentStatus;
  shipped_at: string;
}

interface ShipmentListResponse {
  items: ShipmentListItem[];
  total?: number;
}

interface ApiErrorShape {
  response?: { data?: { detail?: unknown } };
}

const STATUS_LABEL: Record<string, string> = {
  shipped: "已发货",
  received: "已签收",
};

const STATUS_TONE: Record<string, "info" | "success"> = {
  shipped: "info",
  received: "success",
};

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

export default function ShipmentListPage() {
  const router = useRouter();
  const [items, setItems] = useState<ShipmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<
        ShipmentListResponse | ShipmentListItem[]
      >("/api/shipments", { params: { skip: 0, limit: 50 } });
      const list = Array.isArray(data) ? data : data.items ?? [];
      setItems(list);
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      const detail = apiErr?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "加载发货列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="发货管理"
        description="物流发货记录与签收状态。"
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
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-fg-muted">
            <Truck className="h-8 w-8" />
            <p className="font-mono text-xs uppercase tracking-widest">暂无发货记录</p>
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>订单ID</TH>
                <TH>物流公司</TH>
                <TH>运单号</TH>
                <TH>目标企业</TH>
                <TH>状态</TH>
                <TH>发货时间</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((s) => (
                <TR
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/shipments/${s.id}`)}
                >
                  <TD>
                    <span className="font-mono text-sm text-accent">
                      #{s.order_id}
                    </span>
                    {s.order_no && (
                      <span className="ml-2 font-mono text-xs text-fg-muted">
                        {s.order_no}
                      </span>
                    )}
                  </TD>
                  <TD>{s.logistics_company || "—"}</TD>
                  <TD>
                    <span className="font-mono text-sm">{s.tracking_no}</span>
                  </TD>
                  <TD>{s.target_enterprise || "—"}</TD>
                  <TD>
                    <Badge tone={STATUS_TONE[s.status] ?? "muted"}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </Badge>
                  </TD>
                  <TD className="font-mono text-xs text-fg-secondary">
                    {formatDateTime(s.shipped_at)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
        {"// 点击行查看发货详情"}
      </p>
    </div>
  );
}
