// intro.js - Handles intro sequence and REAL resource preloading

const audioSystem = {
    loadingMusic: null,
    
    init() {
        this.loadingMusic = new Audio('assets/music/train.wav');
        this.loadingMusic.loop = false;
        this.loadingMusic.volume = 1.0;
    },
    
    playLoadingMusic() {
        if (this.loadingMusic) {
            this.loadingMusic.play().catch(e => console.error("Gagal memutar audio loading:", e));
        }
    },

    fadeOutMusic(duration = 1000) {
        if (!this.loadingMusic) return;
        
        const originalVolume = this.loadingMusic.volume;
        const steps = 20;
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

// =====================================================
// REAL RESOURCE PRELOADER
// Memuat semua asset yang dibutuhkan halaman selanjutnya
// =====================================================

const resourcePreloader = {
    // Daftar semua resource yang perlu di-preload
    resources: {
        // CSS files
        css: [
            '/css/base.css',
            '/css/background.css',
            '/css/intro.css',
            '/css/layout.css',
            '/css/components.css',
            '/css/responsive.css'
        ],
        // JavaScript files
        js: [
            '/js/theme-effects.js',
            '/js/dialog.js',
            '/js/page-navigation.js',
            '/js/main.js'
        ],
        // Images (GIF, PNG, etc.)
        images: [
            '/assets/images/1.gif',
            '/assets/images/2.gif',
            '/assets/images/4.gif',
            '/assets/images/5.gif',
            '/assets/images/favicon.ico'
        ],
        // Videos
        videos: [
            '/assets/images/intro.mp4'
        ],
        // External resources (CDN)
        external: [
            'https://unpkg.com/nes.css@2.3.0/css/nes.min.css',
            'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
        ]
    },

    loadedCount: 0,
    totalCount: 0,
    onProgress: null,
    onComplete: null,

    // Calculate total resources to load
    calculateTotal() {
        this.totalCount = 
            this.resources.css.length + 
            this.resources.js.length + 
            this.resources.images.length + 
            this.resources.videos.length +
            this.resources.external.length;
        return this.totalCount;
    },

    // Update progress
    updateProgress() {
        this.loadedCount++;
        const percent = Math.round((this.loadedCount / this.totalCount) * 100);
        if (this.onProgress) {
            this.onProgress(percent, this.loadedCount, this.totalCount);
        }
        
        if (this.loadedCount >= this.totalCount && this.onComplete) {
            this.onComplete();
        }
    },

    // Preload CSS file
    preloadCSS(url) {
        return new Promise((resolve) => {
            // Check if already loaded
            const existingLink = document.querySelector(`link[href="${url}"]`);
            if (existingLink) {
                this.updateProgress();
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = url;
            
            link.onload = () => {
                this.updateProgress();
                resolve();
            };
            link.onerror = () => {
                console.warn(`Failed to preload CSS: ${url}`);
                this.updateProgress();
                resolve();
            };
            
            document.head.appendChild(link);
        });
    },

    // Preload JavaScript file
    preloadJS(url) {
        return new Promise((resolve) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'script';
            link.href = url;
            
            link.onload = () => {
                this.updateProgress();
                resolve();
            };
            link.onerror = () => {
                console.warn(`Failed to preload JS: ${url}`);
                this.updateProgress();
                resolve();
            };
            
            document.head.appendChild(link);
        });
    },

    // Preload image
    preloadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = () => {
                this.updateProgress();
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to preload image: ${url}`);
                this.updateProgress();
                resolve();
            };
            
            img.src = url;
        });
    },

    // Preload video
    preloadVideo(url) {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'auto';
            
            video.oncanplaythrough = () => {
                this.updateProgress();
                resolve();
            };
            video.onerror = () => {
                console.warn(`Failed to preload video: ${url}`);
                this.updateProgress();
                resolve();
            };
            
            // Set timeout untuk video besar
            setTimeout(() => {
                if (this.loadedCount < this.totalCount) {
                    this.updateProgress();
                    resolve();
                }
            }, 10000); // 10 second timeout untuk video
            
            video.src = url;
            video.load();
        });
    },

    // Preload external resource (fetch untuk CDN)
    preloadExternal(url) {
        return new Promise((resolve) => {
            fetch(url, { mode: 'no-cors' })
                .then(() => {
                    this.updateProgress();
                    resolve();
                })
                .catch(() => {
                    console.warn(`Failed to preload external: ${url}`);
                    this.updateProgress();
                    resolve();
                });
        });
    },

    // Start preloading all resources
    async startPreload(onProgress, onComplete) {
        this.loadedCount = 0;
        this.onProgress = onProgress;
        this.onComplete = onComplete;
        this.calculateTotal();

        console.log(`🚀 Starting preload of ${this.totalCount} resources...`);

        // Load all resources concurrently
        const promises = [
            ...this.resources.css.map(url => this.preloadCSS(url)),
            ...this.resources.js.map(url => this.preloadJS(url)),
            ...this.resources.images.map(url => this.preloadImage(url)),
            ...this.resources.videos.map(url => this.preloadVideo(url)),
            ...this.resources.external.map(url => this.preloadExternal(url))
        ];

        await Promise.all(promises);
        console.log('✅ All resources preloaded!');
    }
};

// =====================================================
// LOADING SCREEN CONTROLLER
// =====================================================

audioSystem.init();

function startRealLoading() {
    const loadingBarFill = document.getElementById('loadingBarFill');
    const loadingScreen = document.getElementById('loadingScreen');
    const overlay = document.getElementById('transition-overlay');
    const loadingText = document.querySelector('.loading-text');

    if (!loadingBarFill) return;
    
    audioSystem.playLoadingMusic();

    // Update text untuk menunjukkan loading nyata
    if (loadingText) {
        loadingText.textContent = 'Memuat resources...';
    }

    // Callback saat progress update
    const onProgress = (percent, loaded, total) => {
        loadingBarFill.style.width = percent + '%';
        if (loadingText) {
            loadingText.textContent = `Memuat... ${loaded}/${total} (${percent}%)`;
        }
    };

    // Callback saat loading selesai
    const onComplete = () => {
        if (loadingText) {
            loadingText.textContent = 'Selesai! Mempersiapkan halaman...';
        }

        // Delay kecil untuk user melihat 100%
        setTimeout(() => {
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
                window.location.href = '/dialog';
            }, 1400); 
        }, 500);
    };

    // Mulai preloading sesungguhnya
    resourcePreloader.startPreload(onProgress, onComplete);
}

// =====================================================
// EVENT LISTENERS
// =====================================================

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
                
                // Mulai REAL loading
                startRealLoading();
            }, 800);
        }, { once: true });
    }
});