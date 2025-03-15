#!/bin/bash

echo "Installing required dependencies..."
apt-get update && apt-get install -y unzip

echo "Downloading rclone..."
curl -O https://downloads.rclone.org/rclone-current-linux-amd64.zip

echo "Extracting rclone..."
unzip rclone-current-linux-amd64.zip
cd rclone-*-linux-amd64

echo "Moving rclone to /usr/bin/..."
cp rclone /usr/bin/
chmod +x /usr/bin/rclone

echo "Rclone Installed Successfully!"
