/* ===================================
   Main JavaScript - Portfolio
   Cosmos.so Inspired Interactions
   =================================== */

// Custom Cursor - Cosmos.so Style
const CustomCursor = {
  cursor: null,
  dot: null,
  cursorX: 0,
  cursorY: 0,
  dotX: 0,
  dotY: 0,

  init() {
    // Create cursor elements
    this.createCursor();

    // Only initialize on non-touch devices
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      this.bindEvents();
      this.animate();
    }
  },

  createCursor() {
    // Main cursor circle
    this.cursor = document.createElement('div');
    this.cursor.id = 'custom-cursor';
    document.body.appendChild(this.cursor);

    // Inner dot
    this.dot = document.createElement('div');
    this.dot.id = 'cursor-dot';
    document.body.appendChild(this.dot);
  },

  bindEvents() {
    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
      this.cursorX = e.clientX;
      this.cursorY = e.clientY;
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
      this.cursor.style.opacity = '0';
      this.dot.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
      this.cursor.style.opacity = '1';
      this.dot.style.opacity = '1';
    });

    // Click effect
    document.addEventListener('mousedown', () => {
      this.cursor.classList.add('cursor-click');
    });

    document.addEventListener('mouseup', () => {
      this.cursor.classList.remove('cursor-click');
    });

    // Hover effects on interactive elements
    this.addHoverListeners();
  },

  addHoverListeners() {
    // Interactive elements that trigger cursor change
    const interactiveElements = document.querySelectorAll(`
      a, button, .btn, .card, .skill-card, .project-card, .cert-card,
      .contact-item, .filter-chip, .nav-link, .theme-btn, .experience-card,
      .title-badge, .soft-skill-item, input, .mobile-menu-btn, .search-clear
    `);

    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.cursor.classList.add('cursor-hover');
        this.dot.classList.add('cursor-hover');

        // Category-specific colors
        const category = el.dataset.category;
        if (category === 'data') {
          this.cursor.classList.add('cursor-hover-data');
        } else if (category === 'automatizacion' || category === 'automation') {
          this.cursor.classList.add('cursor-hover-automation');
        } else if (category === 'software') {
          this.cursor.classList.add('cursor-hover-software');
        }
      });

      el.addEventListener('mouseleave', () => {
        this.cursor.classList.remove('cursor-hover', 'cursor-hover-data', 'cursor-hover-automation', 'cursor-hover-software');
        this.dot.classList.remove('cursor-hover');
      });
    });
  },

  animate() {
    // Smooth interpolation for the outer cursor
    const easing = 0.15;

    this.dotX += (this.cursorX - this.dotX) * 0.5;
    this.dotY += (this.cursorY - this.dotY) * 0.5;

    const cursorCurrentX = parseFloat(this.cursor.style.left) || this.cursorX;
    const cursorCurrentY = parseFloat(this.cursor.style.top) || this.cursorY;

    const newCursorX = cursorCurrentX + (this.cursorX - cursorCurrentX) * easing;
    const newCursorY = cursorCurrentY + (this.cursorY - cursorCurrentY) * easing;

    this.cursor.style.left = newCursorX + 'px';
    this.cursor.style.top = newCursorY + 'px';

    this.dot.style.left = this.dotX + 'px';
    this.dot.style.top = this.dotY + 'px';

    requestAnimationFrame(() => this.animate());
  },

  // Refresh listeners (call after dynamic content is added)
  refresh() {
    this.addHoverListeners();
  }
};

// Theme Management
const ThemeManager = {
  init() {
    this.setInitialTheme();
    this.bindEvents();
  },

  setInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    this.applyTheme(theme);
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.updateToggleButtons(theme);
  },

  updateToggleButtons(theme) {
    const buttons = document.querySelectorAll('.theme-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  },

  bindEvents() {
    const toggleButtons = document.querySelectorAll('.theme-btn');
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.applyTheme(btn.dataset.theme);
      });
    });
  }
};

// Mobile Navigation
const MobileNav = {
  init() {
    this.menuBtn = document.querySelector('.mobile-menu-btn');
    this.nav = document.querySelector('.nav');

    if (this.menuBtn && this.nav) {
      this.bindEvents();
    }
  },

  bindEvents() {
    this.menuBtn.addEventListener('click', () => this.toggle());

    // Close on link click
    this.nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => this.close());
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header-content')) {
        this.close();
      }
    });
  },

  toggle() {
    this.nav.classList.toggle('open');
    this.menuBtn.classList.toggle('active');
  },

  close() {
    this.nav.classList.remove('open');
    this.menuBtn.classList.remove('active');
  }
};

// Scroll Animations
const ScrollAnimations = {
  init() {
    this.observeElements();
    this.bindScrollEvents();
  },

  observeElements() {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Add stagger delay
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, index * 60);
          observer.unobserve(entry.target);
        }
      });
    }, options);

    document.querySelectorAll('.stagger-item').forEach(el => {
      observer.observe(el);
    });
  },

  bindScrollEvents() {
    let ticking = false;
    let lastScrollY = 0;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
  },

  handleScroll() {
    const header = document.querySelector('.header');
    if (header) {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  }
};

// Smooth Scroll for anchor links
const SmoothScroll = {
  init() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          const headerOffset = 90;
          const elementPosition = target.offsetTop;
          const offsetPosition = elementPosition - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }
};

// Typewriter Effect for dynamic titles
const TypeWriter = {
  init() {
    const elements = document.querySelectorAll('[data-typewriter]');
    elements.forEach(el => this.animate(el));
  },

  animate(element) {
    const words = JSON.parse(element.dataset.typewriter || '[]');
    if (words.length === 0) return;

    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let currentWord = '';

    const type = () => {
      currentWord = words[wordIndex];

      if (isDeleting) {
        charIndex--;
      } else {
        charIndex++;
      }

      element.textContent = currentWord.substring(0, charIndex);

      let typeSpeed = isDeleting ? 50 : 100;

      if (!isDeleting && charIndex === currentWord.length) {
        typeSpeed = 2000; // Pause at end
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = 500;
      }

      setTimeout(type, typeSpeed);
    };

    setTimeout(type, 1000);
  }
};

// Enhanced Card Hover Effects
const CardEffects = {
  init() {
    const cards = document.querySelectorAll('.skill-card, .project-card, .cert-card');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
      card.addEventListener('mouseleave', () => this.handleMouseLeave(card));
    });
  },

  handleMouseMove(e, card) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle 3D rotation
    const rotateX = (y - centerY) / 25;
    const rotateY = (centerX - x) / 25;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.01)`;

    // Optional: Add subtle highlight effect
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    card.style.setProperty('--glare-x', `${glareX}%`);
    card.style.setProperty('--glare-y', `${glareY}%`);
  },

  handleMouseLeave(card) {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
  }
};

// Page Loader and Transitions
const PageLoader = {
  init() {
    // Fade in body when loaded
    document.body.classList.add('loaded');

    // Handle images loading
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        });
      }
    });
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  CustomCursor.init();
  ThemeManager.init();
  MobileNav.init();
  ScrollAnimations.init();
  SmoothScroll.init();
  TypeWriter.init();
  CardEffects.init();
  PageLoader.init();
});

// Refresh cursor listeners after dynamic content is added
window.refreshCursor = () => {
  CustomCursor.refresh();
  CardEffects.init();
};

// Export for use in other modules
window.ThemeManager = ThemeManager;
window.CustomCursor = CustomCursor;
