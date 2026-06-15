import requests
import re

headers = {'User-Agent': 'ForwardFlowLeadResearch/0.1 (+manual-review; no-email-send)'}

r = requests.get('https://fiata.org/directory/hk/', headers=headers, timeout=20)
text = r.text

# Extract all H3 company names
h3_blocks = re.findall(r'<h3[^>]*>(.*?)</h3>', text, re.IGNORECASE | re.DOTALL)
companies = [re.sub(r'<[^>]+>', '', b).strip() for b in h3_blocks]
companies = [c for c in companies if c and not re.match(r'(?:responsible|postal|members in|email)', c, re.IGNORECASE)]
print(f'Total companies found: {len(companies)}')
print('\nAll company names:')
for i, c in enumerate(companies, 1):
    print(f'{i:3}. {c}')

# Check for emails
print(f'\n--- Email check ---')
# Decode CloudFlare email protection
def decode_cf_email(encoded):
    if not re.match(r'^[a-f0-9]+$', encoded, re.IGNORECASE) or len(encoded) < 4:
        return ''
    key = int(encoded[:2], 16)
    email = ''
    for i in range(2, len(encoded), 2):
        email += chr(int(encoded[i:i+2], 16) ^ key)
    return email.lower()

cf_emails = re.findall(r'data-cfemail=["\']([a-f0-9]+)["\']', text, re.IGNORECASE)
plain_emails = re.findall(r'[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}', text, re.IGNORECASE)

decoded = [decode_cf_email(e) for e in cf_emails]
all_emails = list(set(decoded + [e.lower() for e in plain_emails if 'fiata.org' not in e.lower()]))
print(f'Emails found (CF decoded + plain): {len(all_emails)}')
for e in all_emails[:10]:
    print(' -', e)

# Check pagination
print('\n--- Pagination check ---')
page_links = re.findall(r'href=["\']([^"\']*(?:page|p=|offset)[^"\']*)["\']', text, re.IGNORECASE)
print(f'Pagination links: {len(page_links)}')
for l in page_links[:5]:
    print(' -', l)
