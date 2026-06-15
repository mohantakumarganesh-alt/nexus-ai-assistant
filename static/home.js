// ══════════════════════════════════════════════════
//  Nexus AI — Home Page JS
// ══════════════════════════════════════════════════

// ── 1. Sticky nav on scroll ──────────────────────
const nav = document.getElementById('home-nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ── 2. Hamburger menu toggle ─────────────────────
const hamburger = document.getElementById('nav-hamburger');
const drawer = document.getElementById('mobile-drawer');

hamburger?.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    drawer.classList.toggle('open', isOpen);
});

// Close drawer when a link is clicked
drawer?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
    });
});

// Close drawer on outside click
document.addEventListener('click', (e) => {
    if (drawer?.classList.contains('open') &&
        !drawer.contains(e.target) &&
        !hamburger.contains(e.target)) {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
    }
});

// ── 3. Smooth scroll for anchor links ────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const offset = 80; // nav height
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// ── 4. Chat preview — cycling slides ─────────────
const slides = document.querySelectorAll('.preview-slide');
const indicators = document.querySelectorAll('.indicator');
let currentSlide = 0;
let slideTimer;

function showSlide(idx) {
    slides[currentSlide]?.classList.remove('active');
    indicators[currentSlide]?.classList.remove('active');
    currentSlide = idx;
    slides[currentSlide]?.classList.add('active');
    indicators[currentSlide]?.classList.add('active');
}

function nextSlide() {
    showSlide((currentSlide + 1) % slides.length);
}

function startCycling() {
    slideTimer = setInterval(nextSlide, 3500);
}

function stopCycling() {
    clearInterval(slideTimer);
}

if (slides.length > 0) {
    startCycling();

    // Indicator click
    indicators.forEach((ind, i) => {
        ind.addEventListener('click', () => {
            stopCycling();
            showSlide(i);
            startCycling();
        });
    });
}

// ── 5. Scroll-reveal for sections ────────────────
const revealTargets = document.querySelectorAll(
    '.feature-expanded, .timeline-step, .provider-card, ' +
    '.section-header, .cta-title, .cta-subtitle, #cta-launch-btn'
);

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Stagger siblings
            const siblings = [...(entry.target.parentElement?.children || [])];
            const idx = siblings.indexOf(entry.target);
            const delay = Math.min(idx * 80, 400);
            setTimeout(() => entry.target.classList.add('visible'), delay);
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
});

revealTargets.forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});

// ── 6. Animated stat counters ────────────────────
function animateCounter(el) {
    const target = parseInt(el.dataset.target) || 0;
    const suffix = el.dataset.suffix || '';
    
    if (suffix === '$') {
        el.textContent = '$0';
        return;
    }

    const duration = 1600;
    const start = performance.now();

    const update = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
}

const statsSection = document.getElementById('hero-stats');
let statsAnimated = false;

if (statsSection) {
    new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !statsAnimated) {
            statsAnimated = true;
            statsSection.querySelectorAll('.stat-number').forEach(animateCounter);
        }
    }, { threshold: 0.5 }).observe(statsSection);
}

// ── 7. Feature card hover tilt (desktop only) ─────
if (window.matchMedia('(min-width: 769px)').matches) {
    document.querySelectorAll('.demo-card, .provider-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `translateY(-4px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
            card.style.transition = 'transform 0.1s ease';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.4s ease';
        });
    });
}

// ── 8. Timeline step — highlight on scroll ─────────
const timelineSteps = document.querySelectorAll('.timeline-step');
const stepObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelector('.timeline-num')?.classList.add('active-num');
        } else {
            entry.target.querySelector('.timeline-num')?.classList.remove('active-num');
        }
    });
}, { threshold: 0.4 });

// ── 9. Page Transition to Chat App ──────────────────
document.querySelectorAll('a[href="/chat"]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Show animation overlay
        const overlay = document.createElement('div');
        overlay.className = 'page-transition-overlay slide-mode';
        overlay.innerHTML = `
            <div class="slide-panel">
                <div class="slide-glow"></div>
                <div class="slide-content">
                    <div class="nexus-spinner"></div>
                    <div class="slide-text">Nexus AI</div>
                    <div class="slide-subtext">Initializing secure workspace...</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Force reflow
        overlay.offsetHeight;
        
        // Start animation
        overlay.classList.add('active');

        // Navigate after 4 seconds
        setTimeout(() => {
            window.location.href = this.href;
        }, 4000);
    });
});

// ── 10. Handle Browser Back Button (BFCache) ────────
window.addEventListener('pageshow', function(e) {
    // If the page was loaded from the browser's back-forward cache
    if (e.persisted) {
        // Remove the active animation overlay so the page is usable again
        document.querySelectorAll('.page-transition-overlay').forEach(el => {
            el.remove();
        });
    }
});
