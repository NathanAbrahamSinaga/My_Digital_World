// js/intro.js - Handles intro sequence and loading

const audioSystem = {
    loadingMusic: null,
    
    init() {
        this.loadingMusic = new Audio('assets/music/train.wav');
        this.loadingMusic.loop = false;
        this.loadingMusic.volume = 1.0; // Set volume awal
    },
    
    playLoadingMusic() {
        if (this.loadingMusic) {
            this.loadingMusic.play().catch(e => console.error("Gagal memutar audio loading:", e));
        }
    },

    // Fungsi baru untuk mengecilkan volume perlahan
    fadeOutMusic(duration = 1000) {
        if (!this.loadingMusic) return;
        
        const fadeAudio = setInterval(() => {
            if (this.loadingMusic.volume > 0.05) {
                this.loadingMusic.volume -= 0.05;
            } else {
                this.loadingMusic.volume = 0;
                this.loadingMusic.pause();
                clearInterval(fadeAudio);
            }
        }, duration / 20); // Interval pembagian waktu
    }
};

audioSystem.init();

function startLoading() {
    const loadingBarFill = document.getElementById('loadingBarFill');
    const transitionOverlay = document.getElementById('transition-overlay');
    
    if (!loadingBarFill) return;
    
    audioSystem.playLoadingMusic();

    let progress = 0;
    // Percepat loading sedikit agar tidak terlalu lama menunggu
    const interval = setInterval(() => {
        progress += 2; // Kecepatan loading
        
        // Update width
        loadingBarFill.style.width = progress + '%';

        // Jika selesai loading
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // 1. Mulai transisi visual (layar jadi gelap)
            if (transitionOverlay) {
                transitionOverlay.classList.add('active');
            }

            // 2. Fade out audio agar halus
            audioSystem.fadeOutMusic(1000);

            // 3. Tunggu transisi selesai (1 detik) baru pindah halaman
            setTimeout(() => {
                // Arahkan ke dialog.html (atau main.html jika Anda ingin langsung)
                // Pastikan path-nya benar
                window.location.href = 'pages/dialog.html'; 
            }, 1000);
        }
    }, 60); // Interval update bar (semakin kecil semakin cepat)
}

window.addEventListener('load', () => {
    const startButton = document.getElementById('start-button');
    const startScreen = document.getElementById('start-screen');
    const loadingScreen = document.getElementById('loadingScreen');

    if (startButton && startScreen && loadingScreen) {
        startButton.addEventListener('click', () => {
            // Efek klik sederhana sebelum loading
            startButton.style.transform = "scale(0.95)";
            setTimeout(() => {
                startScreen.style.opacity = '0'; // Fade out start screen
                startScreen.style.transition = 'opacity 0.5s';
                
                setTimeout(() => {
                    startScreen.style.display = 'none';
                    loadingScreen.style.display = 'flex';
                    loadingScreen.style.opacity = '0';
                    
                    // Fade in loading screen
                    requestAnimationFrame(() => {
                        loadingScreen.style.transition = 'opacity 0.5s';
                        loadingScreen.style.opacity = '1';
                    });
                    
                    startLoading();
                }, 500);
            }, 100);
        }, { once: true });
    }
});