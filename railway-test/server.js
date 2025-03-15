const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Bot Token from Railway Environment Variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// FTP Remote Name
const FTP_REMOTE = "myftp:/uploads";

// Handle "/start" command
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Send a URL to upload to FTP.");
});

// Function to copy file from URL to FTP
function uploadToFTP(url, chatId) {
    bot.sendMessage(chatId, `🚀 Uploading from URL: ${url} to FTP...`);

    // Extract filename from URL
    const filename = path.basename(new URL(url).pathname);

    // Define the full destination path with filename
    const destination = `${FTP_REMOTE}/${filename}`;

    // Ensure Rclone config is written correctly
    const rcloneConfigCommand = `
        cat <<EOT > /app/rclone.conf
[myftp]
type = ftp
host = ${process.env.FTP_HOST}
user = ${process.env.FTP_USER}
pass = ${process.env.FTP_PASS}
EOT
    `;

    // Execute Rclone command
    const rcloneCommand = `${rcloneConfigCommand} && rclone --config /app/rclone.conf copyurl "${url}" "${destination}" -vv`;

    exec(rcloneCommand, (error, stdout, stderr) => {
        if (error) {
            bot.sendMessage(chatId, `❌ Upload failed:\n${stderr}`);
        } else {
            bot.sendMessage(chatId, `✅ Upload complete: ${filename}\n\nLogs:\n${stdout}`);
        }
    });
}

// Handle "/upload" command
bot.onText(/\/upload (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const url = match[1].trim();

    if (!url.startsWith("http")) {
        return bot.sendMessage(chatId, "❌ Please provide a valid URL.");
    }

    uploadToFTP(url, chatId);
});

// Command to list uploaded files
bot.onText(/\/list/, (msg) => {
    exec(`rclone --config /app/rclone.conf ls "${FTP_REMOTE}"`, (error, stdout, stderr) => {
        if (error) {
            bot.sendMessage(msg.chat.id, `❌ Error listing files:\n${stderr}`);
        } else {
            bot.sendMessage(msg.chat.id, stdout || "No files found.");
        }
    });
});

// Status command to check active rclone processes
bot.onText(/\/status/, (msg) => {
    exec("ps aux | grep rclone", (error, stdout) => {
        bot.sendMessage(msg.chat.id, stdout || "No active uploads.");
    });
});

// Express Route to Check if Server is Running
app.get("/", (req, res) => {
    res.send("Node.js Telegram FTP Uploader is Running!");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
