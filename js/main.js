// pjs/main.js - Main application logic
// Import utilities
// UPDATE: BasePath jadi root absolute
const basePath = '/';

// Audio System
const audioSystem = {
    clickSound: null,
    pixelWipeSound: null,
    rainSound: null,
    sunnyAndFallMusic: null,
    snowMusic: null,
    nightMusic: null,
    
    init() {
        this.rainSound = new Audio(`${basePath}assets/music/rain.mp3`);
        this.rainSound.loop = true;
        this.sunnyAndFallMusic = new Audio(`${basePath}assets/music/sunnyAndFall.mp3`);
        this.sunnyAndFallMusic.loop = true;
        this.snowMusic = new Audio(`${basePath}assets/music/snow.mp3`);
        this.snowMusic.loop = true;
        this.nightMusic = new Audio(`${basePath}assets/music/night.mp3`);
        this.nightMusic.loop = true;
        
        this.clickSound = {
            play() {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                if (ctx.state === 'suspended') ctx.resume();
                const o = ctx.createOscillator(), g = ctx.createGain();
                o.connect(g);
                g.connect(ctx.destination);
                o.frequency.setValueAtTime(800, ctx.currentTime);
                g.gain.setValueAtTime(0.1, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                o.start(ctx.currentTime);
                o.stop(ctx.currentTime + 0.1);
            }
        };
        
        this.pixelWipeSound = {
            play() {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                if (ctx.state === 'suspended') ctx.resume();
                const gain = ctx.createGain();
                gain.connect(ctx.destination);
                gain.gain.setValueAtTime(0.4, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
                const noise = ctx.createBufferSource();
                const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < data.length; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                noise.buffer = buffer;
                const bandpass = ctx.createBiquadFilter();
                bandpass.type = "bandpass";
                bandpass.frequency.setValueAtTime(200, ctx.currentTime);
                bandpass.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4);
                bandpass.Q.value = 10;
                noise.connect(bandpass);
                bandpass.connect(gain);
                noise.start(ctx.currentTime);
                noise.stop(ctx.currentTime + 0.6);
            }
        };
    },
    
    stopAllThemeSounds() {
        this.rainSound.pause();
        this.sunnyAndFallMusic.pause();
        this.snowMusic.pause();
        this.nightMusic.pause();
    },
    
    playClick() {
        if (this.clickSound) this.clickSound.play();
    },
    
    playPixelWipe() {
        if (this.pixelWipeSound) this.pixelWipeSound.play();
    }
};

audioSystem.init();

// Persistent Audio Player
const persistentAudioPlayer = {
    audio: null,
    isInitialized: false,
    startTimesInSeconds: [130, 243, 392, 548],

    updateButtonUI() {
        const musicBtn = document.getElementById('music-toggle-btn');
        if (!musicBtn || !this.audio) return;
        
        const playIcon = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
        
        const muteIcon = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';

        if (this.audio.paused) {
            musicBtn.innerHTML = muteIcon;
            musicBtn.classList.add('muted');
        } else {
            musicBtn.innerHTML = playIcon;
            musicBtn.classList.remove('muted');
        }
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
        prompt.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#333; color:#fff; padding:10px; border-radius:5px; z-index:9999;';
        document.body.appendChild(prompt);
        
        const enableAudio = () => {
            this.audio.play().then(() => prompt.remove()).catch(e => console.error(e));
            window.removeEventListener('click', enableAudio);
            window.removeEventListener('touchstart', enableAudio);
        };
        window.addEventListener('click', enableAudio, { once: true });
        window.addEventListener('touchstart', enableAudio, { once: true });
    }
};

// Global variables
let backgroundMusicPausedForPlayer = false;
let activePlayer = null;
let currentMascotElement = null;
let activeThemeAudio = null;
let airplaneIntervalId = null;

// Import theme and effects handlers
const THEMES = ['normal', 'rainy', 'autumn', 'night', 'snowy'];
let currentThemeIndex = 0;

// Initialize on load
window.addEventListener('load', () => {
    // Show pixel art elements
    const pixelArt = document.querySelector('.pixel-art-elements');
    if (pixelArt) {
        pixelArt.style.display = 'block';
    }
    
    // Show main menu immediately
    showMainMenu();
    
    // Initialize ambient effects
    initializeAmbientEffects();
    
    // Initialize music
    persistentAudioPlayer.initializeOnLoad();
    
    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    const musicToggleButton = document.getElementById('music-toggle-btn');
    const themeToggleButton = document.getElementById('theme-toggle-btn');
    
    if (musicToggleButton) {
        musicToggleButton.addEventListener('click', () => {
            audioSystem.playClick();
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
    
    // Image modal
    const modal = document.getElementById('image-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    if (modal && closeModalBtn) {
        const closeModal = () => modal.classList.remove('show');
        
        closeModalBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape" && modal.classList.contains('show')) {
                closeModal();
            }
        });
    }
    
    // Konami code easter egg
    setupKonamiCode();
}

function setupKonamiCode() {
    const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    let konamiCode = [];
    
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.keyCode);
        if (konamiCode.length > konami.length) konamiCode.shift();
        
        if (konamiCode.join(',') === konami.join(',')) {
            const easter = document.createElement('div');
            easter.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(45deg, #FF69B4, #87CEEB); color: white; padding: 30px; border: 4px solid #333; border-radius: 15px; font-family: 'Press Start 2P', cursive; font-size: 14px; text-align: center; z-index: 3000; box-shadow: 0 0 50px rgba(255, 105, 180, 0.5); animation: rainbow 2s infinite;`;
            
            const buttonStyle = "margin-top: 20px; padding: 10px; border: none; border-radius: 5px; font-family: 'Press Start 2P', cursive; font-size: 8px; cursor: pointer;";
            easter.innerHTML = `🌟 KONAMI CODE ACTIVATED! 🌟<br><br>Secret Mode: Neon Dreams!<br><button onclick="this.parentElement.remove()" style="${buttonStyle}">Close</button>`;
            
            const rainbowStyle = document.createElement('style');
            rainbowStyle.textContent = `@keyframes rainbow { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }`;
            document.head.appendChild(rainbowStyle);
            document.body.appendChild(easter);
            konamiCode = [];
        }
    });
}

function goToZootopia() {
    audioSystem.playClick();
    
    if (persistentAudioPlayer.audio) {
        sessionStorage.setItem('musicCurrentTime', persistentAudioPlayer.audio.currentTime);
    }
    
    window.location.href = '/zootopia';
}