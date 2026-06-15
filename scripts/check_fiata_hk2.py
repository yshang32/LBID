"""Check what website URLs are actually in the FIATA HK entries."""
import requests
import re

headers = {'User-Agent': 'ForwardFlowLeadResearch/0.1'}
r = requests.get('https://fiata.org/directory/hk/', headers=headers, timeout=20)
text = r.text

li_blocks = re.findall(r'<li[\s\S]*?</li>', text, re.IGNORECASE)

def decode_entities(s):
    return s.replace('&#39;', "'").replace('&amp;', '&').replace('&#160;', ' ').replace('&nbsp;', ' ')

def decode_cf_email(encoded):
    if not re.match(r'^[a-f0-9]+$', encoded, re.IGNORECASE) or len(encoded) < 4:
        return ''
    key = int(encoded[:2], 16)
    result = ''
    for i in range(2, len(encoded), 2):
        result += chr(int(encoded[i:i+2], 16) ^ key)
    return result.lower()

count_with_site = 0
count_without_site = 0

for block in li_blocks:
    h3 = re.search(r'<h3[^>]*>([\s\S]*?)</h3>', block, re.IGNORECASE)
    if not h3:
        continue
    name_raw = re.sub(r'<[^>]+>', '', h3.group(1)).strip()
    name = decode_entities(re.sub(r'\s+', ' ', name_raw))
    if not name or re.match(r'(?:responsible|postal|members in|about fiata|what we do|bank transfer)', name, re.IGNORECASE):
        continue

    text_clean = re.sub(r'<[^>]+>', ' ', block)
    text_clean = decode_entities(re.sub(r'\s+', ' ', text_clean))

    website_match = re.search(r'website\s+((?:https?://|www\.)[^\s"\'<>]+)', text_clean, re.IGNORECASE)
    website = website_match.group(1).rstrip('.,;)') if website_match else ''

    cf_emails = re.findall(r'data-cfemail=["\']([\w]+)["\']', block, re.IGNORECASE)
    emails = [decode_cf_email(e) for e in cf_emails if decode_cf_email(e)]
    plain = re.findall(r'[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}', block, re.IGNORECASE)
    all_emails = emails + [e.lower() for e in plain if 'fiata.org' not in e.lower()]

    if website:
        count_with_site += 1
    else:
        count_without_site += 1

    print(f'  {name[:50]:<50}  site={website[:40] if website else "NONE":<40}  email={all_emails[0][:35] if all_emails else "NONE"}')

print(f'\nWith website: {count_with_site}')
print(f'Without website: {count_without_site}')
