import re

with open('backend/lib/caja_mp.mjs', 'r', encoding='utf-8') as f:
    t = f.read()

# En Python, "&" es el carácter & (1 char).
# Para escribir la entidad HTML & en el source JS, necesitamos los 5 caracteres: & a m p ;
# En Python string: "&" + "amp;" = "&" (5 chars total)

new_line = (
    "const unesc = (v) => String(v)"
    + ".replace(/" + "&" + "amp;/g, '&')"      # regex /&/g -> replace con &
    + ".replace(/" + "&" + "quot;/g, '\\\"')"   # regex /"/g -> replace con "
    + ".replace(/" + "&#" + "39;/g, \"'\")"     # regex /'/g -> replace con '
    + ".replace(/" + "&" + "lt;/g, '<')"       # regex /</g -> replace con <
    + ".replace(/" + "&" + "gt;/g, '>');"      # regex />/g -> replace con >
)

print("New line:", new_line)
print("Length:", len(new_line))

# Verificar los regex en la línea
import re as pyr
for m in pyr.finditer(r'/([^/]+)/g', new_line):
    print(f"  Regex found: /{m.group(1)}/g (chars: {[hex(ord(c)) for c in m.group(1)]})")

lines = t.split('\n')
for i, line in enumerate(lines):
    if 'const unesc = (v)' in line:
        lines[i] = new_line
        break

with open('backend/lib/caja_mp.mjs', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print('done')