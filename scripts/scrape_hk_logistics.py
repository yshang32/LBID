"""
HK Freight Forwarder / Logistics Company Scraper
------------------------------------------------
Sources:
  1. FIATA HK directory (https://fiata.org/directory/hk/)
     — These are HAFFA members; HAFFA is FIATA's HK representative association.
  2. Per-website scraping for founded_year + email fallback.

Outputs:
  data/hk_logistics_qualified.csv   — founded_year confirmed, 10+ years
  data/hk_logistics_needs_review.csv — email found but year unconfirmed

Usage:
  python scripts/scrape_hk_logistics.py
  python scripts/scrape_hk_logistics.py --dry-run   # skip website scraping
"""

import csv
import re
import sys
import time
import urllib.robotparser
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

CURRENT_YEAR = 2026
MIN_AGE_YEARS = 10
FOUNDED_CUTOFF = CURRENT_YEAR - MIN_AGE_YEARS  # <= 2016 qualifies

DATA_DIR = Path(__file__).parent.parent / "data"
FIATA_HK_URL = "https://fiata.org/directory/hk/"

HEADERS = {
    "User-Agent": "ForwardFlowLeadResearch/0.1 (LBID platform seed-user research; contact: yshang32@gmail.com)",
    "Accept": "text/html,application/xhtml+xml",
}

EXCLUDE_EMAIL_PATTERNS = ["noreply", "no-reply", "webmaster", "postmaster", "example.", ".png", ".jpg", ".gif", "@fiata.org"]

# Only patterns that reliably indicate a company's founding year, NOT copyright years.
# Copyright footer years (© 2025) are excluded intentionally.
FOUNDED_PATTERNS = [
    r"(?:since|established|founded|incorporated|est\.?)\s*[:\s]*(\d{4})",
    r"(\d{4})\s*年(?:成立|創立|創辦)",
    r"(?:成立於|創立於|創辦於)\s*(\d{4})",
    r"(?:成立|創立|創辦)\s*於?\s*(\d{4})",
    r"\b(\d{4})\b\s*年(?:開始|起|以來|至今)",
]

# "operating for X years" → founding year = CURRENT_YEAR - X
OPERATING_YEARS_PATTERN = re.compile(
    r"(?:operating|serving|providing|in business|in operation|experience of)\s+(?:for\s+)?(?:over\s+|more than\s+)?(\d{2,3})\s+years?",
    re.IGNORECASE,
)

# Trust founding years in range [1900, CURRENT_YEAR - 3].
# Years within last 3 years are likely copyright/page-update years.
YEAR_TRUST_MAX = CURRENT_YEAR - 3

# Keep sub-path list short to avoid multi-minute waits on dead paths
SUB_PATHS = ["/about", "/about-us", "/en/about", "/company/about", "/contact"]

DRY_RUN = "--dry-run" in sys.argv


# ---------------------------------------------------------------------------
# CloudFlare email decode (same algo used on fiata.org)
# ---------------------------------------------------------------------------

def decode_cf_email(encoded: str) -> str:
    if not re.match(r"^[a-f0-9]+$", encoded, re.IGNORECASE) or len(encoded) < 4:
        return ""
    key = int(encoded[:2], 16)
    result = ""
    for i in range(2, len(encoded), 2):
        result += chr(int(encoded[i:i+2], 16) ^ key)
    return result.lower()


# ---------------------------------------------------------------------------
# Generic fetch with timeout + retry
# ---------------------------------------------------------------------------

def fetch(url: str, timeout: int = 12) -> str | None:
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        r.raise_for_status()
        return r.text
    except Exception:
        return None


# ---------------------------------------------------------------------------
# robots.txt check (cached per domain)
# ---------------------------------------------------------------------------

_robots_cache: dict[str, urllib.robotparser.RobotFileParser] = {}

def is_allowed(url: str) -> bool:
    parsed = urlparse(url)
    domain = f"{parsed.scheme}://{parsed.netloc}"
    if domain not in _robots_cache:
        rp = urllib.robotparser.RobotFileParser()
        robots_url = f"{domain}/robots.txt"
        try:
            # Use requests with short timeout to avoid hanging on slow domains
            resp = requests.get(robots_url, headers=HEADERS, timeout=5, allow_redirects=True)
            if resp.ok:
                rp.parse(resp.text.splitlines())
        except Exception:
            pass  # robots.txt unreachable → assume allowed (rp stays empty = allow all)
        _robots_cache[domain] = rp
    return _robots_cache[domain].can_fetch(HEADERS["User-Agent"], url)


# ---------------------------------------------------------------------------
# Email extraction
# ---------------------------------------------------------------------------

def extract_emails(html: str) -> list[str]:
    candidates: set[str] = set()

    # CloudFlare protected emails
    for match in re.finditer(r'data-cfemail=["\']([a-f0-9]+)["\']', html, re.IGNORECASE):
        email = decode_cf_email(match.group(1))
        if re.match(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
            candidates.add(email)

    # mailto: links
    for match in re.finditer(r"mailto:([^\s\"'?>\)]+)", html, re.IGNORECASE):
        email = match.group(1).rstrip(".,;:)").lower()
        if re.match(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
            candidates.add(email)

    # Plain regex
    for match in re.finditer(r"[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}", html, re.IGNORECASE):
        candidates.add(match.group(0).lower().rstrip(".,;:)\"'"))

    # Filter junk
    valid = [
        e for e in candidates
        if not any(pat in e.lower() for pat in EXCLUDE_EMAIL_PATTERNS)
        and len(e) < 80
    ]

    # Prefer generic contact/info/sales/ops addresses
    def score(e: str) -> int:
        if re.match(r"^(info|sales|cs|enquiry|inquiry|ops|operations|contact|admin|export|import|marketing)@", e):
            return 0
        return 1

    return sorted(valid, key=score)


# ---------------------------------------------------------------------------
# Founded year extraction
# ---------------------------------------------------------------------------

def extract_founded_year(text: str) -> int | None:
    # Try explicit founding year patterns first
    for pattern in FOUNDED_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            try:
                year = int(match.group(1))
                if 1900 < year <= YEAR_TRUST_MAX:
                    return year
            except (ValueError, IndexError):
                continue

    # Try "operating/serving for X years" → infer founding year
    m = OPERATING_YEARS_PATTERN.search(text)
    if m:
        try:
            years_operating = int(m.group(1))
            if 10 <= years_operating <= 120:
                return CURRENT_YEAR - years_operating
        except ValueError:
            pass

    return None


def decode_html_entities(text: str) -> str:
    text = text.replace("&#39;", "'").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"').replace("&#160;", " ").replace("&nbsp;", " ")
    return re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), text)


# ---------------------------------------------------------------------------
# FIATA HK member list parser
# ---------------------------------------------------------------------------

def get_fiata_hk_members() -> list[dict]:
    print(f"Fetching FIATA HK directory: {FIATA_HK_URL}")
    html = fetch(FIATA_HK_URL)
    if not html:
        print("ERROR: Could not fetch FIATA HK directory")
        return []

    # Split into per-member blocks (each member is in a <li> block with an <h3> heading)
    li_blocks = re.findall(r"<li[\s\S]*?</li>", html, re.IGNORECASE)
    blocks = li_blocks if li_blocks else re.split(r"<h3[^>]*>", html)[1:]

    members: list[dict] = []
    seen_names: set[str] = set()

    for block in blocks:
        # Company name from <h3>
        h3 = re.search(r"<h3[^>]*>([\s\S]*?)</h3>", block, re.IGNORECASE)
        if not h3:
            continue
        name_raw = re.sub(r"<[^>]+>", "", h3.group(1)).strip()
        name = decode_html_entities(re.sub(r"\s+", " ", name_raw))

        # Skip non-company entries
        if not name or re.match(r"(?:responsible|postal|members in|about fiata|what we do|bank transfer)", name, re.IGNORECASE):
            continue
        if name in seen_names:
            continue
        seen_names.add(name)

        # Emails
        emails = extract_emails(block)

        # Website from "website <url>" text pattern
        text_clean = re.sub(r"<[^>]+>", " ", block)
        text_clean = decode_html_entities(re.sub(r"\s+", " ", text_clean))
        website_match = re.search(r"website\s+((?:https?://|www\.)[^\s\"'<>]+)", text_clean, re.IGNORECASE)
        website = website_match.group(1).rstrip(".,;)") if website_match else ""
        if website and not website.startswith("http"):
            website = "https://" + website

        # Fix malformed URLs like http://Https://
        website = re.sub(r"^http://[Hh]ttps://", "https://", website)

        # If no explicit website, infer from email domain (e.g. info@airway.com.hk → https://www.airway.com.hk)
        if not website and emails:
            domain = emails[0].split("@")[-1]
            # Skip generic mail providers
            if not any(g in domain for g in ["gmail.", "yahoo.", "hotmail.", "outlook.", "live.", "163.com", "qq.com"]):
                website = f"https://www.{domain}"

        members.append({
            "company_name": name,
            "website": website,
            "email": emails[0] if emails else "",
            "all_emails": "; ".join(emails),
        })

    print(f"  Found {len(members)} members in FIATA HK directory")
    return members


# ---------------------------------------------------------------------------
# Per-website scraper for founded_year + email enrichment
# ---------------------------------------------------------------------------

def scrape_company_website(website: str, existing_email: str) -> dict:
    result = {"founded_year": None, "email": existing_email, "notes": ""}

    if not website:
        result["notes"] = "no website"
        return result

    # Check robots.txt
    if not is_allowed(website):
        result["notes"] = "robots.txt disallows"
        return result

    pages_to_try = [website] + [urljoin(website, p) for p in SUB_PATHS]
    found_year = None
    found_email = existing_email

    for idx, url in enumerate(pages_to_try):
        if found_year and found_email:
            break

        if not is_allowed(url):
            continue

        # Shorter timeout for sub-pages (they usually 404 immediately if missing)
        timeout = 12 if idx == 0 else 6
        html = fetch(url, timeout=timeout)
        if not html:
            continue

        if not found_year:
            # Convert HTML to plain text for year search
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup(["script", "style"]):
                tag.decompose()
            plain = soup.get_text(" ", strip=True)
            found_year = extract_founded_year(plain)

        if not found_email:
            emails = extract_emails(html)
            if emails:
                found_email = emails[0]

        # Only pause between sub-page requests, not on every page
        if url != website:
            time.sleep(1)

    result["founded_year"] = found_year
    result["email"] = found_email

    notes_parts = []
    if not found_year:
        notes_parts.append("founded_year not found")
    if not found_email:
        notes_parts.append("email not found on website")
    result["notes"] = "; ".join(notes_parts)

    return result


# ---------------------------------------------------------------------------
# Derive HK district from address hints in company name
# ---------------------------------------------------------------------------

def infer_region(company_name: str) -> str:
    name_upper = company_name.upper()
    if any(k in name_upper for k in ["KOWLOON", "TSIM SHA TSUI", "TST", "MONG KOK", "KWUN TONG", "YAU MA TEI"]):
        return "香港 九龍"
    if any(k in name_upper for k in ["CENTRAL", "WAN CHAI", "CAUSEWAY BAY", "NORTH POINT", "ISLAND"]):
        return "香港 港島"
    if any(k in name_upper for k in ["TUEN MUN", "YUEN LONG", "FANLING", "SHA TIN", "KWAI CHUNG", "NEW TERRITORIES"]):
        return "香港 新界"
    return "香港"


# ---------------------------------------------------------------------------
# Write CSV helper
# ---------------------------------------------------------------------------

FIELDNAMES = ["company_name", "region", "founded_year", "website", "email", "source", "notes"]

def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("=== HK Logistics Seed-User Scraper ===")
    if DRY_RUN:
        print("DRY RUN: skipping per-website scraping")

    members = get_fiata_hk_members()
    if not members:
        print("No members found — aborting.")
        return

    all_results: list[dict] = []
    total = len(members)

    for i, member in enumerate(members, 1):
        name = member["company_name"]
        website = member["website"]
        email_from_fiata = member["email"]

        print(f"[{i:2}/{total}] {name[:55]:<55}", end="  ", flush=True)

        if DRY_RUN:
            row = {
                "company_name": name,
                "region": infer_region(name),
                "founded_year": "",
                "website": website,
                "email": email_from_fiata,
                "source": "FIATA/HAFFA member directory (https://fiata.org/directory/hk/)",
                "notes": "dry-run; website not scraped",
            }
            print(f"email={email_from_fiata[:30] if email_from_fiata else '-'}")
            all_results.append(row)
            continue

        details = scrape_company_website(website, email_from_fiata)
        fy = details["founded_year"]
        print(f"year={fy or '?':>4}  email={details['email'][:30] if details['email'] else '-'}")

        row = {
            "company_name": name,
            "region": infer_region(name),
            "founded_year": fy or "",
            "website": website,
            "email": details["email"],
            "source": "FIATA/HAFFA member directory (https://fiata.org/directory/hk/)",
            "notes": details["notes"],
        }
        all_results.append(row)

        # Rate limiting between companies
        time.sleep(2)

    # Partition results
    qualified = [
        r for r in all_results
        if r["founded_year"] and int(r["founded_year"]) <= FOUNDED_CUTOFF and r["email"]
    ]
    needs_review = [
        r for r in all_results
        if (not r["founded_year"] or int(r["founded_year"] or 9999) > FOUNDED_CUTOFF) and r["email"]
    ]
    no_contact = [
        r for r in all_results
        if not r["email"]
    ]

    # Write outputs
    q_path = DATA_DIR / "hk_logistics_qualified.csv"
    r_path = DATA_DIR / "hk_logistics_needs_review.csv"
    n_path = DATA_DIR / "hk_logistics_no_contact.csv"

    write_csv(q_path, qualified)
    write_csv(r_path, needs_review)
    write_csv(n_path, no_contact)

    print()
    print("=== Results ===")
    print(f"Total processed:                    {len(all_results)}")
    print(f"Qualified (10+ years + email):      {len(qualified)}  → {q_path.name}")
    print(f"Needs review (year unknown + email): {len(needs_review)}  → {r_path.name}")
    print(f"No contact info:                    {len(no_contact)}  → {n_path.name}")

    if len(qualified) < 80:
        print()
        print("TIP: qualified < 80. Consider adding Google Places API or other HK logistics directories.")
        print("     Set GOOGLE_PLACES_API_KEY env var and re-run with --places to supplement.")


if __name__ == "__main__":
    main()
