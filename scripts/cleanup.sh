#!/bin/bash
#
# AlignSync 磁盘清理脚本
# 功能：清理过期日志归档、临时文件、缓存，监控磁盘使用率
# 执行：每日凌晨 3:00 由 crontab 自动调用
#

LOG_DIR="/var/log/alignsync"
CLEANUP_LOG="${LOG_DIR}/cleanup.log"
TMP_DIR="/tmp"
DISK_THRESHOLD=80

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "${CLEANUP_LOG}"
}

log "========== 清理任务开始 =========="

# 1. 清理超过 30 天的日志归档文件
log "清理超过 30 天的日志归档文件..."
find "${LOG_DIR}" -name "*.gz" -type f -mtime +30 -delete 2>/dev/null
find "${LOG_DIR}" -name "*.log.1" -type f -mtime +30 -delete 2>/dev/null
find "/var/log/nginx" -name "*.gz" -type f -mtime +30 -delete 2>/dev/null
log "日志归档清理完成"

# 2. 清理 /tmp 目录中超过 7 天的临时文件
log "清理 /tmp 目录中超过 7 天的临时文件..."
find "${TMP_DIR}" -type f -mtime +7 -delete 2>/dev/null
log "临时文件清理完成"

# 3. 清理 npm 缓存
log "清理 npm 缓存..."
su - ubuntu -c "/home/ubuntu/.trae-cn-server/binaries/node/versions/24.18.0/bin/npm cache clean --force" 2>/dev/null
log "npm 缓存清理完成"

# 4. 清理 pip 缓存
log "清理 pip 缓存..."
su - ubuntu -c "/home/ubuntu/.local/share/miniconda3/envs/alignsync/bin/pip cache purge" 2>/dev/null
log "pip 缓存清理完成"

# 5. 检查磁盘使用率
log "检查磁盘使用率..."
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
log "当前磁盘使用率: ${DISK_USAGE}%"
if [ "${DISK_USAGE}" -gt "${DISK_THRESHOLD}" ]; then
    log "警告：磁盘使用率 ${DISK_USAGE}% 超过阈值 ${DISK_THRESHOLD}%！"
    log "正在执行紧急清理..."
    # 清理 apt 缓存
    apt-get clean 2>/dev/null
    log "apt 缓存已清理"
    # 清理旧日志（保留 7 天）
    find "${LOG_DIR}" -name "*.gz" -type f -mtime +7 -delete 2>/dev/null
    find "/var/log/nginx" -name "*.gz" -type f -mtime +7 -delete 2>/dev/null
    log "紧急日志清理完成（保留 7 天）"
fi

log "========== 清理任务完成 =========="
