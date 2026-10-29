import re

with open('backend/lib/caja_mp.mjs', 'r', encoding='utf-8') as f:
    t = f.read()

# La línea actual tiene caracteres literales & " ' < > en los regex
# Necesitamos que los regex coincidan con las entidades HTML: & " ' < >
# En JS source, el regex /&/g significa "match literal & (5 chars)"
# Pero en el archivo se guarda como /&/g (literal &)
# El problema es que PowerShell/editor convierte & a & al escribir

# Vamos a reemplazar la línea completa
lines = t.split('\n')
for i, line in enumerate(lines):
    if 'const unesc = (v)' in line:
        # Escribir con las entidades HTML en el regex
        # En el source JS: /&/g = match literal & (5 caracteres: & a m p ;)
        # Necesitamos escribir & en el source para que el regex sea /&/g
        lines[i] = "const unesc = (v) => String(v).replace(/&/g, '&').replace(/\"/g, '\"').replace(/'/g, \"'\").replace(/</g, '<').replace(/>/g, '>');"
        print('Fixed line:', lines[i])
        break

with open('backend/lib/caja_mp.mjs', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print('done')