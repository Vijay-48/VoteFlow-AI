
# Use official Python runtime as a parent image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV DISPLAY=:99

# Install system dependencies (Chrome + Tools + VNC)
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Chromium, ChromeDriver, and required OS libraries for headless mode
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    chromium-driver \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libxss1 \
    libasound2 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    fonts-liberation \
    ca-certificates \
    dbus \
    # VNC packages for QR scanning
    xvfb \
    x11vnc \
    novnc \
    websockify \
    supervisor \
    && rm -rf /var/lib/apt/lists/* \
    && chromium --version \
    && chromedriver --version

# Create directories
RUN mkdir -p /data/chrome-profiles && chmod 777 /data/chrome-profiles
RUN mkdir -p /var/log/supervisor

# Set Chrome options environment variables
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver
ENV CHROME_PROFILES_BASE=/data/chrome-profiles

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project code
COPY . .

# Create uploads and data directories
RUN mkdir -p uploads data

# Create entrypoint script for VNC services
RUN echo '#!/bin/bash\n\
    # Start Xvfb (virtual display)\n\
    Xvfb :99 -screen 0 1920x1080x24 &\n\
    sleep 2\n\
    \n\
    # Start x11vnc\n\
    x11vnc -display :99 -forever -shared -nopw -rfbport 5900 &\n\
    sleep 1\n\
    \n\
    # Start noVNC websockify\n\
    websockify --web=/usr/share/novnc 6080 localhost:5900 &\n\
    \n\
    # Start the main application\n\
    exec uvicorn main:app --host 0.0.0.0 --port 8000\n\
    ' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Expose ports (API + noVNC)
EXPOSE 8000 6080

# Use entrypoint script
CMD ["/app/entrypoint.sh"]
