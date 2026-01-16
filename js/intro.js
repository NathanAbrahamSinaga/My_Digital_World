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

    // Daftar semua resource yang perlu di-preload dari halaman selanjutnya
    const resourcesToPreload = [
        // CSS files
        { type: 'css', url: '/css/base.css' },
        { type: 'css', url: '/css/background.css' },
        { type: 'css', url: '/css/intro.css' },
        { type: 'css', url: '/css/layout.css' },
        // JavaScript files
        { type: 'script', url: '/js/theme-effects.js' },
        { type: 'script', url: '/js/dialog.js' },
        // Images & GIFs
        { type: 'image', url: '/assets/images/1.gif' },
        { type: 'image', url: '/assets/images/2.gif' },
        { type: 'image', url: '/assets/images/4.gif' },
        { type: 'image', url: '/assets/images/5.gif' },
        { type: 'image', url: '/assets/images/favicon.ico' },
        // Video
        { type: 'video', url: '/assets/images/intro.mp4' },
        // External resources (fonts sudah di-cache dari index.html)
        { type: 'css', url: 'https://unpkg.com/nes.css@2.3.0/css/nes.min.css' }
    ];

    let loadedCount = 0;
    const totalResources = resourcesToPreload.length;
    
    function updateProgress() {
        loadedCount++;
        const progress = Math.round((loadedCount / totalResources) * 100);
        loadingBarFill.style.width = progress + '%';
        
        if (loadedCount >= totalResources) {
            onLoadingComplete();
        }
    }
    
    function onLoadingComplete() {
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

        // 4. Pindah halaman ke URL bersih (/dialog)
        setTimeout(() => {
            window.location.href = '/dialog'; // UPDATE: URL bersih
        }, 1400); 
    }
    
    // Preload semua resource
    resourcesToPreload.forEach(resource => {
        switch (resource.type) {
            case 'image':
                const img = new Image();
                img.onload = updateProgress;
                img.onerror = updateProgress; // Tetap lanjut meski error
                img.src = resource.url;
                break;
                
            case 'css':
                fetch(resource.url, { mode: 'cors' })
                    .then(() => updateProgress())
                    .catch(() => updateProgress());
                break;
                
            case 'script':
                fetch(resource.url)
                    .then(() => updateProgress())
                    .catch(() => updateProgress());
                break;
                
            case 'video':
                const video = document.createElement('video');
                video.preload = 'auto';
                video.oncanplaythrough = updateProgress;
                video.onerror = updateProgress;
                video.src = resource.url;
                video.load();
                // Fallback timeout untuk video (5 detik max)
                setTimeout(() => {
                    if (loadedCount < totalResources) {
                        updateProgress();
                    }
                }, 5000);
                break;
                
            default:
                updateProgress();
        }
    });
    
    // Fallback: jika loading terlalu lama (15 detik), paksa selesai
    setTimeout(() => {
        if (loadedCount < totalResources) {
            loadedCount = totalResources - 1;
            updateProgress();
        }
    }, 15000);
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