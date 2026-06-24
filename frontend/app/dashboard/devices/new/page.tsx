"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Check,
  Minus,
  Cpu,
  KeyRound,
} from "lucide-react";
import api from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface SoftwareLock {
  id: number;
  lock_id: string;
  software_version: string;
  function_version: string;
  status: string;
  bound_enterprise_id: number | null;
}

interface CameraItem {
  id: number;
  sn: string;
  model: string;
  status: string;
}

interface SelectedCamera {
  cameraId: number;
  sn: string;
  model: string;
  positionLabel: string;
}

interface ApiErrorShape {
  response?: { data?: { detail?: unknown }; status?: number };
  message?: string;
}

const POSITION_OPTIONS = ["left", "right", "front", "rear"];

export default function NewDevicePage() {
  const router = useRouter();
  const [deviceSn, setDeviceSn] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [model, setModel] = useState("");
  const [remark, setRemark] = useState("");
  const [softwareLockId, setSoftwareLockId] = useState<number | "">("");
  const [locks, setLocks] = useState<SoftwareLock[]>([]);
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [selected, setSelected] = useState<Record<number, SelectedCamera>>({});
  const [loadingOpts, setLoadingOpts] = useState(true);
  const [optsError, setOptsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    setLoadingOpts(true);
    setOptsError(null);
    try {
      const [locksRes, camerasRes] = await Promise.all([
        api.get<SoftwareLock[] | { items: SoftwareLock[] }>(
          "/api/software-locks",
          { params: { skip: 0, limit: 200 } },
        ),
        api.get<CameraItem[] | { items: CameraItem[] }>("/api/cameras", {
          params: { status: "in_stock", skip: 0, limit: 200 },
        }),
      ]);
      const locksList = Array.isArray(locksRes.data)
        ? locksRes.data
        : locksRes.data.items ?? [];
      const camerasList = Array.isArray(camerasRes.data)
        ? camerasRes.data
        : camerasRes.data.items ?? [];
      // Available locks: not bound and status active/authorized
      setLocks(
        locksList.filter(
          (l) =>
            !l.bound_enterprise_id &&
            (l.status === "active" || l.status === "authorized"),
        ),
      );
      setCameras(camerasList);
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      const detail = apiErr?.response?.data?.detail;
      setOptsError(typeof detail === "string" ? detail : "加载选项数据失败");
    } finally {
      setLoadingOpts(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const selectedList = useMemo(() => Object.values(selected), [selected]);

  function toggleCamera(cam: CameraItem) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[cam.id]) {
        delete next[cam.id];
      } else {
        next[cam.id] = {
          cameraId: cam.id,
          sn: cam.sn,
          model: cam.model,
          positionLabel: POSITION_OPTIONS[0],
        };
      }
      return next;
    });
  }

  function updatePosition(cameraId: number, positionLabel: string) {
    setSelected((prev) => {
      const item = prev[cameraId];
      if (!item) return prev;
      return { ...prev, [cameraId]: { ...item, positionLabel } };
    });
  }

  async function handleSubmit() {
    if (!deviceSn.trim()) {
      setSubmitError("请输入设备SN");
      return;
    }
    if (!softwareLockId) {
      setSubmitError("请选择软件锁");
      return;
    }
    if (selectedList.length < 2) {
      setSubmitError("至少需要选择 2 个相机 (BR-ASM-001)");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        device_sn: deviceSn.trim(),
        device_name: deviceName.trim() || undefined,
        model: model.trim() || undefined,
        software_lock_id: softwareLockId,
        cameras: selectedList.map((c) => ({
          camera_id: c.cameraId,
          position_label: c.positionLabel,
        })),
        remark: remark.trim() || undefined,
      };
      const { data } = await api.post<{ id: number }>("/api/devices", payload);
      router.push(`/dashboard/devices/${data.id}`);
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      const detail = apiErr?.response?.data?.detail;
      setSubmitError(
        typeof detail === "string" ? detail : "注册设备失败，请重试",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="新增设备"
        description="组装新设备 — 绑定软件锁与至少 2 个相机。"
        actions={
          <Link href="/dashboard/devices">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left — basic info + camera selection */}
        <div className="flex flex-col gap-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="设备SN"
                name="device_sn"
                required
                value={deviceSn}
                onChange={(e) => setDeviceSn(e.target.value)}
                placeholder="输入设备序列号"
              />
              <Input
                label="设备名称"
                name="device_name"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="可选"
              />
              <Input
                label="型号"
                name="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="可选"
              />
              <Input
                label="备注"
                name="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="可选"
              />
            </CardContent>
          </Card>

          {/* Camera selection */}
          <Card>
            <CardHeader>
              <CardTitle>相机选择</CardTitle>
              <span className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                至少 2 个 · 已选 {selectedList.length}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {loadingOpts ? (
                <div className="flex items-center justify-center gap-2 py-12 font-mono text-xs uppercase tracking-widest text-fg-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  加载相机中…
                </div>
              ) : optsError ? (
                <div className="flex items-start gap-2 px-4 py-6 text-sm text-danger">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{optsError}</span>
                </div>
              ) : cameras.length === 0 ? (
                <div className="px-4 py-12 text-center font-mono text-xs uppercase tracking-widest text-fg-muted">
                  暂无在库相机
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {cameras.map((cam) => {
                    const isSelected = !!selected[cam.id];
                    return (
                      <li
                        key={cam.id}
                        className="flex items-center justify-between gap-4 px-4 py-3"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span
                            className={
                              isSelected
                                ? "flex h-5 w-5 shrink-0 items-center justify-center border border-accent bg-accent text-black"
                                : "flex h-5 w-5 shrink-0 items-center justify-center border border-border"
                            }
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleCamera(cam)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate font-mono text-sm text-fg-primary">
                              {cam.sn}
                            </p>
                            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                              {cam.model || "—"}
                            </p>
                          </button>
                        </div>
                        <Button
                          variant={isSelected ? "secondary" : "primary"}
                          onClick={() => toggleCamera(cam)}
                          className="h-7 px-3 text-xs"
                        >
                          {isSelected ? (
                            <>
                              <Minus className="h-3 w-3" />
                              移除
                            </>
                          ) : (
                            "选择"
                          )}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right — software lock + selected cameras + actions */}
        <div className="flex flex-col gap-6">
          {/* Software lock */}
          <Card>
            <CardHeader>
              <CardTitle>软件锁</CardTitle>
              <KeyRound className="h-4 w-4 text-fg-muted" />
            </CardHeader>
            <CardContent>
              {loadingOpts ? (
                <div className="flex items-center gap-2 py-4 font-mono text-xs uppercase tracking-widest text-fg-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  加载软件锁中…
                </div>
              ) : optsError ? (
                <div className="flex items-start gap-2 text-sm text-danger">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{optsError}</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                    选择软件锁
                  </label>
                  <select
                    value={softwareLockId}
                    onChange={(e) =>
                      setSoftwareLockId(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="h-9 rounded border border-border bg-surface-elevated px-3 font-sans text-sm text-fg-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                  >
                    <option value="">— 请选择 —</option>
                    {locks.map((lock) => (
                      <option key={lock.id} value={lock.id}>
                        {lock.lock_id} · {lock.software_version || "—"}
                      </option>
                    ))}
                  </select>
                  {locks.length === 0 && (
                    <p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                      暂无可用软件锁
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected cameras */}
          <Card>
            <CardHeader>
              <CardTitle>已选相机</CardTitle>
              <span className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                {selectedList.length} 个
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {selectedList.length === 0 && (
                <p className="py-6 text-center font-mono text-xs uppercase tracking-widest text-fg-muted">
                  请从左侧选择相机
                </p>
              )}
              {selectedList.map((item) => (
                <div
                  key={item.cameraId}
                  className="border border-border bg-surface-elevated p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm text-fg-primary">
                        {item.sn}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                        {item.model || "—"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cam = cameras.find((c) => c.id === item.cameraId);
                        if (cam) toggleCamera(cam);
                      }}
                      className="font-mono text-[10px] uppercase tracking-wider text-fg-muted hover:text-danger"
                    >
                      移除
                    </button>
                  </div>
                  <div className="mt-3 flex flex-col gap-1.5">
                    <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                      安装位置
                    </label>
                    <select
                      value={item.positionLabel}
                      onChange={(e) =>
                        updatePosition(item.cameraId, e.target.value)
                      }
                      className="h-9 rounded border border-border bg-surface-elevated px-3 font-sans text-sm text-fg-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                    >
                      {POSITION_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <Card>
            <CardContent className="flex flex-col gap-3">
              {submitError && (
                <div className="flex items-start gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
              <Button
                className="w-full"
                disabled={submitting || loadingOpts}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    注册中…
                  </>
                ) : (
                  <>
                    <Cpu className="h-4 w-4" />
                    注册设备
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
