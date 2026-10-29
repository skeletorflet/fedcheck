import re

with open('backend/lib/caja_mp.mjs', 'r', encoding='utf-8') as f:
    t = f.read()

# El regex actual: /&/g  (match literal &)
# Necesitamos: /&/g  (match literal & a m p ;)
# En el source JS, para que el regex sea /&/g, el source debe contener los 5 caracteres: & a m p ;
# Pero al escribir en el archivo, & se convierte en & (1 char)
# Solución: escribir los bytes raw

# Vamos a usar replace con una función que construye el string correcto
# En Python, '&' es el carácter & (1 char). '&' es la cadena de 5 chars: & a m p ;
# Queremos que en el archivo JS el regex sea /&/g
# En JS source, /&/g significa: regex que matcha los 5 chars & a m p ;
# Para lograr eso, el archivo debe contener los bytes: / & a m p ; / g
# En Python string: '/&/g'  (6 chars: / & a m p ; / g)

old_line = "const unesc = (v) => String(v).replace(/&/g, '&').replace(/\"/g, '\"').replace(/'/g, \"'\").replace(/</g, '<').replace(/>/g, '>');"

# Nueva línea con las entidades HTML en los REGEX (no en el replacement)
# Los regex deben ser: /&/g, /"/g, /'/g, /</g, />/g
# En Python: '/&/g' = '/&/g' (7 chars)
new_line = "const unesc = (v) => String(v).replace(/&/g, '&').replace(/&/g, '\"').replace(/'/g, \"'\").replace(/&/g, '<').replace(/&/g, '>');"

# Wait - the regex /&/g matches &, the regex /"/g matches ", etc.
# But we need regex /&/g which is 7 chars in source: / & a m p ; / g
# In Python string: "/&/g" -> this is 6 chars in Python: / & a m p ; / g

# Let me construct carefully
new_line = (
    "const unesc = (v) => String(v)"
    + ".replace(/&/g, '&')"
    + ".replace(/&/g, '\\\"')"   # "
    + ".replace(/'/g, \"'\")" # '
    + ".replace(/&/g, '<')"       # <
    + ".replace(/&/g, '>');"      # >
)

# Verify
print("New line:", new_line)
print("Length:", len(new_line))

# Replace in file
lines = t.split('\n')
for i, line in enumerate(lines):
    if 'const unesc = (v)' in line:
        lines[i] = new_line
        break

with open('backend/lib/caja_mp.mjs', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print('done')