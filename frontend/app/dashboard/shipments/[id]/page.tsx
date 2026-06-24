"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import api from "@/lib/api";

type ShipmentStatus = "shipped" | "received";

interface ShipmentItem {
  id: number;
  order_item_id: number;
  item_type: string;
  item_sn: string;
  quantity: number;
}

interface ShipmentDetail {
  id: number;
  order_id: number;
  order_no?: string;
  logistics_company: string;
  tracking_no: string;
  target_enterprise?: string;
  shipped_at: string;
  status: ShipmentStatus;
  remark?: string | null;
  items: ShipmentItem[];
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

const ITEM_TYPE_LABEL: Record<string, string> = {
  camera: "相机",
  software_lock: "软件锁",
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

function extractError(err: unknown, fallback: string): string {
  const apiErr = err as ApiErrorShape;
  const detail = apiErr?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  return fallback;
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

export default function ShipmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<ShipmentDetail>(
        `/api/shipments/${params.id}`,
      );
      setShipment(data);
    } catch (err) {
      setError(extractError(err, "加载发货详情失败"));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchShipment();
  }, [fetchShipment]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="发货详情"
        description={`记录 #${params.id}`}
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        }
      />

      {error && (
        <div className="flex items-start gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <Card>
          <div className="flex items-center justify-center gap-2 py-16 font-mono text-xs uppercase tracking-widest text-fg-muted">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            加载中…
          </div>
        </Card>
      ) : shipment ? (
        <div className="flex flex-col gap-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DetailRow label="发货ID">
                <span className="font-mono">#{shipment.id}</span>
              </DetailRow>
              <DetailRow label="订单ID">
                <span className="font-mono text-accent">
                  #{shipment.order_id}
                </span>
                {shipment.order_no && (
                  <span className="ml-2 font-mono text-xs text-fg-muted">
                    {shipment.order_no}
                  </span>
                )}
              </DetailRow>
              <DetailRow label="物流公司">
                {shipment.logistics_company || "—"}
              </DetailRow>
              <DetailRow label="运单号">
                <span className="font-mono text-sm">
                  {shipment.tracking_no}
                </span>
              </DetailRow>
              <DetailRow label="目标企业">
                {shipment.target_enterprise || "—"}
              </DetailRow>
              <DetailRow label="发货时间">
                <span className="font-mono text-xs">
                  {formatDateTime(shipment.shipped_at)}
                </span>
              </DetailRow>
              <DetailRow label="状态">
                <Badge tone={STATUS_TONE[shipment.status] ?? "muted"}>
                  {STATUS_LABEL[shipment.status] ?? shipment.status}
                </Badge>
              </DetailRow>
              {shipment.remark && (
                <DetailRow label="备注">
                  <span className="text-sm text-fg-secondary">
                    {shipment.remark}
                  </span>
                </DetailRow>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>发货物品明细</CardTitle>
              <span className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                {shipment.items?.length ?? 0} 项
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {shipment.items && shipment.items.length > 0 ? (
                <Table>
                  <THead>
                    <TR>
                      <TH>物品类型</TH>
                      <TH>序列号 (SN)</TH>
                      <TH className="text-right">数量</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {shipment.items.map((item) => (
                      <TR key={item.id}>
                        <TD>
                          <Badge tone="muted">
                            {ITEM_TYPE_LABEL[item.item_type] ?? item.item_type}
                          </Badge>
                        </TD>
                        <TD>
                          <span className="font-mono text-sm">
                            {item.item_sn}
                          </span>
                        </TD>
                        <TD className="text-right font-mono tabular-nums">
                          {item.quantity}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              ) : (
                <p className="py-8 text-center font-mono text-xs uppercase tracking-widest text-fg-muted">
                  暂无物品明细
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
