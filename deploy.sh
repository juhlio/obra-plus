#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Script de deploy do Obra+ em produção
#
# Uso:
#   ./deploy.sh           → deploy completo
#   ./deploy.sh --ssl     → emite certificado SSL pela primeira vez (só rodar 1x)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml"
DOMAIN="${DOMAIN:-}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[deploy]${NC} $1"; }
warn()    { echo -e "${YELLOW}[aviso]${NC} $1"; }
error()   { echo -e "${RED}[erro]${NC} $1"; exit 1; }

# ── Validações ────────────────────────────────────────────────────────────────
[[ -f ".env" ]] || error "Arquivo .env não encontrado. Copie .env.production.example e preencha."
[[ -f "backend/.env" ]] || error "Arquivo backend/.env não encontrado."

# ── 1. Build do frontend ──────────────────────────────────────────────────────
info "Instalando dependências e buildando o frontend..."
cd frontend
npm ci --prefer-offline
npm run build
cd ..
info "Frontend buildado em frontend/dist/ ✓"

# ── 2. Build das imagens Docker ───────────────────────────────────────────────
info "Buildando imagens Docker..."
$COMPOSE build --no-cache app nginx

# ── 3. Subir containers ───────────────────────────────────────────────────────
info "Subindo containers..."
$COMPOSE up -d --remove-orphans

# ── 4. Aguardar banco de dados ────────────────────────────────────────────────
info "Aguardando banco de dados..."
until $COMPOSE exec -T db mysqladmin ping -h localhost --silent 2>/dev/null; do
  printf '.'
  sleep 2
done
echo ""

# ── 5. Migrations + otimizações Laravel ──────────────────────────────────────
info "Rodando migrations..."
$COMPOSE exec -T app php artisan migrate --force

info "Otimizando Laravel para produção..."
$COMPOSE exec -T app php artisan optimize
$COMPOSE exec -T app php artisan storage:link 2>/dev/null || true

# ── 6. SSL (opcional — só na primeira vez) ────────────────────────────────────
if [[ "${1:-}" == "--ssl" ]]; then
  [[ -n "$DOMAIN" ]] || error "Defina a variável DOMAIN. Ex: DOMAIN=seusite.com ./deploy.sh --ssl"
  EMAIL="${CERTBOT_EMAIL:-}"
  [[ -n "$EMAIL" ]] || error "Defina CERTBOT_EMAIL. Ex: CERTBOT_EMAIL=voce@email.com ./deploy.sh --ssl"

  warn "Emitindo certificado SSL para $DOMAIN..."
  $COMPOSE run --rm certbot certonly \
    --webroot -w /var/www/certbot \
    --email "$EMAIL" \
    --agree-tos --no-eff-email \
    -d "$DOMAIN" -d "www.$DOMAIN"

  info "Recarregando nginx com SSL..."
  $COMPOSE exec nginx nginx -s reload
fi

# ── Resultado ─────────────────────────────────────────────────────────────────
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Deploy concluído com sucesso! ✓"
$COMPOSE ps
