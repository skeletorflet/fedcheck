# -*- coding: utf-8 -*-
"""Login HTTP con TLS de Chrome (curl_cffi) usando sessions/cf.json -> sessions/<user>.json"""
import json, sys, os
from curl_cffi import requests

BASE = 'https://online.fedpat.com.ar'
cfseed = json.load(open('sessions/cf.json', encoding='utf-8'))
UA = cfseed['ua']
cf = cfseed['cookies']
user, password = (sys.argv[1], sys.argv[2]) if len(sys.argv) > 2 else ('29494', 'Ringuito10')

s = requests.Session(impersonate='chrome')
s.headers.update({
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
    'Upgrade-Insecure-Requests': '1',
})
for k, v in cf.items():
    s.cookies.set(k, v, domain='online.fedpat.com.ar', path='/')

r = s.get(BASE + '/self/homeWin32.do', allow_redirects=True)
print('GET', r.status_code, len(r.text), 'form', 'id="loginForm"' in r.text, 'chall', 'Just a moment' in r.text or 'Enable JavaScript' in r.text)
if r.status_code != 200 or 'id="loginForm"' not in r.text:
    sys.exit(2)

r2 = s.post(BASE + '/self/login.do',
            data={'usuario': user, 'password': password, 'captcha': '', 'turnstileToken': '', 'Aceptar': 'Ingresar'},
            headers={'Referer': BASE + '/self/homeWin32.do', 'Origin': BASE},
            allow_redirects=False)
print('POST', r2.status_code, 'len', len(r2.text), 'loc', r2.headers.get('location'),
      'chall', 'Just a moment' in r2.text or 'Enable JavaScript' in r2.text, 'form', 'id="loginForm"' in r2.text)
if r2.status_code not in (301, 302, 303):
    print(r2.text[:400])
    sys.exit(3)

loc = r2.headers['location']
r3 = s.get(BASE + loc if loc.startswith('/') else loc, allow_redirects=True)
logged = 'logout.do' in r3.text
prod = None
if 'Prod.: ' in r3.text:
    prod = r3.text.split('Prod.: ')[1][:6].strip()
print('destino', r3.status_code, len(r3.text), 'logged', logged, 'prod', prod)
if not logged:
    sys.exit(4)

cookies = {}
for c in s.cookies.jar:
    if 'fedpat' in c.domain:
        cookies[c.name] = c.value
out = {'user': user, 'ua': UA, 'savedAt': __import__('datetime').datetime.now().isoformat(), 'cookies': cookies}
os.makedirs('sessions', exist_ok=True)
json.dump(out, open(f'sessions/{user}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('✅ sesión guardada en sessions/%s.json (%d cookies)' % (user, len(cookies)))
print('   ', ', '.join(cookies.keys()))
