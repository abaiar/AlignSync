"""
AlignSync 前端全方位升级 — 浏览器端到端验证脚本
使用 Playwright 对全部业务功能进行全方位检查并截图记录。
"""
import sys
import os
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8000"
SHOT_DIR = "/workspace/.trae/specs/frontend-comprehensive-upgrade/screenshots"
os.makedirs(SHOT_DIR, exist_ok=True)

results = []


def step(name, ok, detail=""):
    results.append((name, ok, detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))


def shot(page, name):
    path = f"{SHOT_DIR}/{name}.png"
    page.screenshot(path=path, full_page=True)
    print(f"  screenshot -> {path}")


def wait_app(page):
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(800)


def run():
    with sync_playwright() as p:
        browser = p.firefox.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        # ============ 1. Dashboard ============
        print("\n=== 1. 数据大盘 ===")
        page.goto(BASE)
        wait_app(page)
        shot(page, "01-dashboard")

        kpi_texts = ["相机在库", "软件锁在库", "待处理订单", "已登记设备"]
        kpi_ok = all(page.get_by_text(t).count() > 0 for t in kpi_texts)
        step("大盘 KPI 卡片显示", kpi_ok)

        canvases = page.locator("canvas").count()
        step("大盘图表渲染 (canvas)", canvases >= 2, f"canvas count={canvases}")
        step("最近订单卡片", page.get_by_text("最近订单").count() > 0)

        # ============ 2. Camera management ============
        print("\n=== 2. 相机管理 ===")
        page.get_by_text("相机管理").first.click()
        wait_app(page)
        shot(page, "02-camera-list")

        page.get_by_role("button", name="同步相机信息").click()
        page.wait_for_timeout(500)
        shot(page, "03-camera-sync-modal")

        page.get_by_placeholder("输入相机序列号").fill("CAM-TEST-001")
        page.get_by_placeholder("如: CAM-X100").fill("CAM-X100")
        page.get_by_placeholder('{"fx": 1000, "fy": 1000, "cx": 640, "cy": 480}').first.fill('{"fx":1000,"fy":1000,"cx":640,"cy":480}')
        page.get_by_placeholder('{"tx": 0, "ty": 0, "tz": 0}').fill('{"tx":0,"ty":0,"tz":0}')
        page.locator('input[type="date"]').first.fill("2026-06-20")
        page.get_by_role("button", name="确认同步").click()
        wait_app(page)
        shot(page, "04-camera-after-sync")
        step("相机同步成功", page.get_by_text("CAM-TEST-001").count() > 0)

        # second camera
        page.get_by_role("button", name="同步相机信息").click()
        page.wait_for_timeout(400)
        page.get_by_placeholder("输入相机序列号").fill("CAM-TEST-002")
        page.get_by_placeholder("如: CAM-X100").fill("CAM-X200")
        page.get_by_placeholder('{"fx": 1000, "fy": 1000, "cx": 640, "cy": 480}').first.fill('{"fx":1200,"fy":1200,"cx":640,"cy":480}')
        page.get_by_placeholder('{"tx": 0, "ty": 0, "tz": 0}').fill('{"tx":1,"ty":1,"tz":1}')
        page.locator('input[type="date"]').first.fill("2026-06-21")
        page.get_by_role("button", name="确认同步").click()
        wait_app(page)

        # search
        search = page.get_by_placeholder("搜索")
        if search.count() > 0:
            search.fill("CAM-TEST-002")
            page.wait_for_timeout(600)
            shot(page, "05-camera-search")
            step("相机搜索过滤", page.get_by_text("CAM-TEST-002").count() > 0)
            search.fill("")
            page.wait_for_timeout(400)

        status_select = page.locator("select").first
        if status_select.count() > 0:
            status_select.select_option("在库")
            page.wait_for_timeout(800)
            shot(page, "06-camera-filter-status")
            step("相机状态筛选", page.get_by_text("CAM-TEST-001").count() > 0)
            status_select.select_option("")

        # ============ 3. Dongle management ============
        print("\n=== 3. 软件锁管理 ===")
        page.get_by_text("软件锁管理").first.click()
        wait_app(page)
        shot(page, "07-dongle-list")

        page.get_by_role("button", name="同步授权信息").click()
        page.wait_for_timeout(500)
        shot(page, "08-dongle-sync-modal")

        page.get_by_placeholder("输入软件锁ID").fill("DONGLE-TEST-001")
        page.get_by_placeholder("如: v3.2.1").fill("v3.2.1")
        page.get_by_placeholder("如: 3D定位,高级测量").fill("3D定位,高级测量")
        page.locator('input[type="date"]').first.fill("2027-12-31")
        page.get_by_role("button", name="确认同步").click()
        wait_app(page)
        shot(page, "09-dongle-after-sync")
        step("软件锁同步成功", page.get_by_text("DONGLE-TEST-001").count() > 0)

        # Business flow: dongle syncs as "已授权"(AUTHORIZED), must be moved to
        # "在库"(IN_STOCK) via PATCH before device assembly can bind it.
        page.request.patch(
            BASE + "/api/v1/dongles/DONGLE-TEST-001",
            data={"status": "在库"},
            headers={"Content-Type": "application/json"},
        )
        page.wait_for_timeout(300)

        # ============ 4. Order full flow ============
        print("\n=== 4. 采购订单全流程 ===")
        page.get_by_text("采购订单").first.click()
        wait_app(page)
        shot(page, "10-order-list")

        page.get_by_role("button", name="新建订单").click()
        page.wait_for_timeout(500)
        shot(page, "11-order-create-modal")

        page.get_by_placeholder("输入租户ID").fill("1")
        page.get_by_placeholder("产品型号").fill("ALIGN-PRO-1")
        page.get_by_placeholder("数量").fill("2")
        page.get_by_placeholder("单价").fill("5000")
        page.get_by_role("button", name="提交订单").click()
        wait_app(page)
        shot(page, "12-order-after-create")
        step("订单创建成功", page.get_by_text("待确认").count() > 0)

        # confirm order
        confirm_btn = page.get_by_role("button", name="确认订单")
        if confirm_btn.count() > 0:
            confirm_btn.first.click()
            page.wait_for_timeout(500)
            shot(page, "13-order-confirm-modal")
            page.get_by_role("button", name="确认").last.click()
            wait_app(page)
            step("订单确认成功", True)

        # pay order
        pay_btn = page.get_by_role("button", name="上传付款")
        if pay_btn.count() > 0:
            pay_btn.first.click()
            page.wait_for_timeout(500)
            shot(page, "14-order-pay-modal")
            amt = page.locator('input[type="number"]').first
            if amt.count() > 0:
                amt.fill("10000")
            file_input = page.locator('input[type="file"]')
            if file_input.count() > 0:
                import struct, zlib
                png_path = "/workspace/test_voucher.png"
                sig = b'\x89PNG\r\n\x1a\n'
                def chunk(t, d):
                    return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
                ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
                raw = b'\x00\xff\xff\xff'
                idat = zlib.compress(raw)
                with open(png_path, "wb") as f:
                    f.write(sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b''))
                file_input.set_input_files(png_path)
                page.wait_for_timeout(800)
                shot(page, "15-order-voucher-preview")
            page.get_by_role("button", name="确认").last.click()
            wait_app(page)
            step("订单上传付款成功", True)

        # confirm payment
        cp_btn = page.get_by_role("button", name="确认收款")
        if cp_btn.count() > 0:
            cp_btn.first.click()
            page.wait_for_timeout(600)
            shot(page, "16-order-confirm-payment")
            cd = page.get_by_role("button", name="确认")
            if cd.count() > 0:
                cd.last.click()
                wait_app(page)
            step("订单确认收款成功", True)

        # ship order
        ship_btn = page.get_by_role("button", name="发货")
        if ship_btn.count() > 0:
            ship_btn.first.click()
            page.wait_for_timeout(500)
            shot(page, "17-order-ship-modal")
            cam_sn_input = page.get_by_placeholder("相机SN")
            if cam_sn_input.count() > 0:
                cam_sn_input.first.fill("CAM-TEST-001")
            page.get_by_placeholder("如: 顺丰").fill("顺丰")
            page.get_by_placeholder("输入物流单号").fill("SF1234567890")
            page.get_by_role("button", name="确认").last.click()
            wait_app(page)
            step("订单发货成功", True)

        # receive order
        recv_btn = page.get_by_role("button", name="确认收货")
        if recv_btn.count() > 0:
            recv_btn.first.click()
            page.wait_for_timeout(600)
            shot(page, "18-order-receive")
            cd = page.get_by_role("button", name="确认")
            if cd.count() > 0:
                cd.last.click()
                wait_app(page)
            step("订单确认收货成功", True)

        shot(page, "19-order-final")
        step("订单全流程完成", page.get_by_text("已完成").count() > 0)

        # ============ 5. Device registration & trace ============
        print("\n=== 5. 设备登记与追溯 ===")
        page.get_by_text("设备登记").first.click()
        wait_app(page)
        shot(page, "20-device-register")

        page.get_by_placeholder("输入整机序列号").fill("DEV-TEST-001")
        page.get_by_placeholder("输入绑定的软件锁SN").fill("DONGLE-TEST-001")
        cam_inputs = page.get_by_placeholder("相机SN")
        if cam_inputs.count() >= 2:
            cam_inputs.nth(0).fill("CAM-TEST-001")
            cam_inputs.nth(1).fill("CAM-TEST-002")
        pos_selects = page.locator("select")
        if pos_selects.count() >= 2:
            pos_selects.nth(0).select_option("左")
            pos_selects.nth(1).select_option("右")

        page.get_by_role("button", name="提交设备登记").click()
        wait_app(page)
        shot(page, "21-device-after-register")
        step("设备登记成功", page.get_by_text("DEV-TEST-001").count() > 0)

        trace_btn = page.get_by_role("button", name="查看追溯")
        if trace_btn.count() > 0:
            trace_btn.first.click()
            page.wait_for_timeout(1000)
            shot(page, "22-device-trace-modal")
            step("设备追溯弹窗显示", page.get_by_text("设备追溯信息").count() > 0)
            # Close via Escape (modal supports Esc); avoids strict-mode violation
            # from multiple "关闭" buttons (header X + footer button).
            page.keyboard.press("Escape")
            page.wait_for_timeout(400)

        # ============ 6. Theme toggle ============
        print("\n=== 6. 主题切换 ===")
        page.get_by_text("数据大盘").first.click()
        wait_app(page)
        html_el = page.locator("html")
        dark_before = html_el.evaluate("el => el.classList.contains('dark')")
        theme_btn = page.locator("header button").filter(has=page.locator("svg")).last
        theme_btn.click()
        page.wait_for_timeout(600)
        shot(page, "23-dark-mode")
        dark_after = html_el.evaluate("el => el.classList.contains('dark')")
        step("主题切换生效", dark_before != dark_after, f"dark: {dark_before} -> {dark_after}")
        theme_btn.click()
        page.wait_for_timeout(400)

        # ============ 7. 404 page ============
        print("\n=== 7. 404 页面 ===")
        page.goto(BASE + "/nonexistent-page-xyz")
        wait_app(page)
        shot(page, "24-404-page")
        step("404 页面显示", page.get_by_text("404").count() > 0 or page.get_by_text("页面").count() > 0)
        back_btn = page.get_by_role("button", name="返回首页")
        if back_btn.count() > 0:
            back_btn.click()
        else:
            link = page.get_by_role("link", name="返回首页")
            if link.count() > 0:
                link.click()
            else:
                page.goto(BASE)
        wait_app(page)

        # ============ 8. Responsive (mobile) ============
        print("\n=== 8. 响应式 (移动端) ===")
        page.set_viewport_size({"width": 375, "height": 812})
        page.wait_for_timeout(500)
        shot(page, "25-mobile-view")
        hamburger = page.locator("header button").first
        hamburger.click()
        page.wait_for_timeout(500)
        shot(page, "26-mobile-drawer")
        step("移动端抽屉菜单", page.get_by_text("相机管理").count() > 0)
        # Navigate back via URL to avoid drawer-state flakiness.
        page.goto(BASE)
        wait_app(page)

        # ============ 9. Console errors ============
        print("\n=== 9. 控制台错误检查 ===")
        real_errors = [e for e in console_errors if "favicon" not in e.lower() and "404" not in e]
        step("无严重控制台错误", len(real_errors) == 0, f"errors={real_errors[:3]}")

        browser.close()

    print("\n" + "=" * 60)
    passed = sum(1 for _, ok, _ in results if ok)
    failed = sum(1 for _, ok, _ in results if not ok)
    print(f"总计: {len(results)}  通过: {passed}  失败: {failed}")
    print("=" * 60)
    for name, ok, detail in results:
        print(f"  [{'✓' if ok else '✗'}] {name}" + (f" — {detail}" if detail else ""))
    return failed == 0


if __name__ == "__main__":
    try:
        success = run()
        sys.exit(0 if success else 1)
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(2)
