# 🐳 Vectyra — Docker & VM Deployment Guide

This guide explains how to deploy **Vectyra** on a Virtual Machine (VM) running Docker and Docker Engine so it is accessible from anywhere in your local network or via your VM's IP address.

---

## 🏗️ Architecture Overview

- **Single Container for Frontend & Backend**: The Node.js Express server (`server.js`) hosts both the REST API endpoints (`/api/*`) and serves the frontend Single Page Application (SPA) static files (`index.html`, `js/`, `styles/`).
- **PostgreSQL Database Container**: Automatically provisions the database, mounts persistent storage (`pgdata` volume), and runs `schema.sql` on first launch to seed default tables and accounts.
- **Universal Network Accessibility**: Express binds to `HOST=0.0.0.0`, and Docker Compose maps to `${BIND_IP:-0.0.0.0}:${APP_PORT:-3000}:3000`, allowing any device on your LAN or subnet to access the portal at `http://<YOUR_VM_IP>:3000`.

---

## 🚀 Quick Start (Docker Compose)

### 1. Clone / Copy the project to your VM
```bash
cd /opt/vectyra-portal  # or your desired directory on the VM
```

### 2. Configure Environment (Optional)
Copy the Docker environment template:
```bash
cp .env.docker.example .env
```
Key variables in `.env`:
| Variable | Default | Description |
| :--- | :--- | :--- |
| `BIND_IP` | `0.0.0.0` | IP to bind on the VM host (`0.0.0.0` listens on all network interfaces) |
| `APP_PORT` | `3000` | Port to expose on the host VM (e.g., `3000`, `80`, `8080`) |
| `JWT_SECRET` | `vectyra_super_secret...` | Secret key for JWT authentication tokens |
| `DB_USER` | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_NAME` | `vectyra` | PostgreSQL database name |

### 3. Build & Run
```bash
docker compose up -d --build
```

### 4. Check Status & Logs
```bash
# Check container status
docker compose ps

# View application logs
docker compose logs -f app
```

---

## 🌐 Accessing from Any Device in the Network

1. Find your VM's IP address:
   - **Linux / Ubuntu VM**: `ip addr show` or `hostname -I`
   - **Windows VM**: `ipconfig`
2. Open your web browser on any computer or phone connected to the same network:
   ```
   http://<YOUR_VM_IP>:3000
   ```
   *(Example: `http://192.168.1.50:3000` or `http://10.0.0.12:3000`)*

3. Default Super Admin Login:
   - **Email**: `saurabhsharma@niralnetworks.in` (or `superadmin@company.com`)
   - **Password**: `superadmin` (or `demo123`)

---

## 🛡️ Firewall Configuration (If you can't access from other machines)

If your VM cannot be reached from other machines on the network, ensure the port is allowed in the VM firewall:

### Ubuntu / Debian (UFW):
```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

### CentOS / RHEL / AlmaLinux (Firewalld):
```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### Cloud VMs (AWS EC2 / Azure / GCP / Proxmox):
Add an **Inbound Security Rule** allowing TCP traffic on port `3000` (or `80` if changed) from your subnet or CIDR IP range.

---

## 📦 Running as a Standalone Single Container (Without Docker Compose)

If you already have an external PostgreSQL database or wish to run the app standalone:

```bash
# 1. Build the unified Docker image
docker build -t vectyra-portal .

# 2. Run the container accessible from anywhere on the VM network
docker run -d \
  --name vectyra-app \
  -p 0.0.0.0:3000:3000 \
  -e PORT=3000 \
  -e HOST=0.0.0.0 \
  -e DATABASE_URL=postgres://user:password@your-db-host:5432/vectyra \
  vectyra-portal
```

---

## 🛠️ Management Commands

```bash
# Stop containers
docker compose down

# Restart containers
docker compose restart

# Rebuild containers after code modifications
docker compose up -d --build

# Reset database & persistent data (Caution: Clears DB data)
docker compose down -v
docker compose up -d --build
```
