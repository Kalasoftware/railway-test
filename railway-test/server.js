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

// Track active downloads
const activeDownloads = new Map();

// Function to Write Rclone Config
function writeRcloneConfig(callback) {
    const configContent = `[myftp]
type = ftp
host = ${process.env.FTP_HOST}
user = ${process.env.FTP_USER}
pass = ${process.env.FTP_PASS}
`;

    exec(`echo '${configContent}' > /app/rclone.conf`, (error) => {
        if (error) {
            console.error("❌ Failed to write Rclone config:", error);
            return callback(error);
        }
        callback(null);
    });
}

// Handle "/start" command
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "Send a URL to upload to FTP. Use `|` to separate multiple links or specify a filename.\n\n**Examples:**\n`/upload link1 | filename.mp4`\n`/upload link2`\n\nDelete Files: `/delete filename.ext`\nStop Download: `/stop filename.ext`",
        { parse_mode: "Markdown" }
    );
});

// Function to Copy File from URL to FTP
function uploadToFTP(url, filename, chatId) {
    bot.sendMessage(chatId, `🚀 Uploading: ${filename} from URL: ${url} to FTP...`);

    const destination = `${FTP_REMOTE}/${filename}`;

    writeRcloneConfig((error) => {
        if (error) {
            return bot.sendMessage(chatId, "❌ Failed to write Rclone config.");
        }

        // Start Rclone upload
        const rcloneCommand = `rclone --config /app/rclone.conf copyurl "${url}" "${destination}" --stats=10s`;

        const process = exec(rcloneCommand);

        // Store process ID for stopping
        activeDownloads.set(filename, process);

        process.on("close", (code) => {
            activeDownloads.delete(filename); // Remove from active downloads
            if (code === 0) {
                bot.sendMessage(chatId, `✅ Upload complete: ${filename}`);
            } else {
                bot.sendMessage(chatId, `❌ Upload failed for ${filename} with code ${code}`);
            }
        });
    });
}

// Handle "/upload" Command for Multiple Files Using Pipe (`|`)
bot.onText(/\/upload (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const inputEntries = match[1].trim().split("|").map(entry => entry.trim());

    if (inputEntries.length === 0) {
        return bot.sendMessage(chatId, "❌ Please provide at least one URL.");
    }

    inputEntries.forEach(entry => {
        const parts = entry.split(" ");
        const url = parts[0];
        const filename = parts[1] ? parts[1] : path.basename(new URL(url).pathname);

        if (url.startsWith("http")) {
            uploadToFTP(url, filename, chatId);
        } else {
            bot.sendMessage(chatId, `⚠️ Skipping invalid URL: ${url}`);
        }
    });
});

// Handle "/delete" Command to Remove File from FTP
bot.onText(/\/delete (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const filename = match[1].trim();
    const filePath = `${FTP_REMOTE}/${filename}`;

    writeRcloneConfig((error) => {
        if (error) {
            return bot.sendMessage(chatId, "❌ Failed to write Rclone config.");
        }

        exec(`rclone --config /app/rclone.conf delete "${filePath}"`, (error, stdout, stderr) => {
            if (error) {
                bot.sendMessage(chatId, `❌ Error deleting file:\n${stderr}`);
            } else {
                bot.sendMessage(chatId, `🗑️ Deleted file: ${filename}`);
            }
        });
    });
});

// Handle "/stop" Command to Stop Ongoing Download
bot.onText(/\/stop (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const filename = match[1].trim();

    if (activeDownloads.has(filename)) {
        const process = activeDownloads.get(filename);
        process.kill("SIGTERM");
        activeDownloads.delete(filename);
        bot.sendMessage(chatId, `⛔ Download stopped for: ${filename}`);
    } else {
        bot.sendMessage(chatId, `⚠️ No active download found for: ${filename}`);
    }
});

// Command to List Uploaded Files
bot.onText(/\/list/, (msg) => {
    const chatId = msg.chat.id;

    writeRcloneConfig((error) => {
        if (error) {
            return bot.sendMessage(chatId, "❌ Failed to write Rclone config.");
        }

        exec(`rclone --config /app/rclone.conf ls "${FTP_REMOTE}"`, (error, stdout, stderr) => {
            if (error) {
                bot.sendMessage(chatId, `❌ Error listing files:\n${stderr}`);
            } else {
                bot.sendMessage(chatId, stdout || "No files found.");
            }
        });
    });
});

// Status Command to Check Active Rclone Processes
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;

    exec("ps aux | grep rclone", (error, stdout) => {
        bot.sendMessage(chatId, stdout || "No active uploads.");
    });
});

// Express Route to Check if Server is Running
app.get("/", (req, res) => {
    res.send("Node.js Telegram FTP Uploader is Running!");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
