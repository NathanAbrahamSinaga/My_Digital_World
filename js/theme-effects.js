// theme-effects.js - Theme changes, ambient effects, and Page Transitions

// --- NEW: Page Transition Logic ---

// 1. Fungsi dipanggil saat halaman baru selesai dimuat (Fade In)
function initializePageTransition() {
    const transitionOverlay = document.getElementById('page-transition-overlay');
    if (transitionOverlay) {
        // Beri sedikit delay agar browser merender overlay hitam dulu
        setTimeout(() => {
            transitionOverlay.classList.remove('active');
        }, 100);
    }
}

// 2. Fungsi dipanggil saat user klik link pindah halaman (Fade Out -> Pindah)
function handlePageNavigation(targetUrl) {
    const transitionOverlay = document.getElementById('page-transition-overlay');
    
    // Mainkan sound effect jika ada
    if (typeof audioSystem !== 'undefined') {
        audioSystem.playPixelWipe();
    }

    if (transitionOverlay) {
        // Aktifkan overlay hitam (Fade Out content)
        transitionOverlay.classList.add('active');
        
        // Tunggu animasi CSS selesai (800ms sesuai CSS layout.css)
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 800);
    } else {
        // Fallback jika overlay tidak ada
        window.location.href = targetUrl;
    }
}

// --- Existing Theme Logic ---

function triggerBlurTransition(onCovered, onComplete) {
    const transitionEl = document.getElementById('blur-transition');
    if (!transitionEl) {
        if (onCovered) onCovered();
        if (onComplete) onComplete();
        return;
    }

    const animDuration = 600;

    transitionEl.classList.add('active', 'animate-in');
    if (typeof audioSystem !== 'undefined') {
        audioSystem.playPixelWipe();
    }

    setTimeout(() => {
        if (onCovered) onCovered();

        transitionEl.classList.remove('animate-in');
        transitionEl.classList.add('animate-out');

        setTimeout(() => {
            transitionEl.classList.remove('active', 'animate-out');
            if (onComplete) onComplete();
        }, animDuration);

    }, animDuration);
}

function changeTheme() {
    if (typeof currentThemeIndex === 'undefined') window.currentThemeIndex = 0;
    if (typeof THEMES === 'undefined') return;
    
    currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    const newTheme = THEMES[currentThemeIndex];

    triggerBlurTransition(() => {
        cleanupAmbientEffects();
        applyTheme(newTheme);
    });
}

function cleanupAmbientEffects() {
    if (typeof THEMES === 'undefined') return;
    
    THEMES.forEach(theme => {
        if (theme !== 'normal') {
            document.body.classList.remove(`${theme}-weather`);
        }
    });
    
    if (typeof audioSystem !== 'undefined') {
        audioSystem.stopAllThemeSounds();
    }
    
    if (typeof activeThemeAudio !== 'undefined') {
        activeThemeAudio = null;
    }
    
    const leafContainer = document.querySelector('.leaf-container');
    if (leafContainer) leafContainer.remove();
    
    const rainContainer = document.getElementById('rain-container');
    if (rainContainer) rainContainer.innerHTML = '';
    
    document.querySelectorAll('.clouds.extra-cloud').forEach(cloud => cloud.remove());
    document.querySelectorAll('.star').forEach(star => star.remove());
    
    const particleCanvas = document.querySelector('canvas.ambient-particles');
    if (particleCanvas) particleCanvas.remove();
    
    if (typeof airplaneIntervalId !== 'undefined' && airplaneIntervalId) {
        clearInterval(airplaneIntervalId);
        airplaneIntervalId = null;
    }
    
    document.querySelectorAll('.airplane-container').forEach(plane => plane.remove());
}

function applyTheme(themeName) {
    const playAudio = (audio) => {
        audio.volume = 0.4;
        audio.play().catch(e => console.error("Gagal memutar audio tema:", e));
        if (typeof window.activeThemeAudio !== 'undefined') {
            window.activeThemeAudio = audio;
        }
    };

    switch (themeName) {
        case 'rainy':
            document.body.classList.add('rainy-weather');
            createRain();
            if (typeof audioSystem !== 'undefined') {
                playAudio(audioSystem.rainSound);
            }
            createRainyClouds();
            break;
        case 'autumn':
            document.body.classList.add('autumn-weather');
            createLeaves();
            if (typeof audioSystem !== 'undefined') {
                playAudio(audioSystem.sunnyAndFallMusic);
            }
            setTimeout(createParticles, 1000);
            startAirplaneSpawning();
            break;
        case 'night':
            document.body.classList.add('night-weather');
            createStars();
            if (typeof audioSystem !== 'undefined') {
                playAudio(audioSystem.nightMusic);
            }
            setTimeout(createParticles, 1000);
            startAirplaneSpawning(60000);
            break;
        case 'snowy':
            document.body.classList.add('snowy-weather');
            createSnow();
            if (typeof audioSystem !== 'undefined') {
                playAudio(audioSystem.snowMusic);
            }
            createRainyClouds();
            break;
        case 'normal':
        default:
            createLeaves();
            if (typeof audioSystem !== 'undefined') {
                playAudio(audioSystem.sunnyAndFallMusic);
            }
            setTimeout(createParticles, 1000);
            startAirplaneSpawning();
            break;
    }
}

function initializeAmbientEffects() {
    if (document.body.dataset.effectsInitialized) return;
    if (typeof THEMES === 'undefined') return;
    
    if (typeof window.currentThemeIndex === 'undefined') {
        window.currentThemeIndex = Math.floor(Math.random() * THEMES.length);
    }
    
    const initialTheme = THEMES[window.currentThemeIndex];
    applyTheme(initialTheme);
    document.body.dataset.effectsInitialized = 'true';
}

function startAirplaneSpawning(interval = 30000) {
    if (typeof airplaneIntervalId !== 'undefined' && airplaneIntervalId === null) {
        setTimeout(spawnAirplane, Math.random() * 5000 + 2000);
        airplaneIntervalId = setInterval(spawnAirplane, interval);
    }
}

// Ambient effect creators
function createLeaves() {
    if (document.querySelector('.leaf-container')) return;
    const container = document.createElement('div');
    container.className = 'leaf-container';
    container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 2;';
    document.body.prepend(container);
    setInterval(() => {
        const leaf = document.createElement('div');
        leaf.className = 'leaf';
        leaf.style.left = Math.random() * 100 + 'vw';
        leaf.style.animationDelay = Math.random() * 2 + 's';
        leaf.style.animationDuration = (Math.random() * 3 + 5) + 's';
        container.appendChild(leaf);
        setTimeout(() => leaf.remove(), 8000);
    }, 2000);
}

function createRain() {
    const rainContainer = document.getElementById('rain-container');
    if (!rainContainer) return;
    
    let rainHTML = '';
    for (let i = 0; i < 100; i++) {
        const left = Math.floor(Math.random() * 100);
        const duration = Math.random() * 0.5 + 0.3;
        const delay = Math.random() * 5;
        rainHTML += `<div class="raindrop" style="left: ${left}vw; animation-duration: ${duration}s; animation-delay: ${delay}s;"></div>`;
    }
    rainContainer.innerHTML = rainHTML;
}

function createSnow() {
    const snowContainer = document.getElementById('rain-container');
    if (!snowContainer) return;
    
    let snowHTML = '';
    for (let i = 0; i < 150; i++) {
        const left = Math.random() * 100;
        const duration = Math.random() * 5 + 5;
        const delay = Math.random() * 10;
        const size = Math.random() * 3 + 1;
        const opacity = Math.random() * 0.5 + 0.3;
        snowHTML += `<div class="snowflake" style="left: ${left}vw; width: ${size}px; height: ${size}px; opacity: ${opacity}; animation-duration: ${duration}s; animation-delay: ${delay}s;"></div>`;
    }
    snowContainer.innerHTML = snowHTML;
}

function createStars() {
    const starContainer = document.querySelector('.bg-container');
    if (!starContainer || document.querySelector('.star')) return;

    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 2}s`;
        star.style.animationDuration = `${Math.random() * 1 + 1.5}s`;
        starContainer.appendChild(star);
    }
}

function createRainyClouds() {
    const bgContainer = document.querySelector('.bg-container');
    if (!bgContainer) return;

    const numberOfClouds = 8 + Math.floor(Math.random() * 5);

    for (let i = 0; i < numberOfClouds; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'clouds extra-cloud';

        const top = Math.random() * 40;
        const scale = 0.7 + Math.random() * 0.8;
        const duration = 30 + Math.random() * 40;
        const delay = Math.random() * -50;
        const opacity = 0.6 + Math.random() * 0.3;

        cloud.style.top = `${top}%`;
        cloud.style.transform = `scale(${scale})`;
        cloud.style.animationDuration = `${duration}s`;
        cloud.style.animationDelay = `${delay}s`;
        cloud.style.opacity = opacity;

        bgContainer.appendChild(cloud);
    }
}

function createParticles() {
    if (document.querySelector('canvas.ambient-particles')) return;
    const particles = [];
    const canvas = document.createElement('canvas');
    canvas.className = 'ambient-particles';
    const ctx = canvas.getContext('2d');
    canvas.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;`;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    
    const particleColor = document.body.classList.contains('night-weather') ? '#f3c623' : '#87CEEB';

    for (let i = 0; i < 20; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            life: Math.random() * 100 + 100,
            maxLife: Math.random() * 100 + 100
        });
    }
    
    function updateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0 || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
                particles[i] = {
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    life: Math.random() * 100 + 100,
                    maxLife: Math.random() * 100 + 100
                };
            }
            ctx.save();
            ctx.globalAlpha = (p.life / p.maxLife) * 0.3;
            ctx.fillStyle = particleColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        requestAnimationFrame(updateParticles);
    }
    updateParticles();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

function spawnAirplane() {
    if (document.body.classList.contains('rainy-weather') || 
        document.body.classList.contains('snowy-weather') || 
        document.querySelector('.airplane-container')) {
        return;
    }

    const container = document.querySelector('.pixel-art-elements');
    if (!container) return;

    const airplaneContainer = document.createElement('div');
    airplaneContainer.className = 'airplane-container';

    const airplaneImg = document.createElement('img');
    const basePath = (window.location.pathname.includes('/pages/')) ? '../' : '';
    airplaneImg.src = `${basePath}assets/images/airplane.png`;
    airplaneImg.alt = 'Pixel art airplane';
    airplaneContainer.appendChild(airplaneImg);

    const topPosition = 5 + Math.random() * 25;
    airplaneContainer.style.top = `${topPosition}%`;

    const direction = Math.random() > 0.5 ? 'left-to-right' : 'right-to-left';
    airplaneContainer.classList.add(`fly-${direction}`);
    
    container.appendChild(airplaneContainer);

    const smokeIntervalId = setInterval(() => {
        if (!document.body.contains(airplaneContainer)) {
            clearInterval(smokeIntervalId);
            return;
        }
        createSmokePuff(airplaneContainer, direction);
    }, 150);

    setTimeout(() => {
        clearInterval(smokeIntervalId);
        airplaneContainer.remove();
    }, 12000);
}

function createSmokePuff(airplaneEl, direction) {
    const container = document.querySelector('.pixel-art-elements');
    if (!container) return;

    const rect = airplaneEl.getBoundingClientRect();
    if (rect.width === 0) return;

    const puff = document.createElement('div');
    puff.className = 'smoke-puff';
    
    const tailOffsetX = direction === 'left-to-right' ? 5 : rect.width - 20;
    const tailOffsetY = (rect.height / 2) + (Math.random() * 6 - 3);

    puff.style.left = `${rect.left + tailOffsetX}px`;
    puff.style.top = `${rect.top + tailOffsetY}px`;

    const size = 5 + Math.random() * 8;
    puff.style.width = `${size}px`;
    puff.style.height = `${size}px`;

    container.appendChild(puff);

    puff.addEventListener('animationend', () => {
        puff.remove();
    });
}