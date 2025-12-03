VPS DEPLOYMENT GUIDE:

Prerequisites on VPS:
1. Ubuntu 22.04 LTS
2. Node.js 20.x installed
3. PM2 installed globally
4. Nginx installed
5. Git installed
6. Domain pointed to VPS IP

Step-by-step deployment:

1. Clone repository:
```bash
cd /var/www
git clone https://github.com/yourusername/mapofus.git
cd mapofus
```

2. Install dependencies:
```bash
npm install
```

3. Create production .env file:
```bash
nano .env
# Paste all environment variables
# Save and exit (Ctrl+X, Y, Enter)
```

4. Build the application:
```bash
npm run build
```

5. Start with PM2:
```bash
pm2 start npm --name "mapofus" -- start
pm2 save
pm2 startup
# Follow the command it gives you
```

6. Configure Nginx:
```bash
sudo nano /etc/nginx/sites-available/mapofus
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name mapofus.com www.mapofus.com;

    # Increase upload size for images
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for image generation
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

7. Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/mapofus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

8. Install SSL certificate:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d mapofus.com -d www.mapofus.com
```

9. Set up automatic deployments (create deploy script):
```bash
nano /var/www/mapofus/deploy.sh
```

Paste:
```bash
#!/bin/bash
cd /var/www/mapofus
git pull origin main
npm install
npm run build
pm2 restart mapofus
echo "Deployment completed at $(date)"
```

Make executable:
```bash
chmod +x /var/www/mapofus/deploy.sh
```

Update from local:
```bash
# On your local machine
git add .
git commit -m "Update feature X"
git push origin main

# On VPS via SSH
ssh root@your-vps-ip
/var/www/mapofus/deploy.sh
```

MONITORING:
```bash
# View logs
pm2 logs mapofus

# Check status
pm2 status

# Monitor resources
pm2 monit
```

VERCEL DEPLOYMENT (Frontend only, optional):
If you want to deploy frontend to Vercel and keep API on VPS:

1. Create vercel.json:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "sveltekit",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.mapofus.com/api/:path*"
    }
  ]
}
```

2. Connect GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

FINAL CHECKLIST:
□ Domain DNS configured
□ SSL certificate active (HTTPS)
□ PM2 auto-restart on reboot enabled
□ Nginx serving correctly
□ Environment variables set
□ Supabase project configured
□ Google Imagen API enabled
□ Ruul.io webhook URL configured
□ Admin email set in environment
□ Test complete user flow
□ Monitor logs for errors