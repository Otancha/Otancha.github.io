const navToggle = document.getElementById('hamburger');
const navMenu = document.getElementById('primary-menu');
// Feature flags
const ENABLE_LIGHTBOX = false; // set true to enable image lightbox

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', String(!expanded));
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('is-open');
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('is-open');
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

const scrollByAmount = track => Math.max(track.clientWidth * 0.75, 240);

document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track = carousel.querySelector('.carousel__track') || carousel.querySelector('.gallery__track');
    if (!track) return;
    const prev = carousel.querySelector('[data-dir="prev"]');
    const next = carousel.querySelector('[data-dir="next"]');
    const items = Array.from(track.querySelectorAll('.work-card, .gallery-card'));
    const dotsContainer = carousel.querySelector('.gallery__dots');

    const getPositions = () => items.map(el => el.offsetLeft);

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const getNearestIndex = () => {
        const positions = getPositions();
        const x = track.scrollLeft;
        let idx = 0;
        let best = Infinity;
        for (let i = 0; i < positions.length; i++) {
            const d = Math.abs(positions[i] - x);
            if (d < best) { best = d; idx = i; }
        }
        return idx;
    };

    const moveToIndex = (index) => {
        const positions = getPositions();
        const target = clamp(index, 0, positions.length - 1);
        track.scrollTo({ left: positions[target], behavior: 'smooth' });
        return target;
    };

    const step = (dir) => {
        const current = getNearestIndex();
        const nextIndex = current + (dir > 0 ? 1 : -1);
        const tgt = moveToIndex(nextIndex);
        if (typeof updateDots === 'function') updateDots(tgt);
    };

    prev?.addEventListener('click', () => step(-1));
    next?.addEventListener('click', () => step(1));

    let startX = 0;
    let scrollStart = 0;
    let isDown = false;

    const onPointerDown = evt => {
        isDown = true;
        startX = evt.pageX || evt.touches?.[0]?.pageX || 0;
        scrollStart = track.scrollLeft;
    };

    const onPointerMove = evt => {
        if (!isDown) return;
        if (evt.cancelable) evt.preventDefault();
        const currentX = evt.pageX || evt.touches?.[0]?.pageX || 0;
        const delta = currentX - startX;
        track.scrollLeft = scrollStart - delta;
    };

    const stop = () => { isDown = false; };

    track.addEventListener('mousedown', onPointerDown);
    track.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);

    // ----------------- Dots (Gallery) -----------------
    let lastActive = -1;
    function updateDots(activeIdx) {
        if (!dotsContainer) return;
        if (activeIdx === lastActive) return;
        lastActive = activeIdx;
        const dots = Array.from(dotsContainer.querySelectorAll('span'));
        dots.forEach((d, i) => d.classList.toggle('is-active', i === activeIdx));
    }

    if (dotsContainer) {
        // Build dots equal to item count
        dotsContainer.innerHTML = items.map((_, i) => `<span data-idx="${i}"></span>`).join('');
        updateDots(0);
        // Click to jump
        dotsContainer.addEventListener('click', (e) => {
            const target = e.target;
            if (!(target instanceof HTMLElement)) return;
            const idx = target.getAttribute('data-idx');
            if (idx != null) {
                const ti = moveToIndex(parseInt(idx, 10));
                updateDots(ti);
            }
        });
        // Sync active dot on scroll
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => updateDots(getNearestIndex()))
        };
        track.addEventListener('scroll', onScroll, { passive: true });
    }
});

// ------------------------- SEARCH OVERLAY -------------------------
const searchOverlay = document.getElementById('searchOverlay');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const searchToggles = document.querySelectorAll('[data-search-toggle]');

const getRootPrefix = () => (window.location.pathname.includes('/pages/') ? '../' : '');

const searchEntries = (() => {
    const prefix = getRootPrefix();
    return [
        {
            title: 'Home — Hero',
            description: 'The screen is your stage hero section.',
            url: `${prefix}index.html#home`,
            keywords: 'home hero stage screen'
        },
        {
            title: 'Services',
            description: 'Creative services designed to elevate your vision.',
            url: `${prefix}index.html#services`,
            keywords: 'services design illustration photography motion'
        },
        {
            title: 'Projects',
            description: 'Our latest work and case studies.',
            url: `${prefix}pages/projects.html`,
            keywords: 'projects work case studies portfolio'
        },
        {
            title: 'Gallery',
            description: 'Creative snapshots from the studio floor.',
            url: `${prefix}index.html#gallery`,
            keywords: 'gallery visuals snapshots'
        },
        {
            title: 'Team',
            description: 'Meet the team and view studio stats.',
            url: `${prefix}pages/teams.html`,
            keywords: 'team members creatives'
        },
        {
            title: 'Contact',
            description: 'Contact form, schedule, and QR line.',
            url: `${prefix}pages/contact.html`,
            keywords: 'contact email phone line qr'
        }
    ];
})();

const renderResults = query => {
    if (!searchResults) return;
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
        ? searchEntries.filter(entry =>
            entry.title.toLowerCase().includes(normalized) ||
            entry.description.toLowerCase().includes(normalized) ||
            entry.keywords.includes(normalized)
        )
        : searchEntries;

    if (!filtered.length) {
        searchResults.innerHTML = '<li>No matches found.</li>';
        return;
    }

    searchResults.innerHTML = filtered
        .map(item => `
            <li>
                <a href="${item.url}">
                    ${item.title}
                    <span>${item.description}</span>
                </a>
            </li>
        `)
        .join('');
};

const openSearch = () => {
    if (!searchOverlay) return;
    searchOverlay.classList.add('is-open');
    searchOverlay.setAttribute('aria-hidden', 'false');
    renderResults('');
    requestAnimationFrame(() => searchInput?.focus());
};

const closeSearch = () => {
    if (!searchOverlay) return;
    searchOverlay.classList.remove('is-open');
    searchOverlay.setAttribute('aria-hidden', 'true');
    searchInput?.blur();
};

searchToggles.forEach(btn => btn.addEventListener('click', () => {
    if (searchOverlay?.classList.contains('is-open')) {
        closeSearch();
    } else {
        openSearch();
    }
}));

searchOverlay?.addEventListener('click', evt => {
    if (evt.target === searchOverlay) closeSearch();
});

searchResults?.addEventListener('click', evt => {
    if (!(evt.target instanceof Element)) return;
    if (evt.target.closest('a')) closeSearch();
});

document.addEventListener('keydown', evt => {
    if (evt.key === 'Escape') closeSearch();
});

searchInput?.addEventListener('input', evt => {
    renderResults(evt.target.value);
});

// ------------------------- THEME TOGGLE -------------------------
(function initThemeToggle(){
    const btn = document.getElementById('themeToggle');
    const root = document.documentElement;
    const brandImg = document.querySelector('.nav__brand img');
    const apply = (nextTheme) => {
        const theme = nextTheme === 'dark' ? 'dark' : 'light';
        root.setAttribute('data-theme', theme);
        root.style.colorScheme = theme;
        if (btn) btn.setAttribute('aria-pressed', String(theme === 'dark'));
        if (brandImg) {
            const prefix = typeof getRootPrefix === 'function' ? getRootPrefix() : '';
            brandImg.src = theme === 'dark'
                ? `${prefix}assets/images/logo/mocalogoW1.png`
                : `${prefix}assets/images/logo/mocalogoB2.png`;
            brandImg.alt = 'Moca.space logo';
        }
        localStorage.setItem('theme', theme);
    };

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = localStorage.getItem('theme');
    apply(stored || (prefersDark ? 'dark' : 'light'));

    btn?.addEventListener('click', () => {
        const current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        apply(current);
    });
})();

// ------------------------- COUNT-UP (Team Stats) -------------------------
(function initCountUp(){
    const counters = Array.from(document.querySelectorAll('.count-up'));
    if (!counters.length || !('IntersectionObserver' in window)) return;

    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    const animate = (el) => {
        const target = parseInt(el.getAttribute('data-target') || '0', 10);
        const suffix = el.getAttribute('data-suffix') || '';
        const start = 0;
        const duration = 1300;
        let rafId = 0;
        const startedAt = performance.now();
        const tick = (now) => {
            const elapsed = now - startedAt;
            const t = Math.min(1, elapsed / duration);
            const eased = easeOutCubic(t);
            const current = Math.round(start + (target - start) * eased);
            el.textContent = t < 1 ? String(current) : String(target) + suffix;
            if (t < 1) rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        // Store id if we want to cancel in the future
        el._countUpRaf = rafId;
    };

    const obs = new IntersectionObserver((entries, o) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                if (!el.dataset.counted) {
                    animate(el);
                    el.dataset.counted = 'true';
                }
                o.unobserve(el);
            }
        });
    }, { threshold: 0.35 });

    counters.forEach(el => obs.observe(el));
})();

// ------------------------- SCROLL REVEAL -------------------------
(function initScrollReveal(){
    const items = Array.from(document.querySelectorAll('.reveal-up, .reveal-left, .reveal-scale'));
    if (!items.length || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver((entries, o) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                o.unobserve(entry.target);
            }
        });
    }, { threshold: 0.25 });
    items.forEach(el => obs.observe(el));
})();

// ------------------------- HERO TILT -------------------------
(function initHeroTilt(){
    const visual = document.querySelector('.hero__visual');
    const img = visual?.querySelector('img');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!visual || !img || prefersReduced) return;
    const maxRotate = 6; // degrees
    const maxTranslate = 10; // px
    const onMove = (e) => {
        const rect = visual.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;  // 0..1
        const y = (e.clientY - rect.top) / rect.height;  // 0..1
        const rY = (x - 0.5) * maxRotate * 2;
        const rX = -(y - 0.5) * maxRotate * 2;
        const tX = (x - 0.5) * maxTranslate * 2;
        const tY = (y - 0.5) * maxTranslate * 2;
        img.style.transform = `translate(${tX.toFixed(1)}px, ${tY.toFixed(1)}px) rotateX(${rX.toFixed(1)}deg) rotateY(${rY.toFixed(1)}deg)`;
    };
    const reset = () => { img.style.transform = ''; };
    visual.addEventListener('mousemove', onMove);
    visual.addEventListener('mouseleave', reset);
})();

// ------------------------- LIGHTBOX -------------------------
(function initLightbox(){
    if (!ENABLE_LIGHTBOX) return;
    const clickable = Array.from(document.querySelectorAll('[data-lightbox]'));
    if (!clickable.length) return;
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = '<img alt="">';
    document.body.appendChild(overlay);
    const img = overlay.querySelector('img');

    const open = (src, alt='') => {
        img.src = src; img.alt = alt;
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    };
    const close = () => {
        overlay.classList.remove('is-open');
        document.body.style.overflow = '';
        img.src = '';
    };
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    clickable.forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const src = el.getAttribute('data-lightbox') || el.getAttribute('src');
            const alt = el.getAttribute('alt') || '';
            if (src) open(src, alt);
        });
    });
})();
