// dialog.js - Handles dialog sequence

const audioSystem = {
    introMusic: null,
    clickSound: null,
    pixelWipeSound: null,
    
    init() {
        this.introMusic = new Audio('../assets/music/tokyo.mp3');
        this.introMusic.loop = true;
        
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
    
    playIntroMusic() {
        if (this.introMusic) {
            this.introMusic.play().catch(e => console.error("Gagal memutar audio intro:", e));
        }
    },
    
    stopIntroMusic() {
        if (this.introMusic) {
            this.introMusic.pause();
            this.introMusic.currentTime = 0;
        }
    },
    
    playClick() {
        if (this.clickSound) this.clickSound.play();
    },
    
    playPixelWipe() {
        if (this.pixelWipeSound) this.pixelWipeSound.play();
    }
};

audioSystem.init();

const dialogSequence = [
    "Hey there! Welcome in.",
    "You've just stumbled into my little digital hideout.",
    "Here, I share my favorite music, art, and random thoughts.",
    "Curious to see more? Just tap the blue button to begin."
];

let currentDialogIndex = 0;
let isTyping = false;
let typingTimeout = null;

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

function skipIntro() {
    const introContainer = document.getElementById('introContainer');
    if (!introContainer || introContainer.style.opacity === '0') return;

    if (isTyping && typingTimeout) {
        clearTimeout(typingTimeout);
        isTyping = false;
    }
    
    const mouth = document.querySelector('.mouth');
    if (mouth) mouth.classList.remove('talking');

    introContainer.style.opacity = '0';
    
    setTimeout(() => {
        audioSystem.stopIntroMusic();
        
        // Use blur transition effect
        if (typeof triggerBlurTransition === 'function') {
            triggerBlurTransition(
                () => {
                    const introVideo = document.getElementById('intro-video-bg');
                    if (introVideo) introVideo.style.display = 'none';
                    document.body.classList.remove('intro-page');
                    
                    const pixelArt = document.querySelector('.pixel-art-elements');
                    if (pixelArt) {
                        pixelArt.style.display = 'block';
                    }
                },
                () => {
                    // UPDATE: URL bersih ke /main
                    window.location.href = '/main';
                }
            );
        } else {
            audioSystem.playPixelWipe();
            setTimeout(() => {
                // UPDATE: URL bersih ke /main
                window.location.href = '/main';
            }, 300);
        }
    }, 500);
}

function startIntro() {
    const dialogText = document.getElementById('dialogText');
    const continueBtn = document.getElementById('continueBtn');
    const skipBtn = document.getElementById('skipBtn');
    
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
        if (isTyping) {
            finishTyping(dialogText, dialogSequence[currentDialogIndex - 1]);
        } else {
            showNextDialog();
        }
    });
    
    skipBtn.addEventListener('click', () => {
        audioSystem.playClick();
        skipIntro();
    });
    
    showNextDialog();
}

window.addEventListener('load', () => {
    // Show pixel art elements immediately
    const pixelArt = document.querySelector('.pixel-art-elements');
    if (pixelArt) {
        pixelArt.style.display = 'block';
    }
    
    audioSystem.playIntroMusic();
    startIntro();
});