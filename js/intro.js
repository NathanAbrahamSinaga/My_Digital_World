// intro.js - Handles intro sequence and loading

const audioSystem = {
    loadingMusic: null,
    
    init() {
        this.loadingMusic = new Audio('assets/music/train.wav');
        this.loadingMusic.loop = false;
    },
    
    playLoadingMusic() {
        if (this.loadingMusic) {
            this.loadingMusic.play().catch(e => console.error("Gagal memutar audio loading:", e));
        }
    }
};

audioSystem.init();

function startLoading() {
    const loadingBarFill = document.getElementById('loadingBarFill');
    if (!loadingBarFill) return;
    
    audioSystem.playLoadingMusic();

    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                // Navigate to dialog page
                window.location.href = 'pages/dialog.html';
            }, 500);
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
            startScreen.style.display = 'none';
            loadingScreen.style.display = 'flex';
            startLoading();
        }, { once: true });
    }
});