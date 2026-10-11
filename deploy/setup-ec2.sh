#!/usr/bin/env bash
set -e

echo "=== 1. Updating System Packages ==="
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl git build-essential nginx

echo "=== 2. Installing Node.js 22 LTS ==="
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

echo "=== 3. Installing Project Dependencies ==="
npm install

echo "=== 4. Setting up Environment File ==="
if [ ! -f backend/.env ]; then
  RANDOM_SECRET=$(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")
  cat <<EOF > backend/.env
PORT=5001
NODE_ENV=production
SESSION_SECRET=${RANDOM_SECRET}
EOF
  echo "Created backend/.env with a secure random SESSION_SECRET"
fi

echo "=== 5. Starting Application with PM2 ==="
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME || true

echo "=== 6. Configuring Nginx Reverse Proxy ==="
sudo tee /etc/nginx/sites-available/breathe-clean > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/breathe-clean /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo ""
echo "=========================================================="
echo "🎉 Breathe Clean is now LIVE on your public EC2 IP address!"
echo "Visit: http://$(curl -s http://checkip.amazonaws.com)"
echo "=========================================================="
