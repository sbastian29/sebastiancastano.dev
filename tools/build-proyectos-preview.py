# Monta la página nueva a partir de portfolio.html: misma cabecera, pie,
# agente y tarjetas; cambia solo el interior de <main>.
# Uso: python mkpreview.py <portfolio.html> <salida.html>
import re, sys

src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf8', newline='').read().replace('\r\n', '\n')

def sub(pat, rep, flags=0):
    global s
    s, n = re.subn(pat, lambda m: rep, s, count=1, flags=flags)
    assert n == 1, pat

CATS = [('ia', 'Inteligencia artificial', .9), ('data', 'Data', .74), ('software', 'Desarrollo', 1), ('automatizacion', 'Automatización', .82)]
ILL = {'ia': 'ia', 'data': 'data', 'software': 'desarrollo', 'automatizacion': 'automatizacion'}
cats = '\n'.join(f'''          <a class="px-cat" href="#pxLista" data-cat="{c}" style="--i:{i};--k:{k}">
            <div class="px-cat__art"><div class="px-cat__panel" data-ill="{ILL[c]}"></div></div>
            <div class="px-cat__foot">
              <div class="px-cat__cap">
                <p class="px-cat__title px-mask"><span data-px="{c}">{name}</span></p>
                <p class="px-cat__count"><span data-count></span> ↗</p>
              </div>
              <div class="px-cat__num" aria-hidden="true"><span>0{i + 1}</span></div>
            </div>
          </a>''' for i, (c, name, k) in enumerate(CATS))

main = f'''<main>
    <!-- Carrusel de categorías -->
    <section class="px" id="px" aria-labelledby="pxTitle">
      <div class="px-stage">
        <div class="px-intro">
          <p class="px-kicker px-mask"><span data-px="index">Índice · 2024 / 2026</span></p>
          <h1 class="px-title px-mask" id="pxTitle"><span data-px="title">Proyectos</span></h1>
          <p class="px-sub px-mask"><span data-px="sub">TRABAJO SELECCIONADO</span></p>
          <p class="px-text" data-px="text">Datos, IA, desarrollo y automatización. Del sistema origen al modelo y a la interfaz.</p>
          <p class="px-meta"><span data-px="metaCats">04 categorías</span><br><span id="pxTotal">&nbsp;</span><br>Python · dbt · Airflow · UiPath</p>
          <div class="px-hint"><p class="px-progress"><span id="pxNow">01 / 04</span><span class="px-progress__bar"></span></p><p data-px="hint">Desplaza ↓ para avanzar →</p></div>
        </div>
        <div class="px-word" aria-hidden="true" data-px="word">OBRA</div>
        <div class="px-viewport">
          <div class="px-track">
{cats}
          </div>
        </div>
      </div>
    </section>

    <!-- Proyectos de la categoría elegida -->
    <section class="section px-lista" id="pxLista" hidden>
      <div class="container">
        <div class="px-lista__head">
          <div>
            <p class="px-lista__kicker" id="pxListaKicker"></p>
            <h2 class="px-lista__title" id="pxListaTitle" tabindex="-1"></h2>
          </div>
          <button type="button" class="px-lista__back" id="pxBack" data-px="back">↑ Categorías</button>
        </div>
        <div class="projects-grid" id="projectsGrid"></div>
      </div>
    </section>
  </main>'''

sub(r'family=Inter:wght@300;400;500;600;700&display=swap', 'family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono&family=Space+Grotesk:wght@300..600&display=swap')
sub(r'assets/css/filters\.css', 'assets/css/proyectos.css')
sub(r'<main>.*</main>', main, re.S)
sub(r'  <script src="assets/js/filterEngine\.js"></script>\n', '  <script src="assets/js/proyectos.js"></script>\n')
sub(r'/\*\* Genera las tarjetas de proyecto en el grid \*/\n    function generateProjectCards\(\) \{', '/** Genera en el grid las tarjetas de una categoría */\n    function generateProjectCards(cat) {')
sub(r'grid\.innerHTML = projectsData\.map\(project => \{', 'grid.innerHTML = projectsData.filter(p => (p.categories || []).includes(cat)).map(project => {')
sub(r'    /\*\* Inicializa el motor de filtros.*?(?=    /\*\* Carga el JSON)', '', re.S)
sub(r'    // =+\n    //  Punto de entrada.*?\n  </script>', '''    // =====================================================================
    //  Punto de entrada: esperar i18n → cargar datos → avisar al carrusel
    // =====================================================================
    window.renderProjectCards = (cat) => {
      generateProjectCards(cat);
      document.querySelectorAll('#projectsGrid .stagger-item').forEach((item, index) => {
        setTimeout(() => item.classList.add('visible'), index * 60);
      });
      if (window.refreshCursor) window.refreshCursor();
    };

    document.addEventListener('DOMContentLoaded', () => {
      (window.i18nReady || Promise.resolve('es')).then(async (lang) => {
        try {
          projectsData = await loadProjects(lang);
          document.dispatchEvent(new CustomEvent('projects:loaded', { detail: projectsData }));
        } catch (err) {
          console.error('Error cargando proyectos:', err);
        }
      });
    });
  </script>''', re.S)
sub(r"const catLabel   = cat === 'data'", "const catLabel   = cat === 'ia' ? 'IA' : cat === 'data'")
sub(r"const catIcon    = cat === 'data'", "const catIcon    = cat === 'ia' ? 'brain' : cat === 'data'")
# CSS que solo usaban la cabecera de página, los contadores y los chips
sub(r'    /\* Page header \*/.*?(?=    /\* =+\n       Botones de enlace)', '', re.S)

open(out, 'w', encoding='utf8', newline='\n').write(s)
print('ok', len(s))
