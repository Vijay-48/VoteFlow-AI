"""
Campaign Runner - WhatsApp Message Sender
==========================================
Wraps the campaign execution logic with WebSocket broadcasting for real-time updates.
Manages Chrome/Selenium sessions as a "sandbox" for WhatsApp Web.
Uses Gemini AI to process and personalize user's base message.
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import pandas as pd
import time
import urllib.parse
import json
import os
import asyncio
from datetime import datetime
from typing import Callable, Optional, List, Dict, Any

# Gemini for AI message processing
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

# Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class CampaignRunner:
    """
    Manages WhatsApp campaign execution with real-time status updates.
    Acts as a "sandbox" for the WhatsApp Web session.
    Uses Gemini AI to process and enhance user messages.
    """
    
    def __init__(
        self,
        campaign_id: str,
        user_id: str = None,  # Clerk user ID for per-user profiles
        message_template: Optional[str] = None,
        broadcast_callback: Optional[Callable] = None,
        use_ai: bool = True,
        quota_remaining: int = 0  # Message quota limit
    ):
        self.campaign_id = campaign_id
        self.user_id = user_id
        self.base_message = message_template or self._default_message()
        self.broadcast = broadcast_callback or (lambda x: None)
        self.driver = None
        self.is_running = False
        self.is_paused = False
        self.should_stop = False
        self.use_ai = use_ai
        self.quota_remaining = quota_remaining
        self.messages_sent_this_session = 0
        
        # Statistics
        self.stats = {
            "total": 0,
            "sent": 0,
            "failed": 0,
            "skipped": 0,
            "progress": 0
        }
        
        # Initialize Gemini for AI message processing
        self.gemini_model = None
        if GEMINI_AVAILABLE and self.use_ai:
            try:
                genai.configure(api_key=GEMINI_API_KEY)
                self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
            except Exception as e:
                print(f"[WARN] Gemini init failed: {e}")
    
    def _default_message(self) -> str:
        """Default campaign message template."""
        return """నమస్కారం!

మీ ఓటు మా బలం. మీ విలువైన ఓటుతో మమ్మల్ని గెలిపించండి.

ధన్యవాదాలు 🙏"""
    
    async def _process_message_with_ai(self, base_message: str, voter_name: str = None) -> str:
        """
        Use Gemini AI to process and enhance the base message.
        Creates variations to avoid spam detection while keeping the core message.
        """
        if not self.gemini_model:
            return base_message
        
        try:
            prompt = f"""You are a campaign message assistant. Take this base election campaign message and create a slightly varied version.

BASE MESSAGE:
{base_message}

INSTRUCTIONS:
1. Keep the EXACT same meaning and intent
2. Keep it in the SAME language (Telugu/Hindi/English - whatever the original is)
3. Make SMALL variations like:
   - Slightly different greeting
   - Minor word order changes
   - Add or remove an emoji
4. Keep it SHORT and RESPECTFUL
5. Do NOT add any new content or promises
6. Return ONLY the message, no explanations

{f"Voter Name: {voter_name}" if voter_name else ""}

OUTPUT (just the message):"""

            response = self.gemini_model.generate_content(prompt)
            processed_message = response.text.strip()
            
            # Fallback to base if AI response is too different or empty
            if not processed_message or len(processed_message) > len(base_message) * 2:
                return base_message
            
            return processed_message
            
        except Exception as e:
            await self._log(f"⚠️ AI processing failed, using base message: {str(e)[:30]}", "warning")
            return base_message
    
    async def _log(self, message: str, log_type: str = "info"):
        """Send log message to connected clients."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = {
            "type": "log",
            "log_type": log_type,
            "timestamp": timestamp,
            "message": message,
            "stats": self.stats
        }
        await self.broadcast(log_entry)
        print(f"[{timestamp}] [{log_type.upper()}] {message}")
    
    async def _update_stats(self):
        """Broadcast current statistics."""
        self.stats["progress"] = (self.stats["sent"] + self.stats["failed"]) / max(self.stats["total"], 1) * 100
        await self.broadcast({
            "type": "stats",
            "stats": self.stats
        })
    
    def _init_browser(self):
        """Initialize Chrome browser for WhatsApp Web (the sandbox)."""
        chrome_options = Options()
        
        # Docker/Server configuration
        is_headless = os.getenv("CHROME_HEADLESS", "false").lower() == "true"
        
        if is_headless:
            print("[INFO] 🖥️ Running Chrome in HEADLESS mode (Server/Docker)")
            
            # Required safe flags for running Chrome inside Docker
            chrome_options.add_argument("--headless=new")  # Modern headless mode
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--disable-extensions")
            chrome_options.add_argument("--disable-software-rasterizer")
            chrome_options.add_argument("--disable-logging")
            chrome_options.add_argument("--remote-debugging-port=9222")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--disable-notifications")
            chrome_options.add_argument("--disable-popup-blocking")
            
            # Anti-headless detection flags
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_argument("--disable-infobars")
            chrome_options.add_argument("--enable-features=NetworkService,NetworkServiceInProcess")
            chrome_options.add_argument("--disable-features=VizDisplayCompositor")
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option("useAutomationExtension", False)
            
            # Spoof User-Agent to bypass WhatsApp browser detection
            chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            
            # Use Chromium binary from Docker (set via ENV in Dockerfile)
            chrome_bin = os.getenv("CHROME_BIN", "/usr/bin/chromium")
            if os.path.exists(chrome_bin):
                chrome_options.binary_location = chrome_bin
                print(f"[INFO] Using Chrome binary: {chrome_bin}")
            
            # Per-user profile directory for WhatsApp session isolation
            base_profile_dir = os.getenv("CHROME_PROFILES_BASE", "/data/chrome-profiles")
            if self.user_id:
                user_data_dir = os.path.join(base_profile_dir, self.user_id)
                os.makedirs(user_data_dir, exist_ok=True)
            else:
                user_data_dir = os.path.join(base_profile_dir, "default")
            chrome_options.add_argument(f"--user-data-dir={user_data_dir}")
            print(f"[INFO] Using Chrome profile: {user_data_dir}")
        else:
            print("[INFO] 🖥️ Running Chrome in GUI mode (Local)")
            chrome_options.add_argument("--start-maximized")
            chrome_options.add_argument("--disable-notifications")
            chrome_options.add_argument("--disable-popup-blocking")
            chrome_options.add_experimental_option("detach", True)
            
            # Local user data dir
            user_data_dir = os.path.join(os.path.expanduser("~"), ".voteflow_whatsapp")
            chrome_options.add_argument(f"--user-data-dir={user_data_dir}")

        try:
            # Use ChromeDriver from Docker if available
            chromedriver_path = os.getenv("CHROMEDRIVER_PATH", None)
            if chromedriver_path and os.path.exists(chromedriver_path):
                print(f"[INFO] Using ChromeDriver: {chromedriver_path}")
                service = Service(executable_path=chromedriver_path)
                self.driver = webdriver.Chrome(service=service, options=chrome_options)
            else:
                self.driver = webdriver.Chrome(options=chrome_options)
            print("[INFO] ✅ Chrome started successfully!")
        except Exception as e:
            print(f"[ERROR] Failed to start Chrome: {e}")
            print("Ensure Chrome is installed and CHROME_HEADLESS is set correctly.")
            raise e
            
        return self.driver
    
    async def _wait_for_whatsapp_ready(self):
        """Wait for WhatsApp Web to be ready (QR scanned or session restored)."""
        await self._log("Opening WhatsApp Web sandbox...", "system")
        self.driver.get("https://web.whatsapp.com")
        
        await self._log("Waiting for WhatsApp to connect (scan QR if needed)...", "system")
        await self.broadcast({"type": "qr_waiting", "message": "Please scan QR code if prompted"})
        
        # Save QR screenshot for remote viewing
        try:
            await asyncio.sleep(10)  # Wait for QR to render (increased from 5s)
            qr_path = os.path.join(os.path.dirname(__file__), "uploads", "qr_code.png")
            self.driver.save_screenshot(qr_path)
            await self._log("📸 QR code screenshot saved. Check /api/whatsapp/qr", "info")
            await self.broadcast({"type": "qr_ready", "message": "QR code available at /api/whatsapp/qr"})
            
            # Take additional screenshots as QR may update
            for i in range(3):
                await asyncio.sleep(5)
                self.driver.save_screenshot(qr_path)
                await self.broadcast({"type": "qr_updated", "message": "QR refreshed"})
        except Exception as e:
            await self._log(f"⚠️ Could not save QR screenshot: {e}", "warning")
        
        # Wait for WhatsApp to be ready (multiple selectors for compatibility)
        try:
            # Try multiple selectors - WhatsApp UI changes frequently
            login_selectors = [
                '//div[@contenteditable="true"][@data-tab="3"]',  # Old search box
                '//div[@id="side"]',  # Side panel (chat list container)
                '//div[contains(@class,"two")]//div[contains(@class,"copyable-text")]',  # Chat input
                '//span[@data-icon="menu"]',  # Menu icon (visible when logged in)
                '//div[@data-testid="chat-list"]',  # Chat list
            ]
            
            logged_in = False
            for selector in login_selectors:
                try:
                    WebDriverWait(self.driver, 30).until(
                        EC.presence_of_element_located((By.XPATH, selector))
                    )
                    await self._log(f"✅ WhatsApp Web connected! (detected via: {selector[:30]}...)", "success")
                    await self.broadcast({"type": "whatsapp_ready", "message": "WhatsApp connected"})
                    logged_in = True
                    break
                except:
                    continue
            
            if not logged_in:
                # Final attempt - just check page title
                await asyncio.sleep(5)
                if "WhatsApp" in self.driver.title:
                    await self._log("✅ WhatsApp Web appears to be connected!", "success")
                    await self.broadcast({"type": "whatsapp_ready", "message": "WhatsApp connected"})
                    return True
                raise Exception("Could not detect WhatsApp login state")
            
            return True
        except Exception as e:
            await self._log(f"❌ WhatsApp connection failed: {e}", "error")
            return False
    
    async def _send_message(self, phone: str, message: str) -> bool:
        """Send a single WhatsApp message."""
        try:
            # Format phone number
            clean_phone = ''.join(filter(str.isdigit, phone))
            if len(clean_phone) == 10:
                clean_phone = "91" + clean_phone
            
            # Navigate to chat
            encoded_msg = urllib.parse.quote(message)
            url = f"https://web.whatsapp.com/send?phone={clean_phone}&text={encoded_msg}"
            self.driver.get(url)
            
            # Wait for message input to be ready
            await asyncio.sleep(3)
            
            # Find and click send button
            send_button = WebDriverWait(self.driver, 15).until(
                EC.element_to_be_clickable((By.XPATH, '//span[@data-icon="send"]'))
            )
            send_button.click()
            
            # Wait for message to be sent
            await asyncio.sleep(2)
            
            return True
            
        except Exception as e:
            await self._log(f"❌ Failed to send to {phone}: {str(e)[:50]}", "error")
            return False
    
    def stop(self):
        """Stop the campaign."""
        self.should_stop = True
        self.is_running = False
    
    def pause(self):
        """Pause the campaign."""
        self.is_paused = True
    
    def resume(self):
        """Resume the campaign."""
        self.is_paused = False
    
    def get_status(self) -> Dict[str, Any]:
        """Get current campaign status."""
        return {
            "campaign_id": self.campaign_id,
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "stats": self.stats
        }
    
    async def execute_campaign(
        self,
        excel_file: Optional[str] = None,
        voters_data: Optional[List[Dict]] = None
    ):
        """
        Execute the campaign - main entry point.
        
        Flow:
        1. Load voter data
        2. Process base message with AI
        3. Connect to WhatsApp
        4. Send personalized messages to each voter
        
        Args:
            excel_file: Path to Excel file with voters
            voters_data: Direct list of voter records
        """
        self.is_running = True
        self.should_stop = False
        
        try:
            await self._log("🚀 Initializing VoteFlow Campaign Engine...", "system")
            
            # Load voter data
            if excel_file:
                await self._log(f"📂 Loading voters from: {excel_file}", "info")
                df = pd.read_excel(excel_file)
                voters = df.to_dict('records')
            elif voters_data:
                voters = voters_data
            else:
                await self._log("❌ No voter data provided!", "error")
                return
            
            # Filter voters with valid mobile numbers
            valid_voters = [
                v for v in voters 
                if v.get("MOBILE") and str(v["MOBILE"]) not in ["N/A", "UNCLEAR", "nan", ""]
            ]
            
            self.stats["total"] = len(valid_voters)
            await self._log(f"📊 Found {len(valid_voters)} voters with valid mobile numbers", "info")
            await self._update_stats()
            
            if not valid_voters:
                await self._log("⚠️ No voters with valid mobile numbers found!", "warning")
                return
            
            # Process base message with AI
            if self.gemini_model and self.use_ai:
                await self._log("🤖 AI Engine: Processing your message template...", "system")
                await self._log(f"📝 Base message received: {self.base_message[:50]}...", "info")
            else:
                await self._log("📝 Using message as-is (AI processing disabled)", "info")
            
            # Initialize browser sandbox
            await self._log("🌐 Starting WhatsApp sandbox...", "system")
            self._init_browser()
            
            # Wait for WhatsApp to be ready
            if not await self._wait_for_whatsapp_ready():
                await self._log("❌ Failed to connect to WhatsApp. Aborting.", "error")
                return
            
            await asyncio.sleep(2)
            
            # Send messages
            await self._log("📤 Starting message broadcast...", "system")
            
            for i, voter in enumerate(valid_voters, 1):
                if self.should_stop:
                    await self._log("⏹️ Campaign stopped by user", "warning")
                    break
                
                while self.is_paused:
                    await asyncio.sleep(1)
                
                phone = str(voter["MOBILE"])
                name = voter.get("NAME", "Voter")
                
                # AI processes each message with slight variations
                if self.gemini_model and self.use_ai:
                    message = await self._process_message_with_ai(self.base_message, name)
                    await self._log(f"🤖 AI generated message for {name}", "info")
                else:
                    message = self.base_message
                
                await self._log(f"📤 [{i}/{len(valid_voters)}] Sending to {name} ({phone})...", "info")
                
                # Send message
                success = await self._send_message(phone, message)
                
                if success:
                    self.stats["sent"] += 1
                    await self._log(f"✅ Sent to {phone}", "success")
                else:
                    self.stats["failed"] += 1
                
                await self._update_stats()
                
                # Delay between messages
                if i < len(valid_voters):
                    await asyncio.sleep(4)
            
            # Campaign complete
            await self._log(f"🏁 Campaign complete! Sent: {self.stats['sent']}, Failed: {self.stats['failed']}", "success")
            await self.broadcast({"type": "complete", "stats": self.stats})
            
        except Exception as e:
            await self._log(f"💥 Campaign error: {str(e)}", "error")
            await self.broadcast({"type": "error", "message": str(e)})
        
        finally:
            self.is_running = False
            if self.driver:
                await self._log("🌐 WhatsApp sandbox will remain open for next campaign", "system")


# For standalone testing
if __name__ == "__main__":
    async def test_broadcast(msg):
        print(f"[BROADCAST] {json.dumps(msg, indent=2)}")
    
    runner = CampaignRunner(
        campaign_id="test-001",
        message_template="Test campaign message",
        broadcast_callback=test_broadcast,
        use_ai=True
    )
    
    # Test with sample data
    test_voters = [
        {"NAME": "Test User 1", "MOBILE": "9876543210"},
        {"NAME": "Test User 2", "MOBILE": "8765432109"},
    ]
    
    asyncio.run(runner.execute_campaign(voters_data=test_voters))
