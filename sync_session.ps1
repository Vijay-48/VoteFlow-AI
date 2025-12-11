# WhatsApp Session Sync Script

# 1. Check if Selenium is installed locally
Write-Host "Checking local dependencies..."
pip install selenium webdriver-manager pandas

# 2. Run the Campaign Runner LOCALLY to generate the session
Write-Host "------------------------------------------------"
Write-Host "STEP 1: OPENING WHATSAPP TO SCAN QR CODE"
Write-Host "The browser will open. Please SCAN the QR Code."
Write-Host "Close the browser window MANUALLY after you see your chats."
Write-Host "------------------------------------------------"
python backend/campaign_runner.py

# 3. Zip the session folder (Windows)
$SessionPath = "$env:USERPROFILE\.voteflow_whatsapp"
$ZipPath = "$env:USERPROFILE\whatsapp_session.zip"

if (Test-Path $SessionPath) {
    Write-Host "Zipping session from $SessionPath..."
    Compress-Archive -Path "$SessionPath\*" -DestinationPath $ZipPath -Force
} else {
    Write-Host "ERROR: Session folder not found! Did you run the script?"
    exit
}

# 4. SCP to Server
Write-Host "Uploading session to server (This might take a minute)..."
scp -i "C:\EC2Keys\voteflow-backend.pem" $ZipPath ubuntu@3.227.211.105:~/whatsapp_session.zip

# 5. Unzip on Server
Write-Host "Installing session on server..."
ssh -i "C:\EC2Keys\voteflow-backend.pem" ubuntu@3.227.211.105 "rm -rf .voteflow_whatsapp && mkdir .voteflow_whatsapp && unzip -o whatsapp_session.zip -d .voteflow_whatsapp && docker-compose restart"

Write-Host "------------------------------------------------"
Write-Host "✅ DONE! Server restarted with your WhatsApp Login."
Write-Host "------------------------------------------------"
