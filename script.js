/* ============================================
   Bitcoin is Better — Slide-Based Interactivity
   ============================================ */

(function () {
  'use strict';

  const nav = document.getElementById('nav');
  const progressBar = document.getElementById('progressBar');
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');

  // --- Scroll-triggered fade-in ---
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -50px 0px', threshold: 0.15 });

  document.querySelectorAll('.fade-in').forEach((el) => fadeObserver.observe(el));

  // --- Slide visibility for staggered animations ---
  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const children = entry.target.querySelectorAll(
          '.slide-label, h2, p, .slide-quote, .mini-timeline, .genesis-badge, ' +
          '.chart-visual, .blockchain-diagram, .slide-img, .img-caption, ' +
          '.layer-compare, .stat-row, .stf-mini, .comparison-chart, ' +
          '.future-grid, .final-quote, .resource-grid, .fg-card, .resource-card'
        );
        children.forEach((child, i) => {
          child.classList.add('fade-in');
          setTimeout(() => child.classList.add('visible'), 80 + i * 60);
        });
        slideObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '-10% 0px -10% 0px', threshold: 0.1 });

  slides.forEach((slide) => slideObserver.observe(slide));

  // --- Nav scroll state & progress bar ---
  function onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    nav.classList.toggle('scrolled', scrollTop > 40);
    progressBar.style.width = pct + '%';

    updateActiveDot();
  }

  // --- Active dot indicator ---
  function updateActiveDot() {
    const scrollCenter = window.scrollY + window.innerHeight / 2;

    let activeIndex = 0;
    slides.forEach((slide, i) => {
      if (scrollCenter >= slide.offsetTop) {
        activeIndex = i;
      }
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIndex);
    });
  }

  // --- Dot click navigation ---
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.dataset.slide, 10);
      const target = slides[index];
      if (target) {
        const offset = 56;
        window.scrollTo({
          top: target.offsetTop - offset,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 56,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- Hero parallax fade ---
  const hero = document.querySelector('#hero');
  function heroParallax() {
    if (!hero) return;
    const scrolled = window.scrollY;
    const h = hero.offsetHeight;
    if (scrolled < h) {
      hero.style.opacity = 1 - (scrolled / h) * 0.8;
    }
  }

  // --- Throttled scroll handler ---
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        onScroll();
        heroParallax();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // --- Initialize ---
  onScroll();
})();
