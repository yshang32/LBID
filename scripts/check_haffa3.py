import requests
import re

headers = {'User-Agent': 'ForwardFlowLeadResearch/0.1 (+manual-review; no-email-send)'}

r = requests.get('https://www.haffa.com.hk/en-HK/Membership/Profile.aspx', headers=headers, timeout=20)
text = r.text

# Print first 3000 chars of visible text
no_script = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
no_style = re.sub(r'<style[^>]*>.*?</style>', '', no_script, flags=re.DOTALL | re.IGNORECASE)
clean = re.sub(r'<[^>]+>', ' ', no_style)
clean = re.sub(r'\s+', ' ', clean).strip()
print('=== Visible text (first 4000 chars) ===')
print(clean[:4000])

# Also look for member list patterns
print('\n=== Company name patterns in HTML ===')
# Look for patterns with Ltd/Limited
company_patterns = re.findall(r'[A-Z][A-Z\s&\(\),-]{5,60}(?:LTD|LIMITED|CO\.|CORP\.|INC\.)', text, re.IGNORECASE)
print(f'Company-like strings: {len(company_patterns)}')
for c in company_patterns[:20]:
    print(' -', c.strip()[:100])
