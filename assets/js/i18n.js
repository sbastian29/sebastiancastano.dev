/* ===================================================================
   i18n.js  v2 — Promise-based language detection
   window.i18nReady resolves once lang is known — await it before
   generating any dynamic content.
   =================================================================== */

const I18n = (() => {

  const SPANISH_COUNTRIES = new Set([
    'ES','MX','AR','CO','PE','VE','CL','EC','GT','CU',
    'BO','DO','HN','PY','SV','NI','CR','PA','UY','GQ'
  ]);

  const T = {
    es: {
      'nav.certs':'Certificados','nav.portfolio':'Portfolio',
      'nav.theme.dark':'Dark','nav.theme.light':'Light',
      'hero.badge.data':'Ingeniero de Datos','hero.badge.auto':'Automatización','hero.badge.soft':'Desarrollador',
      'hero.description':'Apasionado por transformar datos en valor. Especializado en construir pipelines de datos robustos, automatizar procesos empresariales y desarrollar aplicaciones escalables.',
      'hero.btn.projects':'Ver Proyectos','hero.btn.contact':'Contactar',
      'skills.title':'Habilidades Técnicas',
      'skills.subtitle':'Tecnologías y herramientas que domino para crear soluciones de datos e ingeniería de software.',
      'skills.search':'Buscar habilidades...','skills.clear':'Limpiar',
      'skills.filter.label':'Filtrar por área','skills.filter.auto':'Automatización / IA',
      'skills.filter.data':'Data Engineering','skills.filter.soft':'Desarrollo de Software',
      'skills.counter':'Mostrando <strong>{n}</strong> de <strong>{t}</strong> habilidades',
      'skills.reset':'Resetear filtros','skills.empty':'No se encontraron habilidades',
      'skills.empty.sub':'Intenta ajustar los filtros o términos de búsqueda',
      'exp.title':'Experiencia Profesional',
      'exp.subtitle':'Mi trayectoria en el mundo del desarrollo y la ingeniería de datos.',
      'exp.ndh.role':'Ingeniero de Datos','exp.ndh.date':'Mar 2024 - Ago 2024',
      'exp.ndh.desc':'Desarrollo y mantenimiento de pipelines ETL con Python y Apache Airflow. Implementación de soluciones de data engineering en AWS (S3, Glue, Athena). Procesamiento de datos con Apache Spark y Kafka. Desarrollo de APIs con FastAPI.',
      'exp.ser.role':'Desarrollador en IA e Hiperautomatización','exp.ser.date':'Mar 2025 - Actualidad',
      'exp.ser.desc':'Gestión y orquestación de agentes inteligentes para la creación automática de tickets de soporte. Desarrollo de automatizaciones para el envío de informes diarios y tareas operativas. Implementación de flujos de creación y gestión de tickets en distintas arquitecturas y sistemas. Optimización de procesos mediante IA e hiperautomatización orientada a usuario.',
      'edu.title':'Formación Académica','edu.subtitle':'Mi base académica en el desarrollo de software.',
      'edu.dam.role':'Técnico Superior en DAM',
      'edu.dam.desc':'Formación en desarrollo de aplicaciones multiplataforma con Java y Kotlin. Proyectos de bases de datos SQL y NoSQL. Desarrollo móvil con Android y Jetpack Compose. Trabajo de Fin de Grado: Sistema de Gestión Hospitalaria.',
      'soft.title':'Habilidades Blandas','soft.subtitle':'Competencias personales que complementan mi perfil técnico.',
      'soft.1':'Resolución de Problemas','soft.2':'Trabajo en Equipo','soft.3':'Comunicación Efectiva',
      'soft.4':'Aprendizaje Continuo','soft.5':'Pensamiento Analítico','soft.6':'Gestión del Tiempo',
      'soft.7':'Adaptabilidad','soft.8':'Proactividad',
      // Form
      'form.title':'Envíame un mensaje','form.subtitle':'Te responderé en menos de 48 horas.',
      'form.name':'Nombre','form.name.ph':'Tu nombre',
      'form.email':'Email','form.email.ph':'tu@email.com',
      'form.company':'Empresa','form.company.ph':'Nombre de tu empresa','form.optional':'(opcional)',
      'form.message':'Mensaje','form.message.ph':'Cuéntame en qué puedo ayudarte...',
      'form.send':'Enviar mensaje',
      'contact.available':'Disponible para nuevos proyectos',
      'contact.title':'Contacto','contact.subtitle':'¿Interesado en trabajar juntos? ¡Hablemos!',
      'contact.email':'Email','contact.phone':'Teléfono','contact.location':'Ubicación','contact.city':'Madrid, España',
      'toast.title':'Nuevo mensaje',
      'toast.body':'🚀 Actualmente enfocado en profundizar en <strong>Data Engineering</strong> y preparando nuevas certificaciones de AWS.',
      'footer.rights':'© 2026 Sebastián Castaño Suárez. Todos los derechos reservados.',
      'certs.title':'Certificados',
      'certs.subtitle':'Formación académica, cursos especializados y certificaciones que validan mis conocimientos.',
      'certs.search':'Buscar certificados...','certs.clear':'Limpiar',
      'certs.filter.bytype':'Por tipo','certs.filter.univ':'Universidad',
      'certs.filter.online':'Curso Online','certs.filter.lang':'Idioma',
      'certs.filter.award':'Reconocimiento','certs.filter.bytech':'Por área / tecnología',
      'certs.filter.python':'Python','certs.filter.bigdata':'Big Data',
      'certs.filter.webdev':'Web Dev','certs.filter.cloud':'Cloud','certs.filter.mobile':'Mobile',
      'certs.no_results.sub':'Intenta ajustar los filtros o términos de búsqueda',
      'certs.counter':'Mostrando <strong>{n}</strong> de <strong>{t}</strong> certificados',
      'certs.reset':'Resetear filtros','certs.empty':'No se encontraron certificados',
      'certs.empty.sub':'Intenta ajustar los filtros o términos de búsqueda',
      'certs.type.universidad':'universidad','certs.type.curso-online':'curso online',
      'certs.type.idioma':'idioma','certs.type.reconocimiento':'reconocimiento','certs.type.cloud':'cloud',
      'port.title':'Portfolio',
      'port.subtitle':'Proyectos destacados en ingeniería de datos, automatización y desarrollo de software.',
      'port.stat.projects':'Proyectos','port.stat.techs':'Tecnologías','port.stat.areas':'Áreas',
      'port.search':'Buscar proyectos...','port.clear':'Limpiar',
      'port.filter.byrole':'Por rol / área','port.filter.auto':'Automatización',
      'port.filter.data':'Data Engineering','port.filter.soft':'Desarrollo Software',
      'port.filter.bytech':'Por tecnología',
      'port.counter':'Mostrando <strong>{n}</strong> de <strong>{t}</strong> proyectos',
      'port.reset':'Mezclar / Reset','port.empty':'No se encontraron proyectos',
      'port.empty.sub':'Intenta ajustar los filtros o términos de búsqueda',
      'port.cat.data':'Data Engineering','port.cat.auto':'Automatización','port.cat.soft':'Software',
      'port.featured':'Destacado','port.github':'GitHub','port.demo':'Demo',
      'port.page.h1':'Portfolio','port.page.subtitle':'Proyectos destacados en ingeniería de datos, automatización y desarrollo de software.',
      'certs.page.h1':'Certificados','certs.page.subtitle':'Formación académica, cursos especializados y certificaciones que validan mis conocimientos.',
    },
    en: {
      'nav.certs':'Certificates','nav.portfolio':'Portfolio',
      'nav.theme.dark':'Dark','nav.theme.light':'Light',
      'hero.badge.data':'Data Engineer','hero.badge.auto':'Automation','hero.badge.soft':'Developer',
      'hero.description':'Passionate about turning data into value. Specialized in building robust data pipelines, automating business processes, and developing scalable applications.',
      'hero.btn.projects':'View Projects','hero.btn.contact':'Contact',
      'skills.title':'Technical Skills',
      'skills.subtitle':'Technologies and tools I master to build data and software engineering solutions.',
      'skills.search':'Search skills...','skills.clear':'Clear',
      'skills.filter.label':'Filter by area','skills.filter.auto':'Automation / AI',
      'skills.filter.data':'Data Engineering','skills.filter.soft':'Software Development',
      'skills.counter':'Showing <strong>{n}</strong> of <strong>{t}</strong> skills',
      'skills.reset':'Reset filters','skills.empty':'No skills found',
      'skills.empty.sub':'Try adjusting your filters or search terms',
      'exp.title':'Professional Experience',
      'exp.subtitle':'My journey in software development and data engineering.',
      'exp.ndh.role':'Data Engineer','exp.ndh.date':'Mar 2024 - Aug 2024',
      'exp.ndh.desc':'Development and maintenance of ETL pipelines with Python and Apache Airflow. Implementation of data engineering solutions on AWS (S3, Glue, Athena). Data processing with Apache Spark and Kafka. API development with FastAPI.',
      'exp.ser.role':'AI & Hyperautomation Developer','exp.ser.date':'Mar 2025 - Present',
      'exp.ser.desc':'Management and orchestration of intelligent agents for automatic support ticket creation. Development of automations for daily report delivery and operational tasks. Implementation of ticket creation and management flows across different architectures. Process optimization through AI and user-oriented hyperautomation.',
      'edu.title':'Academic Background','edu.subtitle':'My academic foundation in software development.',
      'edu.dam.role':'Higher Technician in Multiplatform App Development',
      'edu.dam.desc':'Training in multiplatform application development with Java and Kotlin. SQL and NoSQL database projects. Mobile development with Android and Jetpack Compose. Final Project: Hospital Management System.',
      'soft.title':'Soft Skills','soft.subtitle':'Personal competencies that complement my technical profile.',
      'soft.1':'Problem Solving','soft.2':'Teamwork','soft.3':'Effective Communication',
      'soft.4':'Continuous Learning','soft.5':'Analytical Thinking','soft.6':'Time Management',
      'soft.7':'Adaptability','soft.8':'Proactivity',
      // Form
      'form.title':'Send me a message','form.subtitle':'I\'ll get back to you within 48 hours.',
      'form.name':'Name','form.name.ph':'Your name',
      'form.email':'Email','form.email.ph':'you@email.com',
      'form.company':'Company','form.company.ph':'Your company name','form.optional':'(optional)',
      'form.message':'Message','form.message.ph':'Tell me how I can help you...',
      'form.send':'Send message',
      'contact.available':'Available for new projects',
      'contact.title':'Contact','contact.subtitle':"Interested in working together? Let's talk!",
      'contact.email':'Email','contact.phone':'Phone','contact.location':'Location','contact.city':'Madrid, Spain',
      'toast.title':'Status update',
      'toast.body':'🚀 Currently focused on deepening my <strong>Data Engineering</strong> expertise and preparing new AWS certifications.',
      'footer.rights':'© 2026 Sebastián Castaño Suárez. All rights reserved.',
      'certs.title':'Certificates',
      'certs.subtitle':'Academic training, specialized courses and certifications that validate my knowledge.',
      'certs.search':'Search certificates...','certs.clear':'Clear',
      'certs.filter.bytype':'By type','certs.filter.univ':'University',
      'certs.filter.online':'Online Course','certs.filter.lang':'Language',
      'certs.filter.award':'Recognition','certs.filter.bytech':'By area / technology',
      'certs.counter':'Showing <strong>{n}</strong> of <strong>{t}</strong> certificates',
      'certs.reset':'Reset filters','certs.empty':'No certificates found',
      'certs.empty.sub':'Try adjusting your filters or search terms',
      'certs.type.universidad':'university','certs.type.curso-online':'online course',
      'certs.type.idioma':'language','certs.type.reconocimiento':'recognition','certs.type.cloud':'cloud',
      'port.title':'Portfolio',
      'port.subtitle':'Featured projects in data engineering, automation and software development.',
      'port.stat.projects':'Projects','port.stat.techs':'Technologies','port.stat.areas':'Areas',
      'port.search':'Search projects...','port.clear':'Clear',
      'port.filter.byrole':'By role / area','port.filter.auto':'Automation',
      'port.filter.data':'Data Engineering','port.filter.soft':'Software Dev',
      'port.filter.bytech':'By technology',
      'port.counter':'Showing <strong>{n}</strong> of <strong>{t}</strong> projects',
      'port.reset':'Shuffle / Reset','port.empty':'No projects found',
      'port.empty.sub':'Try adjusting your filters or search terms',
      'port.cat.data':'Data Engineering','port.cat.auto':'Automation','port.cat.soft':'Software',
      'port.featured':'Featured','port.github':'GitHub','port.demo':'Demo',
      // Page titles (missing)
      'port.page.h1':'Portfolio','port.page.subtitle':'Featured projects in data engineering, automation and software development.',
      'certs.page.h1':'Certificates','certs.page.subtitle':'Academic training, specialized courses and certifications that validate my knowledge.',
      // Cert tech filter chips (missing)
      'certs.filter.python':'Python','certs.filter.bigdata':'Big Data',
      'certs.filter.webdev':'Web Dev','certs.filter.cloud':'Cloud','certs.filter.mobile':'Mobile',
      // Cert no-results sub (missing)
      'certs.no_results.sub':'Try adjusting your filters or search terms',
    }
  };

  let lang = 'es';
  let _resolve;
  const ready = new Promise(r => { _resolve = r; });

  function t(key, vars) {
    let s = (T[lang] && T[lang][key]) || (T.es[key]) || key;
    if (vars) Object.entries(vars).forEach(([k,v]) => { s = s.replace(new RegExp('{'+k+'}','g'), v); });
    return s;
  }

  function apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = t(el.dataset.i18n);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = v;
      else el.innerHTML = v;
    });
    const meta = document.querySelector('meta[name="i18n-title"]');
    if (meta) document.title = t(meta.content);
    document.dispatchEvent(new CustomEvent('i18n:applied', {detail:{lang}}));
  }

  function _finalize(code) {
    lang = SPANISH_COUNTRIES.has(code) ? 'es' : 'en';
    document.documentElement.lang = lang;
    apply();
    _resolve(lang);
  }

  async function detect() {
    const cached = localStorage.getItem('i18n_country');
    const age    = Date.now() - parseInt(localStorage.getItem('i18n_at')||'0');
    if (cached && age < 86400000) { _finalize(cached); return; }
    try {
      const ctl = new AbortController();
      setTimeout(() => ctl.abort(), 3000);
      const r = await fetch('https://ipapi.co/json/', {signal: ctl.signal});
      if (r.ok) {
        const d = await r.json();
        const c = d.country_code || 'ES';
        localStorage.setItem('i18n_country', c);
        localStorage.setItem('i18n_at', Date.now());
        _finalize(c); return;
      }
    } catch(_) {}
    const bl = (navigator.language||'es').toLowerCase();
    _finalize(bl.startsWith('es') ? 'ES' : 'US');
  }

  function override(forceLang) {
    lang = forceLang;
    localStorage.setItem('i18n_country', forceLang === 'es' ? 'ES' : 'US');
    localStorage.setItem('i18n_at', Date.now());
    document.documentElement.lang = lang;
    apply();
    _resolve(lang);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', detect);
  else detect();

  return { ready, t, getLang:()=>lang, apply, override };
})();

window.I18n = I18n;
window.i18nReady = I18n.ready;