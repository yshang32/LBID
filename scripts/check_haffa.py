import requests
import re

headers = {'User-Agent': 'ForwardFlowLeadResearch/0.1 (+manual-review; no-email-send)'}
r = requests.get('https://www.haffa.com.hk', headers=headers, timeout=15)
print('HAFFA main status:', r.status_code)
print('Content length:', len(r.text))

links = re.findall(r'href=["\'](.*?)["\']', r.text)
member_links = [l for l in links if any(kw in l.lower() for kw in ['member', 'director', 'list', 'company'])]
print('Member-related links found:')
for l in member_links[:20]:
    print(' -', l)
