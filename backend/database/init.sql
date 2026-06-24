-- AlignSync 数据库初始化脚本
-- 车轮定位仪生产协同管理系统

CREATE DATABASE IF NOT EXISTS alignsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE alignsync;

-- 时区设置 (东八区)
SET GLOBAL time_zone = '+08:00';
