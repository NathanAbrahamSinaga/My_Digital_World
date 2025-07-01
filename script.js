const persistentAudioPlayer = {
    audio: null,
    isInitialized: false,
    startTimesInSeconds: [130, 243, 392, 548],

    updateButtonUI() {
        const musicBtn = document.getElementById('music-toggle-btn');
        if (!musicBtn || !this.audio) return;
        musicBtn.textContent = this.audio.paused ? '🔇' : '🎵';
    },

    initializeOnLoad() {
        if (this.isInitialized) return;
        const startTime = this.getRandomStartTime();
        this.play(startTime);
        this.isInitialized = true;
    },

    getRandomStartTime() {
        return this.startTimesInSeconds[Math.floor(Math.random() * this.startTimesInSeconds.length)];
    },

    play(startTime) {
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
        const basePath = ''; 
        this.audio = new Audio(`${basePath}assets/music/bg.mp3`);
        this.audio.loop = true;
        this.audio.currentTime = startTime;
        this.audio.play().catch(error => {
            console.error("Gagal memutar musik latar:", error);
            if (error.name === 'NotAllowedError') this.showAudioPrompt();
        });
        
        this.audio.addEventListener('timeupdate', () => {
            if (this.audio) sessionStorage.setItem('musicCurrentTime', this.audio.currentTime);
        });
        this.audio.addEventListener('play', () => this.updateButtonUI());
        this.audio.addEventListener('pause', () => this.updateButtonUI());

        this.updateButtonUI();
    },

    showAudioPrompt() {
        if (document.querySelector('.audio-prompt')) return;
        const prompt = document.createElement('div');
        prompt.className = 'audio-prompt';
        prompt.textContent = 'Click anywhere to enable sound.';
        const loadingContent = document.querySelector('.loading-content');
        if (loadingContent) {
            loadingContent.appendChild(prompt);
        } else {
            prompt.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#333; color:#fff; padding:10px; border-radius:5px; z-index:9999;';
            document.body.appendChild(prompt);
        }
        const enableAudio = () => {
            this.audio.play().then(() => prompt.remove()).catch(e => console.error(e));
            window.removeEventListener('click', enableAudio);
            window.removeEventListener('touchstart', enableAudio);
        };
        window.addEventListener('click', enableAudio, { once: true });
        window.addEventListener('touchstart', enableAudio, { once: true });
    }
};

const dialogSequence = [
    "Hey there! Welcome in.",
    "You've just stumbled into my little digital hideout.",
    "Here, I share my favorite music, art, and random thoughts.",
    "Curious to see more? Just tap the blue button to begin."
];

let currentDialogIndex = 0;
let isTyping = false;
let typingTimeout = null; 

const audioSystem = {
    clickSound: null, pixelWipeSound: null, loadingMusic: null, introMusic: null,
    init() {
        const basePath = '';
        this.loadingMusic = new Audio(`${basePath}assets/music/train.wav`);
        this.loadingMusic.loop = false;
        this.introMusic = new Audio(`${basePath}assets/music/tokyo.mp3`);
        this.introMusic.loop = true;
        this.clickSound = { play() { const ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.setValueAtTime(800, ctx.currentTime); g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.1); } };
        this.pixelWipeSound = { play() { const ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); const gain = ctx.createGain(); gain.connect(ctx.destination); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6); const noise = ctx.createBufferSource(); const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate); const data = buffer.getChannelData(0); for (let i = 0; i < data.length; i++) { data[i] = Math.random() * 2 - 1; } noise.buffer = buffer; const bandpass = ctx.createBiquadFilter(); bandpass.type = "bandpass"; bandpass.frequency.setValueAtTime(200, ctx.currentTime); bandpass.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4); bandpass.Q.value = 10; noise.connect(bandpass); bandpass.connect(gain); noise.start(ctx.currentTime); noise.stop(ctx.currentTime + 0.6); } };
    },
    playLoadingMusic() { if (this.loadingMusic) this.loadingMusic.play().catch(e => console.error("Gagal memutar audio loading:", e)); },
    playIntroMusic() { if (this.introMusic) this.introMusic.play().catch(e => console.error("Gagal memutar audio intro:", e)); },
    stopIntroMusic() { if (this.introMusic) { this.introMusic.pause(); this.introMusic.currentTime = 0; } },
    playClick() { if (this.clickSound) this.clickSound.play(); },
    playPixelWipe() { if (this.pixelWipeSound) this.pixelWipeSound.play(); }
};
audioSystem.init();

function startLoading() {
    const loadingBarFill = document.getElementById('loadingBarFill');
    if (!loadingBarFill) return;
    
    audioSystem.playLoadingMusic();
    
    if (audioSystem.loadingMusic) {
        audioSystem.loadingMusic.addEventListener('ended', () => {
            audioSystem.playIntroMusic();
        }, { once: true });
    } else {
        audioSystem.playIntroMusic();
    }

    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                const loadingScreen = document.getElementById('loadingScreen');
                const introContainer = document.getElementById('introContainer');
                if (loadingScreen && introContainer) {
                    loadingScreen.style.display = 'none';
                    introContainer.style.display = 'flex';
                    startIntro();
                }
            }, 500);
        }
        loadingBarFill.style.width = progress + '%';
    }, 100);
}

function typeWriter(element, text, callback) {
    if (isTyping) return;
    isTyping = true;
    element.textContent = '';
    let i = 0;
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i++);
            typingTimeout = setTimeout(type, 50);
        } else {
            isTyping = false;
            typingTimeout = null;
            if (callback) callback();
        }
    }
    type();
}

function finishTyping(element, fullText) {
    if (isTyping && typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
        element.textContent = fullText;
        isTyping = false;
    }
}

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

function triggerPixelTransition(callback) {
    const transitionContainer = document.getElementById('pixel-transition');
    if (!transitionContainer) {
        if (callback) callback();
        return;
    }

    const barCount = 20;
    const animDuration = 400;
    const staggerDelay = 25;

    transitionContainer.innerHTML = '';
    for (let i = 0; i < barCount; i++) {
        const bar = document.createElement('div');
        bar.className = 'pixel-bar';
        bar.style.animationDelay = `${i * staggerDelay}ms`;
        transitionContainer.appendChild(bar);
    }

    transitionContainer.style.display = 'flex';
    transitionContainer.classList.add('animate-in');
    audioSystem.playPixelWipe();

    const totalInDuration = animDuration + (barCount * staggerDelay);

    setTimeout(() => {
        if (callback) callback();

        transitionContainer.classList.remove('animate-in');
        transitionContainer.classList.add('animate-out');
        
        const bars = transitionContainer.querySelectorAll('.pixel-bar');
        bars.forEach((bar, i) => {
            bar.style.animationDelay = `${i * staggerDelay}ms`;
        });

        const totalOutDuration = animDuration + (barCount * staggerDelay);
        setTimeout(() => {
            transitionContainer.style.display = 'none';
            transitionContainer.classList.remove('animate-out');
            transitionContainer.innerHTML = '';
        }, totalOutDuration);

    }, totalInDuration);
}

function skipIntro() {
    const introContainer = document.getElementById('introContainer');
    if (!introContainer || introContainer.style.opacity === '0') return;

    audioSystem.stopIntroMusic();
    if (isTyping && typingTimeout) { clearTimeout(typingTimeout); isTyping = false; }

    introContainer.style.opacity = '0';

    setTimeout(() => {
        introContainer.style.display = 'none';

        triggerPixelTransition(() => {
            const mainApp = document.getElementById('main-app');
            const introVideo = document.getElementById('intro-video-bg');
            const pixelArt = document.querySelector('.pixel-art-elements');

            if (introVideo) introVideo.style.display = 'none';
            document.body.classList.remove('intro-page');
            if (pixelArt) pixelArt.style.display = 'block';
            if (mainApp) mainApp.style.display = 'block';

            initializeAmbientEffects();
            showMainMenu();
            persistentAudioPlayer.initializeOnLoad();
        });
    }, 500);
}

function startIntro() {
    const dialogText = document.getElementById('dialogText'), continueBtn = document.getElementById('continueBtn'), skipBtn = document.getElementById('skipBtn');
    if (!dialogText || !continueBtn || !skipBtn) return;
    function showNextDialog() {
        if (currentDialogIndex < dialogSequence.length) {
            typeWriter(dialogText, dialogSequence[currentDialogIndex], () => {
                if (currentDialogIndex === dialogSequence.length - 1) continueBtn.textContent = "Let's Go!";
            });
            currentDialogIndex++;
        } else {
            skipIntro();
        }
    }
    continueBtn.addEventListener('click', () => {
        audioSystem.playClick();
        if (isTyping) finishTyping(dialogText, dialogSequence[currentDialogIndex - 1]);
        else showNextDialog();
    });
    skipBtn.addEventListener('click', () => { audioSystem.playClick(); skipIntro(); });
    showNextDialog();
}

function showPage(pageName) {
    audioSystem.playClick();
    const mainNav = document.getElementById('mainNav');
    const backBtn = document.getElementById('main-back-btn'); 

    if (mainNav) mainNav.style.display = 'none';
    if (backBtn) backBtn.style.display = 'block'; 

    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));

    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
        if (!targetPage.dataset.loaded) {
            loadPageContent(pageName);
            targetPage.dataset.loaded = 'true';
        }
    }
}

function showMainMenu() {
    audioSystem.playClick();
    const mainNav = document.getElementById('mainNav');
    const backBtn = document.getElementById('main-back-btn');

    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    
    if (mainNav) mainNav.style.display = 'flex';
    if (backBtn) backBtn.style.display = 'none'; 
}

function loadPageContent(pageName) {
    const pathPrefix = 'data/';
    switch(pageName) {
        case 'blog':
            fetchAndRender(`${pathPrefix}blog.json`, document.getElementById('blogPosts'), (post, index) => `
                <div class="blog-post" style="animation-delay: ${(index * 0.2)}s">
                    <h3>${post.judul}</h3><p>${post.isi}</p><div class="blog-date">${post.tanggal}</div>
                </div>`);
            break;
        case 'music':
            fetchAndRender(`${pathPrefix}music.json`, document.getElementById('musicList'), (music, index) => `
                <div class="music-item" style="animation-delay: ${(index * 0.1)}s">
                    <div class="music-info"><div class="music-title">${music.judul}</div><div class="music-artist">${music.artis}</div></div>
                    <button class="play-btn" onclick="playMusic('${music.audio}')">▶ Play</button>
                </div>`);
            break;
        case 'art':
            fetchAndRender(`${pathPrefix}art.json`, document.getElementById('galleryGrid'), (art, index) => `
                <div class="gallery-item" style="animation-delay: ${(index * 0.15)}s">
                    <div class="gallery-img" style="background-image: url(assets/images/${art.gambar}); background-size: cover; background-position: center;">
                        <span style="background: rgba(0,0,0,0.5); color: white; padding: 5px;">${art.judul}</span>
                    </div>
                    <div class="gallery-info"><div class="gallery-title">${art.judul}</div><div class="gallery-desc">${art.deskripsi}</div></div>
                </div>`);
            break;
        case 'about':
            fetch(`${pathPrefix}about.json`)
                .then(res => res.json())
                .then(data => {
                    const container = document.getElementById('aboutContent');
                    if(container) container.innerHTML = `
                        <h2>${data.judul}</h2><p>${data.paragraf1}</p><div class="quote">"${data.kutipan}"</div><p>${data.paragraf2}</p>`;
                }).catch(err => console.error(`Gagal memuat ${pageName}:`, err));
            break;
    }
}

function fetchAndRender(url, container, template) {
    if (!container) return;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            container.innerHTML = data.map(template).join('');
        })
        .catch(error => console.error(`Gagal memuat data dari ${url}:`, error));
}


function playMusic(audioFile) {
    audioSystem.playClick();
    const notification = document.createElement('div');
    notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: rgba(144, 238, 144, 0.9); color: #333; padding: 15px 25px; border: 2px solid #333; border-radius: 8px; font-family: 'Press Start 2P', cursive; font-size: 10px; z-index: 1000; animation: slideIn 0.5s ease-out;`;
    notification.textContent = `🎵 This feature is under development. Playing: ${audioFile}`;
    const style = document.createElement('style');
    style.textContent = `@keyframes slideIn { 0% { transform: translateX(100%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }`;
    document.head.appendChild(style);
    document.body.appendChild(notification);
    setTimeout(() => { notification.remove(); style.remove(); }, 3000);
}

document.addEventListener('keydown', (e) => {
    const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    let konamiCode = (e.target.dataset.konami || "").split(',').filter(Boolean).map(Number);
    konamiCode.push(e.keyCode);
    if (konamiCode.length > konami.length) konamiCode.shift();
    if (konamiCode.join(',') === konami.join(',')) {
        const easter = document.createElement('div');
        easter.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(45deg, #FF69B4, #87CEEB); color: white; padding: 30px; border: 4px solid #333; border-radius: 15px; font-family: 'Press Start 2P', cursive; font-size: 14px; text-align: center; z-index: 3000; box-shadow: 0 0 50px rgba(255, 105, 180, 0.5); animation: rainbow 2s infinite;`;
        
        const buttonStyle = "margin-top: 20px; padding: 10px; border: none; border-radius: 5px; font-family: 'Press Start 2P', cursive; font-size: 8px; cursor: var(--nes-cursor-pointer), auto;";
        easter.innerHTML = `🌟 KONAMI CODE ACTIVATED! 🌟<br><br>Secret Mode: Neon Dreams!<br><button onclick="this.parentElement.remove()" style="${buttonStyle}">Close</button>`;
        
        const rainbowStyle = document.createElement('style');
        rainbowStyle.textContent = `@keyframes rainbow { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }`;
        document.head.appendChild(rainbowStyle);
        document.body.appendChild(easter);
        konamiCode = [];
    }
    e.target.dataset.konami = konamiCode.join(',');
});

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
    for (let i = 0; i < 20; i++) particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, life: Math.random() * 100 + 100, maxLife: Math.random() * 100 + 100 });
    function updateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.life--;
            if (p.life <= 0 || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) particles[i] = { x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, life: Math.random() * 100 + 100, maxLife: Math.random() * 100 + 100 };
            ctx.save(); ctx.globalAlpha = (p.life / p.maxLife) * 0.3; ctx.fillStyle = '#87CEEB'; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        });
        requestAnimationFrame(updateParticles);
    }
    updateParticles();
    window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
}

function initializeAmbientEffects() {
    if (document.querySelector('.leaf-container') || document.querySelector('canvas.ambient-particles')) return;
    createLeaves();
    setTimeout(createParticles, 1000);
}

window.addEventListener('load', () => {
    const startButton = document.getElementById('start-button');
    const startScreen = document.getElementById('start-screen');
    const loadingScreen = document.getElementById('loadingScreen');
    const musicToggleButton = document.getElementById('music-toggle-btn'); 

    if (startButton && startScreen && loadingScreen) {
        startButton.addEventListener('click', () => {
            startScreen.style.display = 'none';
            loadingScreen.style.display = 'flex';
            startLoading();
        }, { once: true });
    }

    if (musicToggleButton) {
        musicToggleButton.addEventListener('click', () => {
            if (persistentAudioPlayer.audio) {
                if (persistentAudioPlayer.audio.paused) {
                    persistentAudioPlayer.audio.play();
                } else {
                    persistentAudioPlayer.audio.pause();
                }
            }
        });
    }
});