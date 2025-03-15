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
        "Send a URL to upload to FTP. Use `|` to separate multiple links.\nExample:\n`/upload link1 | link2 | link3`",
        { parse_mode: "Markdown" }
    );
});

// Function to Copy File from URL to FTP and Send 50% Progress Update
function uploadToFTP(url, chatId) {
    bot.sendMessage(chatId, `🚀 Uploading from URL: ${url} to FTP...`);

    const filename = path.basename(new URL(url).pathname);
    const destination = `${FTP_REMOTE}/${filename}`;

    writeRcloneConfig((error) => {
        if (error) {
            return bot.sendMessage(chatId, "❌ Failed to write Rclone config.");
        }

        // Get the file size before downloading
        exec(`rclone size "${url}"`, (err, stdout) => {
            let fileSizeMB = null;
            if (!err) {
                const match = stdout.match(/Total size:\s+([\d.]+)M/);
                if (match) {
                    fileSizeMB = parseFloat(match[1]);
                }
            }

            const rcloneCommand = `rclone --config /app/rclone.conf copyurl "${url}" "${destination}" --progress`;

            const process = exec(rcloneCommand);

            let halfUploaded = false;

            process.stdout.on("data", (data) => {
                if (fileSizeMB) {
                    const match = data.match(/Transferred:\s+([\d.]+)M/);
                    if (match) {
                        const uploadedMB = parseFloat(match[1]);
                        if (uploadedMB >= fileSizeMB / 2 && !halfUploaded) {
                            bot.sendMessage(chatId, `📡 50% uploaded: ${filename}`);
                            halfUploaded = true;
                        }
                    }
                }
            });

            process.on("close", (code) => {
                if (code === 0) {
                    bot.sendMessage(chatId, `✅ Upload complete: ${filename}`);
                } else {
                    bot.sendMessage(chatId, `❌ Upload failed with code ${code}`);
                }
            });
        });
    });
}

// Handle "/upload" Command for Multiple Files Using Pipe (`|`)
bot.onText(/\/upload (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const urls = match[1].trim().split("|").map(url => url.trim()); // Split by `|` and remove spaces

    if (urls.length === 0) {
        return bot.sendMessage(chatId, "❌ Please provide at least one URL.");
    }

    urls.forEach((url) => {
        if (url.startsWith("http")) {
            uploadToFTP(url, chatId);
        } else {
            bot.sendMessage(chatId, `⚠️ Skipping invalid URL: ${url}`);
        }
    });
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
