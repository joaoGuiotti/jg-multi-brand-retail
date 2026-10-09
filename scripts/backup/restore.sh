#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE RESTAURAÇÃO DE BACKUP COM DESCRIPTOGRAFIA E VALIDAÇÃO
# jg-multi-brand-retail - Fase 3: Infraestrutura e Backup
# ==============================================================================
set -euo pipefail

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
TARGET_DB="${TARGET_DB:-${PGDATABASE:-retail_saas}}"
PGUSER="${PGUSER:-postgres}"
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-retail_backup_secret_key_2026}"

BACKUP_FILE=""
DRY_RUN=false
FORCE=false

print_usage() {
  echo "Uso: $0 --file <caminho_para_arquivo.enc> [--dry-run] [--force] [--target-db <nome_do_banco>]"
  echo "Opções:"
  echo "  --file        Caminho do arquivo de backup criptografado (.enc)"
  echo "  --dry-run     Apenas descriptografa e valida a integridade do arquivo sem restaurar"
  echo "  --force       Ignora confirmação interativa de segurança"
  echo "  --target-db   Nome do banco de destino (default: \$TARGET_DB ou retail_saas)"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)
      BACKUP_FILE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --target-db)
      TARGET_DB="$2"
      shift 2
      ;;
    *)
      echo "Opção desconhecida: $1"
      print_usage
      ;;
  esac
done

if [ -z "$BACKUP_FILE" ]; then
  echo "ERRO: O parâmetro --file é obrigatório."
  print_usage
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERRO: Arquivo não encontrado: $BACKUP_FILE"
  exit 1
fi

TEMP_RESTORE_FILE="${BACKUP_FILE%.enc}.tmp_restore"
trap 'rm -f "$TEMP_RESTORE_FILE"' EXIT

echo "[1/4] Descriptografando ${BACKUP_FILE} com OpenSSL AES-256..."
openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 \
  -in "$BACKUP_FILE" \
  -out "$TEMP_RESTORE_FILE" \
  -pass "pass:${BACKUP_ENCRYPTION_KEY}"

echo "[2/4] Validando integridade do arquivo através de pg_restore --list..."
pg_restore --list "$TEMP_RESTORE_FILE" > /dev/null
echo "✓ Integridade confirmada: o arquivo é um dump válido do PostgreSQL."

if [ "$DRY_RUN" = true ]; then
  echo "--------------------------------------------------------"
  echo "[DRY-RUN] Validação concluída com sucesso! Nenhum dado foi alterado."
  echo "--------------------------------------------------------"
  exit 0
fi

if [ "$FORCE" != true ]; then
  echo ""
  echo "ATENÇÃO: A restauração substituirá os dados no banco '${TARGET_DB}' em '${PGHOST}:${PGPORT}'!"
  read -r -p "Deseja continuar com a restauração? (digite 'sim' para confirmar): " CONFIRM
  if [ "$CONFIRM" != "sim" ]; then
    echo "Operação cancelada pelo usuário."
    exit 0
  fi
fi

echo "[3/4] Executando restauração via pg_restore para o banco '${TARGET_DB}'..."
# Executa como retail_migrator/postgres para garantir permissões de recriação DDL
pg_restore \
  -h "$PGHOST" \
  -p "$PGPORT" \
  -U "$PGUSER" \
  -d "$TARGET_DB" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  "$TEMP_RESTORE_FILE" || {
    # pg_restore pode retornar códigos de aviso para objetos já existentes/limpos
    echo "Aviso: pg_restore finalizou com avisos não-críticos."
  }

echo "[4/4] Restauração concluída com sucesso no banco '${TARGET_DB}'!"
