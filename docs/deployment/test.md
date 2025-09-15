# GlusterFS Setup and Auto-Mount Guide

This guide explains how to set up **GlusterFS** on multiple nodes, configure auto-mounting, and add resilience with a watchdog service.

---

## 10.3. GlusterFS Setup

### 10.3.1. Install GlusterFS on All Nodes

Install both the server and client components on every node:

```bash
sudo apt update
sudo apt install glusterfs-server -y
sudo systemctl start glusterd
sudo systemctl enable glusterd
sudo apt install glusterfs-client -y
```

**glusterfs-server** runs the Gluster daemon (`glusterd`) on each node.

**glusterfs-client** allows nodes to mount GlusterFS volumes like normal filesystems.

Services are started and enabled so they persist after reboots.

---

### 10.3.2. Backup Your Application Directory

Before re-mounting `/var/www/app`, back up its current contents:

```bash
sudo cp -r /var/www/app /tmp/app-backup
```

This ensures you don’t lose existing files when `/var/www/app` becomes a mount point.

---

### 10.3.3. Create a GlusterFS Volume

On the primary node, create the brick and volume:

```bash
sudo mkdir -p /gluster/brick1/app-volume
sudo gluster volume create app-volume <NODE_IP>:/gluster/brick1/app-volume force
sudo gluster volume start app-volume
```

- **Brick**: the actual storage directory managed by GlusterFS (`/gluster/brick1/app-volume`).
- **Volume**: the abstraction GlusterFS clients will mount (`app-volume`).

Replace `<NODE_IP>` with the IP of the current node.

---

### 10.3.4. Mount the Volume

Mount the shared volume over your app directory:

```bash
sudo mount -t glusterfs <NODE_IP>:/app-volume /var/www/app
```

Now `/var/www/app` points to the GlusterFS volume. Your earlier backup will be restored here.

---

### 10.3.5. Auto-Mount on Boot

To automatically re-mount on reboot, edit `/etc/fstab` and add:

```bash
<NODE_IP>:/app-volume /var/www/app glusterfs defaults,_netdev 0 0
```

Then apply the changes:

```bash
sudo systemctl daemon-reexec
```

The `_netdev` option ensures mounting happens after the network is online.

---

### 10.3.6. Systemd Service for Mounting

To make mounting more reliable, create a systemd service at `/etc/systemd/system/mount-glusterfs.service`:

```ini
[Unit]
Description=Mount GlusterFS Volume
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/bin/mount -a
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mount-glusterfs.service
sudo systemctl start mount-glusterfs.service
```

---

### 10.3.7. Restore Backup

Copy your app data back into the mounted volume:

```bash
sudo cp -r /tmp/app-backup/ /var/www/app/
```

Adjust ownership so Docker services can access it:

```bash
sudo chown -R USER_NAME:USER_NAME /var/www/app
sudo chown -R USER_NAME:docker /var/www/app/nginx/certbot
```

---

## 10.4. Onboarding a New Node

When you add another server to the GlusterFS cluster:

### 10.4.1. Prepare the Node

```bash
sudo mkdir -p /gluster/brick1
sudo chown -R <USER>:<USER> /gluster
```

### 10.4.2. Probe the New Node (from an existing node)

```bash
sudo gluster peer probe <NEW_NODE_IP>
```

### 10.4.3. Expand the Volume (if adding replicas)

```bash
sudo gluster volume create app-volume replica <REPLICA_COUNT> \
  <NODE1_IP>:/gluster/brick1 \
  <NODE2_IP>:/gluster/brick1 \
  ... \
  force
sudo gluster volume start app-volume
sudo gluster volume info
```

### 10.4.4. Mount the Volume on the New Node

```bash
sudo apt install glusterfs-client -y
sudo mount -t glusterfs <NEW_NODE_IP>:/app-volume /var/www/app
```

(Optionally add to `/etc/fstab` as before.)

---

## 10.5. GlusterFS Watchdog Service

This service ensures your app automatically recovers if the Gluster mount fails.

### 10.5.1. Create watchdog script

Create `/var/www/app/glusterfs_watchdog.sh`:

```bash
#!/bin/bash
GLUSTER_MOUNT="/var/www/app"
DB_SERVICE="app_db"

while true; do
	if ! mountpoint -q "$GLUSTER_MOUNT"; then
		echo "$(date) - GlusterFS not mounted! Waiting..." | tee -a /var/log/glusterfs_watchdog.log
		while ! mountpoint -q "$GLUSTER_MOUNT"; do
			sleep 5
		done
		echo "$(date) - GlusterFS restored. Restarting DB service..." | tee -a /var/log/glusterfs_watchdog.log
		docker service update --force $(docker stack ls --format "{{.Name}}")_${DB_SERVICE}
	fi
	sleep 10
done
```

### 10.5.2. Create a systemd service

Create `/etc/systemd/system/glusterfs-watchdog.service`:

```ini
[Unit]
Description=GlusterFS Watchdog
After=network.target docker.service
Requires=docker.service

[Service]
ExecStart=/var/www/app/glusterfs_watchdog.sh
Restart=always
RestartSec=5
StandardOutput=append:/var/log/glusterfs_watchdog.log
StandardError=append:/var/log/glusterfs_watchdog.log

[Install]
WantedBy=multi-user.target
```

### 10.5.3. Reload and enable

```bash
sudo systemctl daemon-reload
sudo systemctl enable glusterfs-watchdog
sudo systemctl start glusterfs-watchdog
```

---

## ✅ Final Checklist

- GlusterFS running across all nodes.
- App volume mounted automatically at boot.
- Backup restored into `/var/www/app`.
- Watchdog ensures recovery if Gluster goes down.

---

```

```
