#!/bin/bash
# =============================================================================
# MinIO Auto-Setup Script for vService
# รันครั้งเดียวหลังจากติดตั้ง MinIO บน Coolify เรียบร้อย
# =============================================================================

MINIO_ALIAS="vservice"
MINIO_URL="${MINIO_API_URL:-https://storage.vibepjm.online}"
MINIO_USER="${MINIO_ROOT_USER:-vservice_admin}"
MINIO_PASS="${MINIO_ROOT_PASSWORD:-VService@Minio2026!}"

echo "🚀 Setting up MinIO for vService..."

# Download mc (MinIO Client) if not exists
if ! command -v mc &> /dev/null; then
  echo "📥 Downloading MinIO Client (mc)..."
  curl -O https://dl.min.io/client/mc/release/linux-amd64/mc
  chmod +x mc
  sudo mv mc /usr/local/bin/
fi

# Set MinIO alias
mc alias set $MINIO_ALIAS $MINIO_URL $MINIO_USER $MINIO_PASS

# Create buckets
echo "📦 Creating buckets..."
mc mb --ignore-existing $MINIO_ALIAS/vservice-banners
mc mb --ignore-existing $MINIO_ALIAS/vservice-services
mc mb --ignore-existing $MINIO_ALIAS/vservice-avatars

# Set public read policy for all buckets
echo "🔓 Setting public read policy..."
mc anonymous set download $MINIO_ALIAS/vservice-banners
mc anonymous set download $MINIO_ALIAS/vservice-services
mc anonymous set download $MINIO_ALIAS/vservice-avatars

# Configure CORS for browser uploads
echo "🌐 Configuring CORS for browser uploads..."
cat > /tmp/cors.json << 'EOF'
{
  "cors": [{
    "allowedHeaders": ["*"],
    "allowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "allowedOrigins": ["*"],
    "exposeHeaders": ["ETag"],
    "maxAgeSeconds": 3600
  }]
}
EOF

mc cors set --recursive $MINIO_ALIAS/vservice-banners /tmp/cors.json
mc cors set --recursive $MINIO_ALIAS/vservice-services /tmp/cors.json
mc cors set --recursive $MINIO_ALIAS/vservice-avatars /tmp/cors.json

# Create dedicated API user (not root) for the app
echo "👤 Creating dedicated API user..."
mc admin user add $MINIO_ALIAS vservice_api VService@API2026!
mc admin policy attach $MINIO_ALIAS readwrite --user vservice_api

echo ""
echo "✅ MinIO Setup Complete!"
echo ""
echo "📋 Connection Info:"
echo "   API Endpoint : $MINIO_URL"
echo "   Console URL  : ${MINIO_CONSOLE_URL:-https://minio.vibepjm.online}"
echo "   Access Key   : vservice_api"
echo "   Secret Key   : VService@API2026!"
echo "   Buckets      : vservice-banners, vservice-services, vservice-avatars"
echo ""
echo "⚙️  Copy these values to vService Backend Settings → MinIO Configuration"
