"""
PDF Extractor with Gemini Vision AI
====================================
Extracts voter information from PDFs including handwritten mobile numbers.
Uses OCR capabilities of Gemini Vision to read handwritten text.
"""

import fitz  # PyMuPDF
import google.generativeai as genai
from PIL import Image
import io
import json
import asyncio
import os
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Gemini API Configuration (try both variable names)
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

class PDFExtractor:
    def __init__(self):
        if not GEMINI_API_KEY:
            raise ValueError("Missing GOOGLE_API_KEY or GEMINI_API_KEY in .env file")
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def _pdf_page_to_image(self, page, dpi: int = 200) -> Image.Image:
        """Convert a PyMuPDF page to PIL Image"""
        zoom = dpi / 72
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_data))
        return img
    
    def _extract_page_with_gemini(self, img: Image.Image, page_num: int) -> List[Dict]:
        """
        Use Gemini Vision to extract voter details including HANDWRITTEN mobile numbers.
        """
        prompt = """Analyze this voter list page and extract ALL voter entries.

For each voter entry, extract:
1. NAME - The voter's name (printed text after "Name:")
2. FATHER_HUSBAND - Father's name or Husband's name (printed text)
3. EPIC_NO - The EPIC/Voter ID number (printed, starts with letters like WLU)
4. MOBILE - **IMPORTANT**: Look for HANDWRITTEN mobile numbers written by hand near each voter entry. 
   These are usually 10-digit Indian phone numbers (starting with 6, 7, 8, or 9).
   They may be written in margins, next to names, or in dedicated columns.

Return the data as a JSON array:
[
  {"NAME": "Voter Name", "FATHER_HUSBAND": "Father Name", "EPIC_NO": "WLU1234567", "MOBILE": "9876543210"},
  {"NAME": "Another Voter", "FATHER_HUSBAND": "Father Name", "EPIC_NO": "WLU7654321", "MOBILE": "8765432109"}
]

IMPORTANT OCR INSTRUCTIONS:
- Pay special attention to HANDWRITTEN text - these are the mobile numbers
- Handwriting may be messy, try your best to decode digits
- If mobile number is unclear, use your best guess or "UNCLEAR"
- If no mobile number is visible for a voter, use "N/A"
- Extract ALL voters visible on the page
- Return ONLY valid JSON, no other text
"""
        
        try:
            # Convert PIL Image to bytes
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='PNG')
            img_bytes = img_bytes.getvalue()
            
            response = self.model.generate_content([
                prompt,
                {"mime_type": "image/png", "data": img_bytes}
            ])
            
            # Parse JSON from response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
            response_text = response_text.strip()
            
            voters = json.loads(response_text)
            
            # Validate and clean mobile numbers
            for voter in voters:
                mobile = voter.get("MOBILE", "N/A")
                if mobile and mobile != "N/A" and mobile != "UNCLEAR":
                    # Clean the mobile number (remove spaces, dashes)
                    clean_mobile = ''.join(filter(str.isdigit, str(mobile)))
                    if len(clean_mobile) == 10 and clean_mobile[0] in '6789':
                        voter["MOBILE"] = clean_mobile
                    elif len(clean_mobile) == 12 and clean_mobile.startswith('91'):
                        voter["MOBILE"] = clean_mobile[2:]  # Remove country code
                    else:
                        voter["MOBILE"] = mobile  # Keep original if validation fails
            
            return voters
            
        except json.JSONDecodeError as e:
            print(f"[WARN] Page {page_num}: JSON parse error - {e}")
            return []
        except Exception as e:
            print(f"[ERROR] Page {page_num}: {e}")
            return []
    
    async def extract_voters(self, pdf_path: str) -> Dict[str, Any]:
        """
        Extract all voters from a PDF file.
        Returns dict with voters list and metadata.
        """
        print(f"[INFO] Opening PDF: {pdf_path}")
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        print(f"[INFO] Total pages: {total_pages}")
        
        all_voters = []
        extraction_log = []
        
        for i, page in enumerate(doc, start=1):
            print(f"[INFO] Processing page {i}/{total_pages}...")
            extraction_log.append(f"Processing page {i}/{total_pages}")
            
            # Convert PDF page to image
            img = self._pdf_page_to_image(page, dpi=200)
            
            # Extract voters using Gemini
            voters = self._extract_page_with_gemini(img, i)
            
            # Add page number to each record
            for v in voters:
                v["PAGE"] = i
                all_voters.append(v)
            
            extraction_log.append(f"  -> Extracted {len(voters)} voters from page {i}")
            print(f"  -> Extracted {len(voters)} voters from page {i}")
            
            # Small delay to respect API rate limits
            if i < total_pages:
                await asyncio.sleep(1)
        
        doc.close()
        
        # Count voters with valid mobile numbers
        with_mobile = len([v for v in all_voters if v.get("MOBILE") and v["MOBILE"] not in ["N/A", "UNCLEAR"]])
        
        return {
            "voters": all_voters,
            "total_count": len(all_voters),
            "with_mobile": with_mobile,
            "pages_processed": total_pages,
            "log": extraction_log
        }


# For standalone testing
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python pdf_extractor.py <pdf_path>")
        sys.exit(1)
    
    extractor = PDFExtractor()
    result = asyncio.run(extractor.extract_voters(sys.argv[1]))
    
    print(f"\n[DONE] Extracted {result['total_count']} voters ({result['with_mobile']} with mobile numbers)")
    print("\n[SAMPLE] First 5 records:")
    for v in result['voters'][:5]:
        print(f"  {v['NAME']} | {v.get('MOBILE', 'N/A')} | {v['EPIC_NO']}")
