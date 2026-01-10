// zootopia.js - Zootopia Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Initialize ambient effects for Zootopia page
    if (typeof initializeAmbientEffects === 'function' && !document.body.dataset.effectsInitialized) {
        initializeAmbientEffects();
    }

    // Add drag scrolling functionality
    const scrollContainers = document.querySelectorAll('.fanart-grid, .music-showcase, .fanfic-grid');
    
    scrollContainers.forEach(container => {
        let isDown = false;
        let startX;
        let scrollLeft;

        container.addEventListener('mousedown', (e) => {
            isDown = true;
            container.style.cursor = 'grabbing';
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });

        container.addEventListener('mouseleave', () => {
            isDown = false;
            container.style.cursor = 'grab';
        });

        container.addEventListener('mouseup', () => {
            isDown = false;
            container.style.cursor = 'grab';
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });
    });

    // Back button functionality (UPDATED)
    const backBtn = document.getElementById('zootopia-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (typeof audioSystem !== 'undefined') {
                audioSystem.playClick();
            }
            
            // Save music state
            if (typeof persistentAudioPlayer !== 'undefined' && persistentAudioPlayer.audio) {
                sessionStorage.setItem('musicCurrentTime', persistentAudioPlayer.audio.currentTime);
            }
            
            // Navigate directly to main.html
            window.location.href = 'main.html';
        });
    }

    // Music play button functionality
    const musicPlayButtons = document.querySelectorAll('.music-play-btn');
    musicPlayButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (typeof audioSystem !== 'undefined') {
                audioSystem.playClick();
            }
            
            const isPlaying = btn.classList.contains('playing');
            
            // Stop all other playing buttons
            musicPlayButtons.forEach(otherBtn => {
                otherBtn.classList.remove('playing');
                otherBtn.textContent = '▶ Play';
            });
            
            // Toggle current button
            if (!isPlaying) {
                btn.classList.add('playing');
                btn.textContent = '■ Stop';
            }
        });
    });

    // Fan fiction read more functionality
    const readMoreButtons = document.querySelectorAll('.fanfic-read-btn');
    readMoreButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof audioSystem !== 'undefined') {
                audioSystem.playClick();
            }
            
            // Placeholder for read more functionality
            const card = btn.closest('.fanfic-card');
            const title = card.querySelector('h3').textContent;
            
            console.log(`Opening story: ${title}`);
            
            // Visual feedback
            btn.textContent = 'Loading...';
            setTimeout(() => {
                btn.textContent = 'Read More →';
            }, 1000);
        });
    });

    // Add hover sound effects to cards
    const allCards = document.querySelectorAll('.fanart-card, .music-card, .fanfic-card');
    allCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Subtle hover effect sound could be added here
        });
    });

    // Parallax effect for hero banner
    const heroBanner = document.querySelector('.banner-placeholder');
    if (heroBanner) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.3;
            heroBanner.style.transform = `translateY(${rate}px)`;
        });
    }

    // Animate cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, observerOptions);

    // Observe all animated elements
    const animatedElements = document.querySelectorAll(
        '.fanart-card, .music-card, .fanfic-card, .zootopia-section'
    );
    animatedElements.forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });

    // Logo hover effect
    const logo = document.querySelector('.logo-placeholder');
    if (logo) {
        let isAnimating = false;
        logo.addEventListener('click', () => {
            if (isAnimating) return;
            
            if (typeof audioSystem !== 'undefined') {
                audioSystem.playClick();
            }
            
            isAnimating = true;
            logo.style.animation = 'bounceIn 0.8s ease-out';
            
            setTimeout(() => {
                logo.style.animation = '';
                isAnimating = false;
            }, 800);
        });
    }

    // Easter egg: Konami code for special effect
    let konamiCode = [];
    const konamiSequence = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑↑↓↓←→←→BA
    
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.keyCode);
        if (konamiCode.length > konamiSequence.length) {
            konamiCode.shift();
        }
        
        if (konamiCode.join(',') === konamiSequence.join(',')) {
            activateEasterEgg();
            konamiCode = [];
        }
    });

    function activateEasterEgg() {
        const container = document.querySelector('.zootopia-container');
        if (!container) return;
        
        // Create special overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.5s ease-out;
        `;
        
        overlay.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px;
                border: 4px solid #fff;
                border-radius: 20px;
                text-align: center;
                font-family: 'Press Start 2P', cursive;
                color: white;
                max-width: 500px;
                box-shadow: 0 0 50px rgba(102, 126, 234, 0.5);
            ">
                <h2 style="font-size: 18px; margin-bottom: 20px;">🎉 Secret Unlocked! 🎉</h2>
                <p style="font-size: 10px; line-height: 1.8; margin-bottom: 20px;">
                    You've discovered the hidden Zootopia mode!<br>
                    "In Zootopia, anyone can be anything!"
                </p>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 9px;
                    cursor: pointer;
                    background: white;
                    color: #667eea;
                ">Close</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add rainbow effect to all cards
        const allCards = document.querySelectorAll('.fanart-card, .music-card, .fanfic-card');
        allCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'bounceIn 0.6s ease-out';
                card.style.border = '3px solid #667eea';
            }, index * 100);
        });
    }

    // Initialize persistent audio if available
    if (typeof persistentAudioPlayer !== 'undefined' && !persistentAudioPlayer.isInitialized) {
        persistentAudioPlayer.initializeOnLoad();
    }
});