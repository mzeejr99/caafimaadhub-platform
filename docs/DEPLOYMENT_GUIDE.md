# CaafimaadHub — Production Deployment & DevOps Guide

This guide describes how to deploy CaafimaadHub in production environments (Linux Ubuntu 22.04 LTS / Debian 12 / Docker / XAMPP).

---

## 1. System Requirements

- **Operating System**: Ubuntu 22.04 LTS / Debian 12 or Windows Server
- **Node.js**: v18.x, v20.x, or v22.x LTS
- **Database Engine**:
  - **Option A (Production)**: MySQL 8.0 or MariaDB 10.6+
  - **Option B (Zero-Config / Local / Standalone)**: Built-in SQLite 3
- **Web Server / Reverse Proxy**: Nginx 1.20+ with SSL (Let's Encrypt / Certbot)
- **Process Manager**: PM2

---

## 2. Installation Steps

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/organization/caafimaadhub.git
cd caafimaadhub

# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build
```

### Step 2: Database Configuration (MySQL Mode)
```bash
# Log in to MySQL CLI
mysql -u root -p

# Create database and user
CREATE DATABASE caafimaadhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'caafimaad_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON caafimaadhub.* TO 'caafimaad_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema and seed initial administrative data
mysql -u caafimaad_user -p caafimaadhub < database/schema.sql
mysql -u caafimaad_user -p caafimaadhub < database/seeds.sql
```

### Step 3: Environment Variables Configuration
In `backend/.env`:
```env
PORT=5000
NODE_ENV=production

# Database Configuration
DB_CLIENT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=caafimaad_user
DB_PASSWORD=StrongPassword123!
DB_NAME=caafimaadhub

# JWT Secrets (Generate strong random 64-char strings)
JWT_SECRET=e74c8b21c4309a63d914e6be0b14643b9ef7a3b34255767b489d81dcf351cb18
JWT_REFRESH_SECRET=a81b3796f7c9e0d15e47c1b504e2843efc609825b4ec2b083b4e6d7a4816c805
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# SMS Gateway Configuration
SMS_PROVIDER=MOCK
SMS_SENDER_ID=CaafimaadHub
```

---

## 3. Production Process Management with PM2

```bash
npm install -g pm2

# Start Backend Cluster
cd backend
pm2 start src/server.js --name "caafimaadhub-backend" -i max
pm2 save
pm2 startup
```

---

## 4. Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/caafimaadhub.conf`:
```nginx
server {
    listen 80;
    server_name caafimaadhub.so www.caafimaadhub.so;

    # Static Frontend Build
    location / {
        root /var/www/caafimaadhub/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Backend REST API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads Storage
    location /uploads/ {
        alias /var/www/caafimaadhub/backend/uploads/;
        expires 7d;
    }
}
```

Enable site and acquire SSL:
```bash
ln -s /etc/nginx/sites-available/caafimaadhub.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Install Let's Encrypt SSL
certbot --nginx -d caafimaadhub.so -d www.caafimaadhub.so
```
