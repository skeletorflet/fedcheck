# -*- coding: utf-8 -*-
"""Login 100% HTTP con TLS de Chrome (curl_cffi) reutilizando cf_clearance."""
import json, sys
from curl_cffi import requests

BASE = 'https://online.fedpat.com.ar'
seed = json.load(open('_exploracion/http_session_all.json', encoding='utf-8'))
UA = seed['ua']
cf = {c['name']: c['value'] for c in seed['cookies'] if c['name'] in ('cf_clearance', '__cflb', 'nx_cookie', '__cf_ob')}
user, password = (sys.argv[1], sys.argv[2]) if len(sys.argv) > 2 else ('7224', 'Cuervo13')

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
print('cookies:', list(s.cookies.keys()))

r2 = s.post(BASE + '/self/login.do',
            data={'usuario': user, 'password': password, 'captcha': '', 'turnstileToken': '', 'Aceptar': 'Ingresar'},
            headers={'Referer': BASE + '/self/homeWin32.do', 'Origin': BASE},
            allow_redirects=False)
print('POST', r2.status_code, 'len', len(r2.text), 'loc', r2.headers.get('location'), 'chall', 'Just a moment' in r2.text or 'Enable JavaScript' in r2.text, 'form', 'id="loginForm"' in r2.text)

if r2.status_code in (301, 302, 303):
    loc = r2.headers['location']
    r3 = s.get(BASE + loc if loc.startswith('/') else loc, allow_redirects=True)
    logged = 'logout.do' in r3.text
    print('destino', r3.status_code, len(r3.text), 'logged', logged, 'prod', (r3.text.split('Prod.: ')[1][:10] if 'Prod.: ' in r3.text else '-'))
    if logged:
        print('✅ LOGIN HTTP PURO OK')
        data = {'user': user, 'ua': UA, 'cookies': [{'name': c.name, 'value': c.value, 'domain': c.domain, 'path': c.path} for c in s.cookies.jar]}
        json.dump(data, open(f'_exploracion/http_session_{user}_curl.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
else:
    txt = r2.text
    i = txt.find('loginForm')
    print(txt[i:i+800] if i >= 0 else txt[:300])
