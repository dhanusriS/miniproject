# Manual AWS Deployment Guide

This guide provides step-by-step instructions for manually deploying your application to an AWS EC2 instance.

## Phase 1: Local Terminal (Preparation)

Run these commands on your local machine to prepare the deployment package.

```bash
# 1. Navigate to the project root
cd /home/dhanusri/Downloads/dhanusri_mini_project

# 2. Build the Frontend
cd frontend
npm install
npm run build
cd ..

# 3. Create a Deployment Archive
# We exclude node_modules and logs to keep the file small
zip -r deployment.zip \
    backend \
    ml \
    frontend/dist \
    package.json \
    .env \
    -x "backend/node_modules/*" \
    -x "backend/server.log" \
    -x "backend/batch_*.json"

# 4. Upload to AWS EC2
# Replace <EC2_PUBLIC_IP> with your instance's IP address
# Replace twitter.pem with the path to your key file
scp -i twitter.pem deployment.zip ubuntu@<EC2_PUBLIC_IP>:~/
```

---

## Phase 2: AWS Terminal (EC2 Setup)

SSH into your EC2 instance (`ssh -i twitter.pem ubuntu@<EC2_PUBLIC_IP>`) and run these commands.

### 1. System Updates & Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y unzip python3-pip

# Install Node.js (Version 18)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally to keep the app running
sudo npm install -g pm2
```

### 2. Extract & Install App Dependencies
```bash
# Unzip the deployment package
unzip deployment.zip -d app
cd app/backend

# Install backend dependencies
npm install

# Install ML dependencies
pip3 install nltk
```

### 3. Run the Application
```bash
# Start the backend server using PM2
pm2 start server.js --name "twitter-app"

# Save PM2 process list to restart on reboot
pm2 save
sudo pm2 startup
```

---

## Phase 3: AWS Console (Security Group)

To access your app, you must open the correct port in the AWS Console:

1. Go to **EC2 Dashboard** → **Instances** → Select your instance.
2. Click the **Security** tab → Click on the **Security Groups** link.
3. Click **Edit inbound rules**.
4. Add a new rule:
   - **Type**: Custom TCP
   - **Port Range**: `5000`
   - **Source**: `0.0.0.0/0` (or your IP for better security)
5. Save rules.

Your app should now be live at: `http://<EC2_PUBLIC_IP>:5000`

---

## Troubleshooting

- **Check logs**: `pm2 logs twitter-app`
- **Restart app**: `pm2 restart twitter-app`
- **Verify Python**: If ML fails, run `python3 -c "import nltk; nltk.download('vader_lexicon')"` manually.
