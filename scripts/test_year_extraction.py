"""Test year extraction on real HK logistics company websites."""
import re, time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

HEADERS = {"User-Agent": "ForwardFlowLeadResearch/0.1 (test)"}
FOUNDED_PATTERNS = [
    r"(?:since|established|founded|incorporated|est\.?)\s*[:\s]*(\d{4})",
    r"(\d{4})\s*年(?:成立|創立|創辦)",
    r"(?:成立於|創立於|創辦於)\s*(\d{4})",
    r"(?:成立|創立|創辦)\s*於?\s*(\d{4})",
    r"(\d{4})\s*(?:年)?.*?(?:成立|established|founded)",
    # Copyright footer patterns often have founding year
    r"©\s*(?:\d{4}[-–]\s*)?(\d{4})\s+.*?(?:ltd|limited|co\.|corp)",
    r"(?:operating|serving|providing|in business|in operation)\s+(?:for\s+)?(?:over\s+)?(\d{2,3})\s+years?",
]

def fetch(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=12, allow_redirects=True)
        r.raise_for_status()
        return r.text
    except Exception as e:
        return None

def extract_year(html, current_year=2026):
    if not html:
        return None
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style"]):
        tag.decompose()
    text = soup.get_text(" ", strip=True)

    for p in FOUNDED_PATTERNS:
        for m in re.finditer(p, text, re.IGNORECASE):
            try:
                raw = int(m.group(1))
                # Handle "operating for X years" pattern
                if p.endswith(r"years?"):
                    year = current_year - raw
                else:
                    year = raw
                if 1900 < year <= current_year:
                    return year
            except (ValueError, IndexError):
                continue
    return None

test_cases = [
    ("AIRWAY EXPRESS (HONG KONG) LIMITED", "http://www.airway.com.hk"),
    ("AVION SHIPPING CO LTD", "http://www.avionhkg.com.hk"),
    ("EASTERN WORLDWIDE CO., LTD.", "http://www.eww.com.hk"),
    ("INTERTRANS INT'L TRANSPORT (HK)", "http://www.intertrans.com.hk"),
    ("MULTI-GOLD AIR & SEA EXPRESS LTD.", "http://www.mgairsea.com.hk"),
    ("SEIYO GLOBAL LOGISTICS (ASIA) LTD", "http://www.seiyo.com.hk"),
    ("SHARP INTERNATIONAL CARGO SERVICES LTD.", "http://www.sisharp.com"),
    ("TRANS-AM AIR FREIGHT (HK) LTD.", "http://www.trans-am.com.hk"),
    ("WANGFOONG TRANSPORTATION LTD.", "http://www.wangfoong.com.hk"),
    ("OCEAN CROWN SHIPPING LIMITED", "http://www.oceancrown.com.hk"),
]

for name, site in test_cases:
    print(f"\n{name}")
    year = None
    for url in [site, urljoin(site, "/about"), urljoin(site, "/about-us"), urljoin(site, "/company")]:
        html = fetch(url)
        if html:
            year = extract_year(html)
            if year:
                print(f"  FOUND year={year}  from {url}")
                break
            else:
                print(f"  {url} → no year")
        else:
            print(f"  {url} → fetch failed")
        time.sleep(1)
    if not year:
        print(f"  *** year not found ***")
    time.sleep(1)
