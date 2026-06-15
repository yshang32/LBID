"""Quick validation: scrape 5 companies to test founded_year extraction."""
import re, time, urllib.robotparser
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "ForwardFlowLeadResearch/0.1 (test; contact: yshang32@gmail.com)"}
FOUNDED_PATTERNS = [
    r"(?:since|established|founded|incorporated|est\.?)\s*[:\s]*(\d{4})",
    r"(\d{4})\s*年(?:成立|創立|創辦)",
    r"(?:成立於|創立於|創辦於)\s*(\d{4})",
    r"(?:成立|創立|創辦)\s*於\s*(\d{4})",
]

def fetch(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=12, allow_redirects=True)
        r.raise_for_status()
        return r.text
    except Exception as e:
        return None

def extract_year(html):
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style"]):
        tag.decompose()
    text = soup.get_text(" ", strip=True)
    for p in FOUNDED_PATTERNS:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            y = int(m.group(1))
            if 1900 < y <= 2026:
                return y
    return None

samples = [
    ("CARGO SERVICES FAR EAST LIMITED", "https://www.cargofe.com"),
    ("KUEHNE & NAGEL LIMITED", "https://www.kuehne-nagel.com"),
    ("DHL GLOBAL FORWARDING (HONG KONG) LIMITED", "https://www.dhl.com"),
    ("OCEAN CROWN SHIPPING LIMITED", "https://www.oceancrown.com.hk"),
    ("WANGFOONG TRANSPORTATION LTD.", "https://www.wangfoong.com.hk"),
]

for name, site in samples:
    print(f"\n{name}")
    html = fetch(site)
    if html:
        year = extract_year(html)
        print(f"  Homepage year: {year}")
        if not year:
            # Try about page
            about = fetch(urljoin(site, "/about"))
            if about:
                year = extract_year(about)
                print(f"  /about year:   {year}")
    else:
        print("  FETCH FAILED")
    time.sleep(2)
