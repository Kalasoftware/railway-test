#!/bin/bash
echo "Installing rclone..."
curl -O https://downloads.rclone.org/rclone-current-linux-amd64.zip
unzip rclone-current-linux-amd64.zip
cd rclone-*-linux-amd64
cp rclone /usr/bin/
chmod +x /usr/bin/rclone
echo "Rclone Installed Successfully!"
