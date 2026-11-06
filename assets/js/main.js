/* Dust Records - Main JS + GSAP */


document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar-dust');

  if (navbar) {
    let scrollTimer;
    let lastScrollY = window.scrollY;

    const hideDelay = 180;

    function handleScroll() {
      const currentScrollY = window.scrollY;

      // Always restore the original navbar at the page top.
      if (currentScrollY <= 10) {
        navbar.classList.remove('scrolled', 'navbar-hidden');
        clearTimeout(scrollTimer);
        lastScrollY = currentScrollY;
        return;
      }

      // Apply the scrolled appearance.
      navbar.classList.add('scrolled');

      // Don't hide an open mobile navigation menu.
      const mobileMenu = navbar.querySelector('.navbar-collapse');

      if (mobileMenu?.classList.contains('show')) {
        navbar.classList.remove('navbar-hidden');
        clearTimeout(scrollTimer);
        lastScrollY = currentScrollY;
        return;
      }

      // Hide while scrolling.
      navbar.classList.add('navbar-hidden');

      // Reveal after scrolling has stopped.
      clearTimeout(scrollTimer);

      scrollTimer = setTimeout(() => {
        navbar.classList.remove('navbar-hidden');
      }, hideDelay);

      lastScrollY = currentScrollY;
    }

    window.addEventListener('scroll', handleScroll, {
      passive: true
    });

    // Set the correct initial appearance on page load.
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    }
  }

  // Keep your existing initializers.
  initHeroCarousel();
  initAwardsCarousel();
  initCounters();
  initMusicPlayer();
});

function initHeroCarousel() {
  const slides = document.querySelectorAll('.hero-slide');
  if (!slides.length) return;

  let current = 0;
  const interval = 5000; // 5 seconds

  // Set first active
  gsap.set(slides[0], { opacity: 1, visibility: 'visible', y: 0 });
  slides[0].classList.add('active');

  function nextSlide() {
    const prev = slides[current];
    current = (current + 1) % slides.length;
    const next = slides[current];

    // Random animation style
    const animType = Math.floor(Math.random() * 4);

    // Exit previous
    if (animType === 0) {
      gsap.to(prev, {
        opacity: 0,
        y: -40,
        duration: 0.7,
        ease: 'power2.in',
        onComplete: () => {
          prev.classList.remove('active');
          gsap.set(prev, { visibility: 'hidden', y: 40 });
        }
      });
    } else if (animType === 1) {
      gsap.to(prev, {
        opacity: 0,
        x: -60,
        duration: 0.65,
        ease: 'power3.in',
        onComplete: () => {
          prev.classList.remove('active');
          gsap.set(prev, { visibility: 'hidden', x: 60 });
        }
      });
    } else if (animType === 2) {
      gsap.to(prev, {
        opacity: 0,
        scale: 0.92,
        filter: 'blur(8px)',
        duration: 0.7,
        ease: 'power2.in',
        onComplete: () => {
          prev.classList.remove('active');
          gsap.set(prev, { visibility: 'hidden', scale: 1.05, filter: 'blur(0px)' });
        }
      });
    } else {
      gsap.to(prev, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: 'power2.in',
        onComplete: () => {
          prev.classList.remove('active');
          gsap.set(prev, { visibility: 'hidden', y: -30 });
        }
      });
    }

    // Enter next
    next.classList.add('active');
    gsap.set(next, { visibility: 'visible' });

    if (animType === 0) {
      gsap.fromTo(next, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', delay: 0.25 });
    } else if (animType === 1) {
      gsap.fromTo(next, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 });
    } else if (animType === 2) {
      gsap.fromTo(next, { opacity: 0, scale: 1.08, filter: 'blur(6px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out', delay: 0.25 });
    } else {
      gsap.fromTo(next, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out', delay: 0.2 });
    }
  }

  setInterval(nextSlide, interval);
}

function initAwardsCarousel() {
  const slides = document.querySelectorAll('.award-slide');
  const bgs = document.querySelectorAll('.awards-bg');
  if (!slides.length) return;

  let current = 0;
  const interval = 5500;

  gsap.set(slides[0], { opacity: 1, visibility: 'visible' });
  slides[0].classList.add('active');
  if (bgs[0]) bgs[0].style.opacity = '1';

  function nextAward() {
    const prev = slides[current];
    const prevBg = bgs[current];
    current = (current + 1) % slides.length;
    const next = slides[current];
    const nextBg = bgs[current];

    gsap.to(prev, {
      opacity: 0,
      y: -25,
      duration: 0.6,
      ease: 'power2.in',
      onComplete: () => {
        prev.classList.remove('active');
        gsap.set(prev, { visibility: 'hidden', y: 25 });
      }
    });

    if (prevBg) gsap.to(prevBg, { opacity: 0, duration: 0.8 });

    next.classList.add('active');
    gsap.set(next, { visibility: 'visible' });
    gsap.fromTo(next, { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.25 });

    if (nextBg) {
      nextBg.style.opacity = '0';
      gsap.to(nextBg, { opacity: 1, duration: 0.9, delay: 0.1 });
    }
  }

  setInterval(nextAward, interval);
}

function initCounters() {
  const counters = document.querySelectorAll('.counter-value');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = el.getAttribute('data-target');
        const isPlus = target.includes('+');
        const num = parseInt(target.replace('+', ''), 10);
        let current = 0;
        const duration = 2800;
        const step = Math.max(1, Math.ceil(num / (duration / 32)));

        const timer = setInterval(() => {
          current += step;
          if (current >= num) {
            current = num;
            clearInterval(timer);
          }
          el.textContent = isPlus ? current + '+' : current;
        }, 32);

        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

function initMusicPlayer() {
  const tracks = document.querySelectorAll('.track-item');
  if (!tracks.length) return;

  tracks.forEach(track => {
    track.addEventListener('click', () => {
      tracks.forEach(t => t.classList.remove('playing'));
      track.classList.add('playing');

      // Toggle play icon
      const btn = track.querySelector('.play-btn i');
      tracks.forEach(t => {
        const i = t.querySelector('.play-btn i');
        if (i) {
          i.classList.remove('fa-pause');
          i.classList.add('fa-play');
        }
      });
      if (btn) {
        btn.classList.remove('fa-play');
        btn.classList.add('fa-pause');
      }
    });
  });
}




/* ========== CHATBOT: hide while scrolling, show when stationary ========== */
(function () {
  const btn = document.querySelector('.chatbot-btn');
  if (!btn) return;
  let scrollTimer;
  window.addEventListener('scroll', () => {
    btn.classList.add('hidden');
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      btn.classList.remove('hidden');
    }, 280);
  }, { passive: true });
})();

/* ========== BOOKING FORM SLIDE ========== */
(function () {
  const slider = document.querySelector('.form-slider');
  const switchBtn = document.getElementById('formSwitchBtn');
  if (!slider || !switchBtn) return;

  switchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    slider.classList.toggle('slide-left');
    const isGeneral = slider.classList.contains('slide-left');
    switchBtn.textContent = isGeneral ? 'Switch to Booking Request' : 'Switch to General Inquiry';
  });
})();
