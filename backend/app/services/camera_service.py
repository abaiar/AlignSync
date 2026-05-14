from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.camera import CameraCreate, CameraResponse, CameraListResponse, CameraUpdate


async def sync_camera(db: AsyncSession, camera_in: CameraCreate) -> CameraResponse:
    """同步相机信息到系统库存。

    Args:
        db: 异步数据库会话
        camera_in: 相机创建数据（SN、型号、标定参数等）

    Returns:
        CameraResponse: 同步后的相机信息

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def get_cameras(
    db: AsyncSession, skip: int = 0, limit: int = 20, status: str | None = None
) -> CameraListResponse:
    """获取相机列表。

    Args:
        db: 异步数据库会话
        skip: 分页偏移量
        limit: 每页数量
        status: 按状态筛选

    Returns:
        CameraListResponse: 相机列表及总数

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def get_camera_by_sn(db: AsyncSession, sn: str) -> CameraResponse | None:
    """根据SN获取相机信息。

    Args:
        db: 异步数据库会话
        sn: 相机序列号

    Returns:
        CameraResponse | None: 相机信息，不存在则返回None

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def update_camera(db: AsyncSession, sn: str, camera_in: CameraUpdate) -> CameraResponse | None:
    """更新相机信息。

    Args:
        db: 异步数据库会话
        sn: 相机序列号
        camera_in: 更新数据

    Returns:
        CameraResponse | None: 更新后的相机信息

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")
