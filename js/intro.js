// intro.js - Handles intro sequence and loading

const audioSystem = {
    loadingMusic: null,
    
    init() {
        this.loadingMusic = new Audio('assets/music/train.wav');
        this.loadingMusic.loop = false;
        this.loadingMusic.volume = 1.0; // Volume awal
    },
    
    playLoadingMusic() {
        if (this.loadingMusic) {
            this.loadingMusic.play().catch(e => console.error("Gagal memutar audio loading:", e));
        }
    },

    // Fungsi baru untuk mengecilkan volume secara halus (Fade Out)
    fadeOutMusic(duration = 1000) {
        if (!this.loadingMusic) return;
        
        const originalVolume = this.loadingMusic.volume;
        const steps = 20; // Jumlah langkah penurunan volume
        const stepTime = duration / steps;
        const volStep = originalVolume / steps;

        const fadeInterval = setInterval(() => {
            if (this.loadingMusic.volume > volStep) {
                this.loadingMusic.volume -= volStep;
            } else {
                this.loadingMusic.volume = 0;
                this.loadingMusic.pause();
                clearInterval(fadeInterval);
            }
        }, stepTime);
    }
};

audioSystem.init();

function startLoading() {
    const loadingBarFill = document.getElementById('loadingBarFill');
    const loadingScreen = document.getElementById('loadingScreen');
    const overlay = document.getElementById('transition-overlay');

    if (!loadingBarFill) return;
    
    audioSystem.playLoadingMusic();

    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // --- MULAI TRANSISI ---
            
            // 1. Fade out musik kereta
            audioSystem.fadeOutMusic(1200);

            // 2. Efek blur/zoom pada konten loading
            if (loadingScreen) {
                loadingScreen.classList.add('exiting');
            }

            // 3. Layar menggelap (Fade to Black)
            if (overlay) {
                setTimeout(() => {
                    overlay.classList.add('active');
                }, 200);
            }

            // 4. Pindah halaman (ke DIALOG agar percakapan tetap ada)
            setTimeout(() => {
                window.location.href = 'pages/dialog.html';
            }, 1400); // Waktu total transisi selesai
        }
        loadingBarFill.style.width = progress + '%';
    }, 100);
}

window.addEventListener('load', () => {
    const startButton = document.getElementById('start-button');
    const startScreen = document.getElementById('start-screen');
    const loadingScreen = document.getElementById('loadingScreen');

    if (startButton && startScreen && loadingScreen) {
        startButton.addEventListener('click', () => {
            // Efek fade out start screen
            startScreen.style.opacity = '0';
            
            setTimeout(() => {
                startScreen.style.display = 'none';
                
                // Fade in loading screen
                loadingScreen.style.display = 'flex';
                // Trigger reflow
                void loadingScreen.offsetWidth;
                loadingScreen.style.opacity = '1';
                
                startLoading();
            }, 800);
        }, { once: true });
    }
});