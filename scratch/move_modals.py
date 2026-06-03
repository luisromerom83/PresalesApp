import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extraer todos los bloques de modal
# Los modales empiezan con <div id="..." class="modal hidden"> y terminan en un </div> correspondiente
# Usaremos una expresión regular para encontrar los bloques de modal (esto es simplificado pero debería funcionar si el HTML está bien estructurado)

modal_pattern = re.compile(r'<!--.*?Modal.*?-->\s*<div id="[^"]+" class="modal[^"]*">.*?</div>\s*</div>\s*</div>', re.DOTALL)
# El patrón anterior es un poco arriesgado. Vamos a usar uno más simple que busque el inicio del modal y capture hasta un cierre que sepamos que es el suyo.
# Dado que los modales tienen una estructura fija de 3 cierres de div al final (modal-body, modal-content, modal).

modals = []
def extract_modal(m):
    modals.append(m.group(0))
    return ""

# Buscamos modales y los guardamos
new_content = re.sub(r'<!-- [^>]*Modal -->\s*<div id="[^"]+" class="modal[^"]*">.*?</div>\s*</div>\s*</div>', extract_modal, content, flags=re.DOTALL)

# Si no encontró nada con el patrón anterior, probamos uno más genérico
if not modals:
    # Este busca <div id="..." class="modal ..."> y trata de capturar hasta el final del bloque modal.
    # Como los modales terminan en </div>\s*</div>\s*</div>, usaremos eso.
    new_content = re.sub(r'<div id="[^"]+" class="modal[^"]*">.*?</div>\s*</div>\s*</div>', extract_modal, content, flags=re.DOTALL)

# 2. Insertar los modales antes del cierre de body
if modals:
    all_modals_html = "\n\n    <!-- MODALS REPOSITIONED BY ANTIGRAVITY -->\n" + "\n".join(modals)
    new_content = new_content.replace('</body>', all_modals_html + '\n</body>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Movidos {len(modals)} modales al final del body.")
