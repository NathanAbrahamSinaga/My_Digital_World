function skipIntro() {
    const introContainer = document.getElementById('introContainer');
    const mainApp = document.getElementById('main-app');
    const mouth = document.querySelector('.mouth');
    if (!introContainer || !mainApp || introContainer.style.opacity === '0') return;


    if (isTyping && typingTimeout) { clearTimeout(typingTimeout); isTyping = false; }
    if (mouth) mouth.classList.remove('talking');

    introContainer.style.opacity = '0';

    setTimeout(() => {
        introContainer.style.display = 'none';

        triggerBlurTransition(
            () => {
                audioSystem.stopIntroMusic(); 

                const introVideo = document.getElementById('intro-video-bg');
                const pixelArt = document.querySelector('.pixel-art-elements');

                if (introVideo) introVideo.style.display = 'none';
                document.body.classList.remove('intro-page');
                if (pixelArt) pixelArt.style.display = 'block';
                
                mainApp.style.display = 'block';

                initializeAmbientEffects();
                showMainMenu();
                persistentAudioPlayer.initializeOnLoad();
            },
            () => {
                mainApp.style.opacity = '1';
            }
        );
    }, 500);
}

let backgroundMusicPausedForPlayer = false;

const THEMES = ['normal', 'rainy', 'autumn', 'night', 'snowy'];
let currentThemeIndex = 0;

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
let airplaneIntervalId = null;
let activePlayer = null;
let currentMascotElement = null;
let activeThemeAudio = null;

const audioSystem = {
    clickSound: null, pixelWipeSound: null, loadingMusic: null, introMusic: null, rainSound: null,
    sunnyAndFallMusic: null, snowMusic: null, nightMusic: null,
    init() {
        const basePath = '';
        this.loadingMusic = new Audio(`${basePath}assets/music/train.wav`);
        this.loadingMusic.loop = false;
        this.introMusic = new Audio(`${basePath}assets/music/tokyo.mp3`);
        this.introMusic.loop = true;
        this.rainSound = new Audio(`${basePath}assets/music/rain.mp3`);
        this.rainSound.loop = true;
        this.sunnyAndFallMusic = new Audio(`${basePath}assets/music/sunnyAndFall.mp3`);
        this.sunnyAndFallMusic.loop = true;
        this.snowMusic = new Audio(`${basePath}assets/music/snow.mp3`);
        this.snowMusic.loop = true;
        this.nightMusic = new Audio(`${basePath}assets/music/night.mp3`);
        this.nightMusic.loop = true;
        this.clickSound = { play() { const ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.setValueAtTime(800, ctx.currentTime); g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.1); } };
        this.pixelWipeSound = { play() { const ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); const gain = ctx.createGain(); gain.connect(ctx.destination); gain.gain.setValueAtTime(0.4, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6); const noise = ctx.createBufferSource(); const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate); const data = buffer.getChannelData(0); for (let i = 0; i < data.length; i++) { data[i] = Math.random() * 2 - 1; } noise.buffer = buffer; const bandpass = ctx.createBiquadFilter(); bandpass.type = "bandpass"; bandpass.frequency.setValueAtTime(200, ctx.currentTime); bandpass.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4); bandpass.Q.value = 10; noise.connect(bandpass); bandpass.connect(gain); noise.start(ctx.currentTime); noise.stop(ctx.currentTime + 0.6); } };
    },
    stopAllThemeSounds() {
        this.rainSound.pause();
        this.sunnyAndFallMusic.pause();
        this.snowMusic.pause();
        this.nightMusic.pause();
    },
    playLoadingMusic() { if (this.loadingMusic) this.loadingMusic.play().catch(e => console.error("Gagal memutar audio loading:", e)); },
    playIntroMusic() { if (this.introMusic) this.introMusic.play().catch(e => console.error("Gagal memutar audio intro:", e)); },
    stopIntroMusic() { if (this.introMusic) { this.introMusic.pause(); this.introMusic.currentTime = 0; } },
    playClick() { if (this.clickSound) this.clickSound.play(); },
    playPixelWipe() { if (this.pixelWipeSound) this.pixelWipeSound.play(); }
};
audioSystem.init();

function triggerBlurTransition(onCovered, onComplete) {
    const transitionEl = document.getElementById('blur-transition');
    if (!transitionEl) {
        if (onCovered) onCovered();
        if (onComplete) onComplete();
        return;
    }

    const animDuration = 600;

    transitionEl.classList.add('active', 'animate-in');
    audioSystem.playPixelWipe();

    setTimeout(() => {
        if (onCovered) {
            onCovered();
        }

        transitionEl.classList.remove('animate-in');
        transitionEl.classList.add('animate-out');

        setTimeout(() => {
            transitionEl.classList.remove('active', 'animate-out');
            if (onComplete) {
                onComplete();
            }
        }, animDuration);

    }, animDuration);
}


function changeTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    const newTheme = THEMES[currentThemeIndex];

    triggerBlurTransition(() => {
        cleanupAmbientEffects();
        applyTheme(newTheme);
    });
}

function cleanupAmbientEffects() {
    THEMES.forEach(theme => {
        if (theme !== 'normal') {
            document.body.classList.remove(`${theme}-weather`);
        }
    });
    audioSystem.stopAllThemeSounds();
    activeThemeAudio = null;
    const leafContainer = document.querySelector('.leaf-container');
    if (leafContainer) leafContainer.remove();
    const rainContainer = document.getElementById('rain-container');
    if (rainContainer) rainContainer.innerHTML = '';
    document.querySelectorAll('.clouds.extra-cloud').forEach(cloud => cloud.remove());
    document.querySelectorAll('.star').forEach(star => star.remove());
    const particleCanvas = document.querySelector('canvas.ambient-particles');
    if (particleCanvas) particleCanvas.remove();
    if (airplaneIntervalId) {
        clearInterval(airplaneIntervalId);
        airplaneIntervalId = null;
    }
    document.querySelectorAll('.airplane-container').forEach(plane => plane.remove());
}

function applyTheme(themeName) {
    const playAudio = (audio) => {
        audio.volume = 0.4;
        audio.play().catch(e => console.error("Gagal memutar audio tema:", e));
        activeThemeAudio = audio;
    };

    switch (themeName) {
        case 'rainy':
            document.body.classList.add('rainy-weather');
            createRain();
            playAudio(audioSystem.rainSound);
            createRainyClouds();
            break;
        case 'autumn':
            document.body.classList.add('autumn-weather');
            createLeaves();
            playAudio(audioSystem.sunnyAndFallMusic);
            setTimeout(createParticles, 1000);
            if (airplaneIntervalId === null) {
                setTimeout(spawnAirplane, Math.random() * 5000 + 2000);
                airplaneIntervalId = setInterval(spawnAirplane, 30000);
            }
            break;
        case 'night':
            document.body.classList.add('night-weather');
            createStars();
            playAudio(audioSystem.nightMusic);
            setTimeout(createParticles, 1000);
            if (airplaneIntervalId === null) {
                setTimeout(spawnAirplane, Math.random() * 15000 + 5000);
                airplaneIntervalId = setInterval(spawnAirplane, 60000);
            }
            break;
        case 'snowy':
            document.body.classList.add('snowy-weather');
            createSnow();
            playAudio(audioSystem.snowMusic);
            createRainyClouds();
            break;
        case 'normal':
        default:
            createLeaves();
            playAudio(audioSystem.sunnyAndFallMusic);
            setTimeout(createParticles, 1000);
            if (airplaneIntervalId === null) {
                setTimeout(spawnAirplane, Math.random() * 5000 + 2000);
                airplaneIntervalId = setInterval(spawnAirplane, 30000);
            }
            break;
    }
}

function initializeAmbientEffects() {
    if (document.body.dataset.effectsInitialized) return;
    currentThemeIndex = Math.floor(Math.random() * THEMES.length);
    const initialTheme = THEMES[currentThemeIndex];
    applyTheme(initialTheme);
    document.body.dataset.effectsInitialized = 'true';
}

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
    const mouth = document.querySelector('.mouth');
    if (mouth) mouth.classList.add('talking');
    let i = 0;
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i++);
            typingTimeout = setTimeout(type, 50);
        } else {
            isTyping = false;
            typingTimeout = null;
            if (mouth) mouth.classList.remove('talking');
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
        const mouth = document.querySelector('.mouth');
        if (mouth) mouth.classList.remove('talking');
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

function spawnAirplane() {
    if (document.body.classList.contains('rainy-weather') || document.body.classList.contains('snowy-weather') || document.querySelector('.airplane-container')) {
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

function startIntro() {
    const dialogText = document.getElementById('dialogText'), continueBtn = document.getElementById('continueBtn'), skipBtn = document.getElementById('skipBtn');
    if (!dialogText || !continueBtn || !skipBtn) return;
    function showNextDialog() {
        if (currentDialogIndex < dialogSequence.length) {
            typeWriter(dialogText, dialogSequence[currentDialogIndex], () => {
                if (currentDialogIndex === dialogSequence.length) {
                    continueBtn.textContent = "Let's Go!";
                }
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
        if (pageName === 'music') {
            showMascot();
        } else {
            hideMascot();
        }
        if (!targetPage.dataset.loaded) {
            loadPageContent(pageName);
            targetPage.dataset.loaded = 'true';
        }
    }
}

function showMascot() {
    if (currentMascotElement) return;

    const mascot = document.createElement('img');
    mascot.src = 'assets/images/miku.gif';
    mascot.className = 'music-mascot';

    const mainAppContainer = document.getElementById('main-app');
    (mainAppContainer || document.body).appendChild(mascot);

    const direction = Math.random() > 0.5 ? 'left' : 'right';
    mascot.classList.add(direction === 'left' ? 'enter-from-left' : 'enter-from-right');
    
    mascot.addEventListener('animationend', (e) => {
        if (e.animationName === 'slideAndFadeIn' && !mascot.classList.contains('is-exiting')) {
            mascot.classList.add('is-floating');
        }
    }, { once: true });
    
    currentMascotElement = mascot;
}

function hideMascot() {
    if (!currentMascotElement || currentMascotElement.classList.contains('is-exiting')) return;

    currentMascotElement.classList.remove('is-floating');
    currentMascotElement.classList.add('is-exiting');

    currentMascotElement.addEventListener('animationend', (e) => {
        if (e.animationName === 'shrinkAndFadeOut') {
           if (e.currentTarget) e.currentTarget.remove();
           if (e.currentTarget === currentMascotElement) {
               currentMascotElement = null;
           }
        }
    }, { once: true });
}

function closePlayerUI(playerItem) {
    if (!playerItem) return;
    const playerContainer = playerItem.querySelector('.player-container');
    const playBtn = playerItem.querySelector('.play-btn');

    playerItem.classList.remove('playing');
    if (playBtn) {
        playBtn.classList.remove('playing');
        playBtn.innerHTML = '▶ Play';
    }

    if (playerContainer) {
        playerContainer.innerHTML = '';
    }
}

function showMainMenu() {
    audioSystem.playClick();
    const mainNav = document.getElementById('mainNav');
    const backBtn = document.getElementById('main-back-btn');
    
    if(activePlayer) {
        closePlayerUI(activePlayer);
        activePlayer = null;
    }
    
    hideMascot();

    if (backgroundMusicPausedForPlayer) {
        if (persistentAudioPlayer.audio) {
            persistentAudioPlayer.audio.play().catch(e => console.error("Gagal melanjutkan musik latar:", e));
        }
        backgroundMusicPausedForPlayer = false;
    }
    if (activeThemeAudio && activeThemeAudio.paused) {
        activeThemeAudio.play().catch(e => console.error("Gagal melanjutkan audio tema:", e));
    }
    
    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    
    if (mainNav) mainNav.style.display = 'flex';
    if (backBtn) backBtn.style.display = 'none'; 
}

function loadPageContent(pageName) {
    const pathPrefix = 'data/';
    switch(pageName) {
        case 'blog':
            fetchAndRender(`${pathPrefix}blog.json`, document.getElementById('blogPosts'), (post, index) => `
                <div class="blog-post" style="animation-delay: ${(index * 0.1)}s">
                    <h3>${post.judul}</h3>
                    <div class="blog-post-content">${post.isi}</div>
                    <div class="blog-date">${post.tanggal}</div>
                </div>`);
            break;
        case 'music':
            const leftCol = document.getElementById('musicListLeft');
            const rightCol = document.getElementById('musicListRight');
            if (!leftCol || !rightCol) return;

            fetch(`${pathPrefix}music.json`)
                .then(res => res.json())
                .then(data => {
                    let leftHTML = '';
                    let rightHTML = '';
                    data.forEach((music, index) => {
                        const itemHTML = `
                            <div class="music-item" style="animation-delay: ${(index * 0.1)}s">
                                <div class="music-item-header">
                                    <div class="music-info">
                                        <div class="music-title">${music.judul}</div>
                                        <div class="music-artist">${music.artis}</div>
                                    </div>
                                    ${music.type !== 'none' ? `<button class="play-btn" onclick="playMusic(this, '${music.type}', '${music.id}')">▶ Play</button>` : ''}
                                </div>
                                <div class="player-container"></div>
                            </div>`;
                        if (index % 2 === 0) {
                            leftHTML += itemHTML;
                        } else {
                            rightHTML += itemHTML;
                        }
                    });
                    leftCol.innerHTML = leftHTML;
                    rightCol.innerHTML = rightHTML;
                })
                .catch(err => console.error(`Gagal memuat ${pageName}:`, err));
            break;
        case 'art':
            fetchAndRender(`${pathPrefix}art.json`, document.getElementById('galleryGrid'), (art, index) => {
                if (!art.gambar) return '';
                const hasInfo = art.judul || art.deskripsi;
                return `
                    <div class="gallery-item" style="animation-delay: ${(index * 0.15)}s" onclick="openImageModal('assets/images/${art.gambar}')">
                        <div class="gallery-img" style="background-image: url(assets/images/${art.gambar}); background-size: cover; background-position: center;">
                        </div>
                        ${hasInfo ? `
                        <div class="gallery-info">
                            ${art.judul ? `<div class="gallery-title">${art.judul}</div>` : ''}
                            ${art.deskripsi ? `<div class="gallery-desc">${art.deskripsi}</div>` : ''}
                        </div>` : ''}
                    </div>`;
            });
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

function playMusic(btnElement, type, id) {
    audioSystem.playClick();
    const thisMusicItem = btnElement.closest('.music-item');

    const isCurrentlyPlaying = thisMusicItem.classList.contains('playing');

    if (activePlayer && activePlayer !== thisMusicItem) {
        closePlayerUI(activePlayer);
    }

    if (isCurrentlyPlaying) {
        closePlayerUI(thisMusicItem);
        activePlayer = null;
        if (backgroundMusicPausedForPlayer) {
            persistentAudioPlayer.audio?.play().catch(e => console.error("Gagal melanjutkan musik latar:", e));
            backgroundMusicPausedForPlayer = false;
        }
        if (activeThemeAudio && activeThemeAudio.paused) {
            activeThemeAudio.play().catch(e => console.error("Gagal melanjutkan audio tema:", e));
        }
    } else {
        if (persistentAudioPlayer.audio && !persistentAudioPlayer.audio.paused) {
            persistentAudioPlayer.audio.pause();
            backgroundMusicPausedForPlayer = true;
        }
        if (activeThemeAudio) {
            activeThemeAudio.pause();
        }

        const playerContainer = thisMusicItem.querySelector('.player-container');
        thisMusicItem.classList.add('playing');
        btnElement.classList.add('playing');
        btnElement.innerHTML = '■ Stop';
        activePlayer = thisMusicItem;
        
        let embedHtml = '';
        switch (type) {
            case 'mp3':
                embedHtml = `<audio controls autoplay src="${id}"></audio>`;
                break;
            case 'youtube':
                embedHtml = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                break;
            case 'spotify':
                embedHtml = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/${id}?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
                break;
        }
        playerContainer.innerHTML = embedHtml;
    }
}

function openImageModal(src) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    if (!modal || !modalImg) return;
    
    modal.classList.add('show');
    modalImg.src = src;
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
    
    const particleColor = document.body.classList.contains('night-weather') ? '#f3c623' : '#87CEEB';

    for (let i = 0; i < 20; i++) particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, life: Math.random() * 100 + 100, maxLife: Math.random() * 100 + 100 });
    function updateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.life--;
            if (p.life <= 0 || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) particles[i] = { x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, life: Math.random() * 100 + 100, maxLife: Math.random() * 100 + 100 };
            ctx.save(); ctx.globalAlpha = (p.life / p.maxLife) * 0.3; ctx.fillStyle = particleColor; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        });
        requestAnimationFrame(updateParticles);
    }
    updateParticles();
    window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
}

window.addEventListener('load', () => {
    const startButton = document.getElementById('start-button');
    const startScreen = document.getElementById('start-screen');
    const loadingScreen = document.getElementById('loadingScreen');
    const musicToggleButton = document.getElementById('music-toggle-btn');
    const themeToggleButton = document.getElementById('theme-toggle-btn');

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

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            audioSystem.playClick();
            changeTheme();
        });
    }

    const modal = document.getElementById('image-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    if (modal && closeModalBtn) {
        const closeModal = () => modal.classList.remove('show');
        
        closeModalBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape" && modal.classList.contains('show')) {
                closeModal();
            }
        });
    }
});