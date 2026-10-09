#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE BACKUP AUTOMATIZADO COM CRIPTOGRAFIA AES-256
# jg-multi-brand-retail - Fase 3: Infraestrutura e Backup
# ==============================================================================
set -euo pipefail

# Configurações com defaults
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-retail_saas}"
PGUSER="${PGUSER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-retail_backup_secret_key_2026}"
S3_BUCKET="${S3_BUCKET:-}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

RAW_DUMP="${BACKUP_DIR}/retail_${PGDATABASE}_${TIMESTAMP}.dump"
ENC_DUMP="${RAW_DUMP}.enc"
LOG_FILE="${BACKUP_DIR}/backup.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando backup do banco '${PGDATABASE}' em '${PGHOST}:${PGPORT}'..." | tee -a "$LOG_FILE"

# 1. Executar pg_dump consistente comprimido em formato custom (-Fc)
# --no-owner e --no-privileges garantem portabilidade entre usuários do banco
pg_dump \
  -h "$PGHOST" \
  -p "$PGPORT" \
  -U "$PGUSER" \
  -d "$PGDATABASE" \
  -Fc \
  --no-owner \
  --no-privileges \
  -f "$RAW_DUMP"

DUMP_SIZE=$(stat -c%s "$RAW_DUMP" 2>/dev/null || stat -f%z "$RAW_DUMP" 2>/dev/null || wc -c < "$RAW_DUMP")
SHA256_RAW=$(sha256sum "$RAW_DUMP" 2>/dev/null | awk '{print $1}' || shasum -a 256 "$RAW_DUMP" | awk '{print $1}')

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Dump gerado com sucesso. Tamanho: ${DUMP_SIZE} bytes. SHA256: ${SHA256_RAW}" | tee -a "$LOG_FILE"

# 2. Criptografar arquivo com OpenSSL AES-256-CBC e PBKDF2
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
  -in "$RAW_DUMP" \
  -out "$ENC_DUMP" \
  -pass "pass:${BACKUP_ENCRYPTION_KEY}"

# Remover dump em texto claro
rm -f "$RAW_DUMP"

SHA256_ENC=$(sha256sum "$ENC_DUMP" 2>/dev/null | awk '{print $1}' || shasum -a 256 "$ENC_DUMP" | awk '{print $1}')
ENC_SIZE=$(stat -c%s "$ENC_DUMP" 2>/dev/null || stat -f%z "$ENC_DUMP" 2>/dev/null || wc -c < "$ENC_DUMP")

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup criptografado: ${ENC_DUMP} (${ENC_SIZE} bytes). SHA256_ENC: ${SHA256_ENC}" | tee -a "$LOG_FILE"

# 3. Envio opcional para S3 / MinIO (com suporte a dry-run se ausente)
if [ -n "$S3_BUCKET" ]; then
  if command -v aws >/dev/null 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Enviando ${ENC_DUMP} para ${S3_BUCKET} via AWS CLI..." | tee -a "$LOG_FILE"
    aws s3 cp "$ENC_DUMP" "${S3_BUCKET}/"
  elif command -v rclone >/dev/null 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Enviando ${ENC_DUMP} para ${S3_BUCKET} via rclone..." | tee -a "$LOG_FILE"
    rclone copy "$ENC_DUMP" "${S3_BUCKET}/"
  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [DRY-RUN] S3 configurado (${S3_BUCKET}), mas 'aws' ou 'rclone' não estão instalados no host." | tee -a "$LOG_FILE"
  fi
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] S3_BUCKET não informado. Backup retido apenas localmente em ${BACKUP_DIR}." | tee -a "$LOG_FILE"
fi

# 4. Limpeza de backups antigos conforme RETENTION_DAYS
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Limpando backups com mais de ${RETENTION_DAYS} dias em ${BACKUP_DIR}..." | tee -a "$LOG_FILE"
find "$BACKUP_DIR" -name "*.dump.enc" -type f -mtime +"$RETENTION_DAYS" -exec rm -f {} \; || true

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup concluído com sucesso: ${ENC_DUMP}" | tee -a "$LOG_FILE"
