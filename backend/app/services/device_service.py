from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.device import DeviceAssembleRequest, DeviceResponse, DeviceListResponse, DeviceTraceResponse


async def assemble_device(
    db: AsyncSession, data: DeviceAssembleRequest
) -> DeviceResponse:
    """登记定位仪设备（硬件组装绑定）。

    核心业务逻辑：
    1. 校验整机SN唯一性
    2. 校验软件锁SN存在且状态为"在库"
    3. 校验所有相机SN存在且状态为"在库"
    4. 校验相机安装位置不重复
    5. 生成基于相机内参的授权号
    6. 更新各部件状态为"已使用"

    Args:
        db: 异步数据库会话
        data: 设备组装请求数据（device_sn, dongle_sn, cameras列表）

    Returns:
        DeviceResponse: 登记后的设备信息（含授权号）

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def get_devices(
    db: AsyncSession, skip: int = 0, limit: int = 20, status: str | None = None
) -> DeviceListResponse:
    """获取设备列表。

    Args:
        db: 异步数据库会话
        skip: 分页偏移量
        limit: 每页数量
        status: 按状态筛选

    Returns:
        DeviceListResponse: 设备列表及总数

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def get_device_by_sn(db: AsyncSession, device_sn: str) -> DeviceResponse | None:
    """根据SN获取设备信息。

    Args:
        db: 异步数据库会话
        device_sn: 设备序列号

    Returns:
        DeviceResponse | None: 设备信息

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def trace_device(db: AsyncSession, device_sn: str) -> DeviceTraceResponse | None:
    """查询设备追溯信息（含相机标定参数、软件锁版本、采购日期、生产人员）。

    Args:
        db: 异步数据库会话
        device_sn: 设备序列号

    Returns:
        DeviceTraceResponse | None: 设备追溯信息

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")
