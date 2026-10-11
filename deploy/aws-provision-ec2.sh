#!/usr/bin/env bash
set -e

REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"
INSTANCE_TYPE="t2.micro"

# In regions where t2 is not available in free tier, fallback to t3.micro
if [[ "$REGION" =~ ^(ap-south-1|eu-north-1|me-central-1|il-central-1)$ ]]; then
  INSTANCE_TYPE="t3.micro"
fi

echo "=========================================================="
echo "🚀 Breathe Clean — Automated AWS EC2 Provisioning"
echo "Region: $REGION | Instance Type: $INSTANCE_TYPE"
echo "=========================================================="

echo "1. Checking AWS credentials..."
CALLER_IDENTITY=$(aws sts get-caller-identity --output json)
ACCOUNT_ID=$(echo "$CALLER_IDENTITY" | grep -o '"Account": "[^"]*' | cut -d'"' -f4)
echo "✅ Authenticated with AWS Account: $ACCOUNT_ID"

echo "2. Finding default VPC..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --region "$REGION" --query "Vpcs[0].VpcId" --output text)
if [ "$VPC_ID" == "None" ] || [ -z "$VPC_ID" ]; then
  VPC_ID=$(aws ec2 describe-vpcs --region "$REGION" --query "Vpcs[0].VpcId" --output text)
fi
echo "✅ Using VPC: $VPC_ID"

echo "3. Setting up Security Group (breathe-clean-sg)..."
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=breathe-clean-sg" "Name=vpc-id,Values=$VPC_ID" --region "$REGION" --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || true)

if [ "$SG_ID" == "None" ] || [ -z "$SG_ID" ]; then
  SG_ID=$(aws ec2 create-security-group \
    --group-name "breathe-clean-sg" \
    --description "Security group for Breathe Clean web server" \
    --vpc-id "$VPC_ID" \
    --region "$REGION" \
    --output text)
  echo "Created Security Group: $SG_ID"

  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0 --region "$REGION"
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "$REGION"
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0 --region "$REGION"
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 5001 --cidr 0.0.0.0/0 --region "$REGION"
  echo "✅ Configured ingress rules for ports 22, 80, 443, and 5001"
else
  echo "✅ Security Group exists: $SG_ID"
fi

echo "4. Setting up Key Pair (breathe-clean-key)..."
KEY_FILE="./breathe-clean-key.pem"
if ! aws ec2 describe-key-pairs --key-names "breathe-clean-key" --region "$REGION" >/dev/null 2>&1; then
  aws ec2 create-key-pair \
    --key-name "breathe-clean-key" \
    --query "KeyMaterial" \
    --output text \
    --region "$REGION" > "$KEY_FILE"
  chmod 400 "$KEY_FILE"
  echo "✅ Created and saved SSH key to $KEY_FILE"
else
  echo "✅ Key Pair 'breathe-clean-key' already exists on AWS"
fi

echo "5. Finding latest Ubuntu 24.04 LTS AMI..."
AMI_ID=$(aws ec2 describe-images \
  --owners 099720109477 \
  --filters "Name=name,Values=ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*" "Name=state,Values=available" \
  --query "reverse(sort_by(Images, &CreationDate))[0].ImageId" \
  --output text \
  --region "$REGION")

if [ "$AMI_ID" == "None" ] || [ -z "$AMI_ID" ]; then
  # Fallback to 22.04 LTS
  AMI_ID=$(aws ec2 describe-images \
    --owners 099720109477 \
    --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" "Name=state,Values=available" \
    --query "reverse(sort_by(Images, &CreationDate))[0].ImageId" \
    --output text \
    --region "$REGION")
fi
echo "✅ Selected AMI: $AMI_ID"

echo "6. Preparing Cloud-Init Bootstrap Script..."
cat <<'USERDATA' > ./user-data.sh
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
export DEBIAN_FRONTEND=noninteractive

echo "Starting Breathe Clean automated bootstrap..."
apt-get update -y
apt-get install -y curl git build-essential nginx

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pm2

mkdir -p /var/www
cd /var/www
git clone https://github.com/DivamMalik/Breathe-Clean.git app
cd app

npm install

RANDOM_SECRET=$(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")
cat <<EOF > backend/.env
PORT=5001
NODE_ENV=production
SESSION_SECRET=${RANDOM_SECRET}
EOF

pm2 start ecosystem.config.js
pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root || true

tee /etc/nginx/sites-available/breathe-clean > /dev/null <<'NGINX'
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
NGINX

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/breathe-clean /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

echo "Breathe Clean provisioning complete!"
USERDATA

echo "7. Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --count 1 \
  --instance-type "$INSTANCE_TYPE" \
  --key-name "breathe-clean-key" \
  --security-group-ids "$SG_ID" \
  --user-data file://./user-data.sh \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=breathe-clean-server}]" \
  --region "$REGION" \
  --query "Instances[0].InstanceId" \
  --output text)

echo "✅ Instance created with ID: $INSTANCE_ID"
echo "⏳ Waiting for instance to initialize and assign public IP..."

aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" \
  --region "$REGION" \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --output text)

rm -f ./user-data.sh

echo ""
echo "=========================================================="
echo "🎉 SUCCESS! Your Breathe Clean server has been launched!"
echo "=========================================================="
echo "Instance ID : $INSTANCE_ID"
echo "Region      : $REGION"
echo "Public IP   : $PUBLIC_IP"
echo "Live URL    : http://$PUBLIC_IP"
echo ""
echo "Note: The cloud-init script is installing Node.js and dependencies in the background."
echo "The web app will become accessible at http://$PUBLIC_IP within 1-2 minutes."
echo "=========================================================="
