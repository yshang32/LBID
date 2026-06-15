import requests
import re

headers = {'User-Agent': 'ForwardFlowLeadResearch/0.1 (+manual-review; no-email-send)'}

# Check HAFFA Profile page
r = requests.get('https://www.haffa.com.hk/en-HK/Membership/Profile.aspx', headers=headers, timeout=15)
print('Profile page status:', r.status_code)
print('Content length:', len(r.text))

# Look for company patterns in the page
companies = re.findall(r'(?:Ltd|Limited|Co\.|Corp|Company|International|Logistics|Freight|Express|Cargo|Shipping)[^<]{0,60}', r.text)
print('\nCompany-like matches (first 10):')
for c in companies[:10]:
    print(' -', c[:100])

# Also check main HAFFA page for company list
print('\n--- Checking main HAFFA page for company data ---')
r2 = requests.get('https://www.haffa.com.hk', headers=headers, timeout=20)
# Look for table rows or list items that could be company entries
rows = re.findall(r'<tr[^>]*>.*?</tr>', r2.text, re.DOTALL | re.IGNORECASE)
print(f'Table rows found: {len(rows)}')
if rows:
    # Sample some rows that contain company-like text
    company_rows = [r for r in rows if any(kw in r for kw in ['Ltd', 'Limited', 'Co.', 'Freight', 'Logistics'])]
    print(f'Company-like rows: {len(company_rows)}')
    for row in company_rows[:3]:
        clean = re.sub(r'<[^>]+>', ' ', row).strip()
        print(' -', clean[:150])
