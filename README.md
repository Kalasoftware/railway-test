# Telegram FTP Uploader Bot 🚀  

A Node.js-based **Telegram bot** that allows users to upload files **directly from URLs to an FTP server** using `rclone`. Supports **multiple uploads, progress tracking, and file management**.

---

## 📌 Features  
✅ **Upload from URL to FTP** using `rclone copyurl`  
✅ **Supports multiple URLs using `|` separator**  
✅ **Real-time progress updates** (`⬆️ Uploading 50%... ✅ Done!`)  
✅ **Shows file size and upload speed**  
✅ **List uploaded files** (`/list`)  
✅ **Check active uploads** (`/status`)  

---

## 🚀 Installation & Deployment  

### 1️⃣ **Clone the Repository**  
```bash
git clone https://github.com/Kalasoftware/railway-test.git
cd railway-test
```

## setup env variables 
-BOT_TOKEN=your-telegram-bot-token
-FTP_HOST=your-ftp-server
-FTP_USER=your-ftp-username
-FTP_PASS=your-obscured-password

## the password ued is encrypted so use 
```sh
rclone obscure "your-password"
# install rwailay form linux or wsl or macos terminal
npm i -g @railway/cli
railway init
railway up
```
## Usage

/upload https://example.com/file1.mp4

/list (will list the files)

/status : provides the current status 

### once you start upload , its show realtime progress also ... 

👤 Author
🔹 Sumeet Patel aka Arch Linux Enthusiast
🔹 GitHub: Sumeet Patel
🔹 Telegram: @your-telegram-handle


---

## **📌 What's Included?**
- **Full setup instructions** (local & Railway deployment)  
- **How to use the bot** (commands with examples)  
- **Credits to you** (`Sumeet Patel aka Arch Linux Enthusiast`)  
- **License & Contribution details**  

---

## **🚀 Next Steps**
1. **Create `README.md`** in your GitHub repo  
2. **Copy & paste this content**  
3. **Commit & push** to your repo  
4. **Star your own repo & share!** ⭐  

---

🚀 **Let me know if you want any modifications!** 😃


