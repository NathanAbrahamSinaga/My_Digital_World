// zootopia.js - Fixed with absolute paths

document.addEventListener('DOMContentLoaded', () => {
    // Page Transition Fade In
    if (typeof initializePageTransition === 'function') {
        initializePageTransition();
    }

    // --- Zootopia Asset Preloader ---
    const loader = document.getElementById('zootopia-loader');
    const loaderBar = document.querySelector('.loader-bar');
    
    // Function to update progress bar
    let musicTriggered = false;
    const updateProgress = (ratio) => {
        if (loaderBar) loaderBar.style.width = `${Math.round(ratio * 100)}%`;
        
        // Trigger music at 70%
        if (ratio >= 0.7 && !musicTriggered) {
            musicTriggered = true;
            initializeZootopiaMusic();
        }
    };

    // 1. Initiate Data Loading (Return Promises)
    const fanArtPromise = loadFanArt();
    const musicPromise = loadMusic();
    const storiesPromise = loadStories();

    // 2. Critical Image Assets to Preload
    const assetsToLoad = [
        '../assets/zootopia/logo.png',
        '../assets/zootopia/banner.webp',
        '../assets/zootopia/1.png',
        '../assets/zootopia/2.png'
    ];

    const imagePromises = assetsToLoad.map(src => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = resolve; // Continue even if fail
        });
    });

    // 3. Minimum Visual Load Time (1.5s)
    const minLoadPromise = new Promise(resolve => setTimeout(resolve, 1500));

    // 4. Window Load Event (CSS/Scripts/Layout)
    const windowLoadPromise = new Promise(resolve => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', resolve);
        }
    });

    // Combine ALL promises to track
    const allPromises = [
        fanArtPromise,
        musicPromise,
        storiesPromise,
        ...imagePromises,
        minLoadPromise,
        windowLoadPromise
    ];

    let completedCount = 0;
    const totalPromises = allPromises.length;

    // Track progress of each promise individually for smooth bar
    allPromises.forEach(p => {
        Promise.resolve(p).then(() => {
            completedCount++;
            updateProgress(completedCount / totalPromises);
        }).catch(() => {
            // Even if failed, count as done to prevent hanging
            completedCount++;
            updateProgress(completedCount / totalPromises);
        });
    });

    // When EVERYTHING is ready
    Promise.allSettled(allPromises).then(() => {
        // Force 100%
        updateProgress(1);

        setTimeout(() => {
            if (loader) loader.classList.add('hidden');
            
            // Initialize post-load animations
            setTimeout(() => {
                initializeCornerVideo();
                initializeBannerRotation();
                
                // Initialize features that depend on DOM content (grids)
                initializeDragScroll();
                
                // Initialize Scroll Transitions
                initializeScrollReveal();
            }, 500);

        }, 500); // 0.5s delay at 100% before fading out
    });

    // --- Initialize Controls immediately (Event Listeners) ---
    
    // Back Button
    const backBtn = document.getElementById('zootopia-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (typeof audioSystem !== 'undefined') {
                audioSystem.playClick();
            }
            
            // Stop Zootopia music
            if (typeof zootopiaAudioPlayer !== 'undefined' && zootopiaAudioPlayer.audio) {
                zootopiaAudioPlayer.audio.pause();
                zootopiaAudioPlayer.audio = null;
            }
            
            // Navigate with transition
            if (typeof handlePageNavigation === 'function') {
                handlePageNavigation('/main');
            } else {
                window.location.href = '/main';
            }
        });
    }

    // Initialize Zootopia music player (Handled by updateProgress at 70%)
    // initializeZootopiaMusic();

    // Initialize expand/collapse for Fan Art
    initializeFanArtExpand();
    
    // Initialize image modal
    initializeImageModal();
});

// Corner Video Widget Logic
function initializeCornerVideo() {
    const widget = document.getElementById('corner-video-widget');
    const video = document.getElementById('corner-video');

    if (!widget || !video) return;

    // Small delay before appearing
    setTimeout(() => {
        // 1. Slide Up
        widget.classList.add('visible');
        
        // 2. Play Video
        video.play().catch(e => console.log('Autoplay blocked:', e));
        
        // 3. When video ends, custom exit sequence
        video.addEventListener('ended', () => {
             // A. Fade to black first
             widget.classList.add('fading-out');

             // B. Wait for fade (800ms) then slide down
             setTimeout(() => {
                 widget.classList.remove('visible');
                 widget.classList.add('hidden');
             }, 800); 
        });
    }, 2000); // 2s delay after page load
}

// Drag Scroll Functionality
function initializeDragScroll() {
    const scrollContainers = document.querySelectorAll('.music-showcase, .fanfic-grid, .fanart-grid');
    
    scrollContainers.forEach(container => {
        let isDown = false;
        let startX;
        let scrollLeft;

        container.addEventListener('mousedown', (e) => {
            if (container.classList.contains('fanart-grid') && container.classList.contains('expanded')) {
                return;
            }
            
            isDown = true;
            container.style.cursor = 'grabbing';
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });

        container.addEventListener('mouseleave', () => {
            isDown = false;
            if (!container.classList.contains('expanded')) {
                container.style.cursor = 'grab';
            }
        });

        container.addEventListener('mouseup', () => {
            isDown = false;
            if (!container.classList.contains('expanded')) {
                container.style.cursor = 'grab';
            }
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });

        if (container.classList.contains('fanart-grid')) {
            startAutoScroll(container);
        }
    });
}

// Auto Scroll for Fan Art (Ping-Pong Effect)
function startAutoScroll(container) {
    let scrollSpeed = 0.5; // Slower for smoother visual
    let direction = 1; // 1 = Right, -1 = Left
    let animationId;
    let isHovering = false;
    let isPaused = false;

    function scroll() {
        if (!isHovering && !container.classList.contains('expanded') && !isPaused) {
            if (container.scrollWidth > container.clientWidth) {
                // Update scroll position
                container.scrollLeft += (scrollSpeed * direction);
                
                // Check right boundary (using a small buffer 1px to be safe)
                if (direction === 1 && container.scrollLeft >= (container.scrollWidth - container.clientWidth - 1)) {
                    direction = -1; // Reverse to Left
                }
                // Check left boundary
                else if (direction === -1 && container.scrollLeft <= 0) {
                    direction = 1; // Reverse to Right
                }
            }
        }
        animationId = requestAnimationFrame(scroll);
    }

    container.addEventListener('mouseenter', () => {
        isHovering = true;
    });

    container.addEventListener('mouseleave', () => {
        isHovering = false;
    });

    container.addEventListener('mousedown', () => {
        isPaused = true;
    });

    container.addEventListener('mouseup', () => {
        setTimeout(() => {
            isPaused = false;
        }, 1000); // Longer pause after interaction (1s)
    });

    // Handle Touch for Mobile
    container.addEventListener('touchstart', () => {
        isPaused = true;
    });
    
    container.addEventListener('touchend', () => {
        setTimeout(() => {
            isPaused = false;
        }, 1000);
    });

    scroll();
}

// Initialize Fan Art Expand/Collapse
function initializeFanArtExpand() {
    const expandBtn = document.getElementById('fanart-expand');
    const fanartGrid = document.getElementById('fanart-grid');
    
    if (!expandBtn || !fanartGrid) return;
    
    expandBtn.addEventListener('click', () => {
        if (typeof audioSystem !== 'undefined') {
            audioSystem.playClick();
        }
        
        const isExpanding = !fanartGrid.classList.contains('expanded');
        
        fanartGrid.classList.toggle('expanded');
        expandBtn.classList.toggle('expanded');
        
        if (isExpanding) {
            fanartGrid.style.cursor = 'default';
        } else {
            fanartGrid.style.cursor = 'grab';
            fanartGrid.scrollLeft = 0;
            
            setTimeout(() => {
                expandBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    });
}

// Image Modal for Full Screen View
function initializeImageModal() {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const closeBtn = document.getElementById('close-modal');

    if (!modal || !modalImg || !closeBtn) return;

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
        }
    });
}

// Open Image Modal
function openImageModal(imageSrc) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    
    if (!modal || !modalImg) return;
    
    modalImg.src = imageSrc;
    modal.classList.add('show');
}

// ============================================
// FIXED: Load Fan Art with ABSOLUTE PATH
// ============================================
function loadFanArt() {
    return fetch('../data/zootopia/fanart.json')  // ✅ Relative path
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('fanart-grid');
            if (!container) return;
            
            container.innerHTML = data.map(art => `
                <div class="fanart-card">
                    <div class="fanart-placeholder" onclick="openImageModal('../assets/zootopia/art/${art.image}')">
                        <img src="../assets/zootopia/art/${art.image}" alt="${art.artist}" draggable="false" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <span style="display:none;">Art Preview</span>
                    </div>
                    <div class="fanart-info">
                        <p>${art.artist}</p>
                    </div>
                </div>
            `).join('');
        })
        .catch(err => console.error('Failed to load fan art:', err));
}

// ============================================
// FIXED: Load Music with ABSOLUTE PATH
// ============================================
// ============================================
// FIXED: Load Music with ABSOLUTE PATH
// ============================================
// ============================================
// FIXED: Load Music with ABSOLUTE PATH
// ============================================
function loadMusic() {
    return fetch('../data/zootopia/music.json')  // ✅ Relative path
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('music-showcase');
            if (!container) return;
            
            container.innerHTML = data.map((music, index) => `
                <div class="music-card" onclick="window.open('${music.url}', '_blank')">
                    <div class="music-placeholder">
                        <img src="../assets/zootopia/music/${music.image}" alt="${music.title}" draggable="false" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <span style="display:none;">${music.title}</span>
                    </div>
                    <div class="music-details">
                        <h3>${music.title}</h3>
                        <p>${music.artist}</p>
                    </div>
                </div>
            `).join('');
        })
        .catch(err => console.error('Failed to load music:', err));
}

// Toggle Music Player (Spotify or YouTube)
let currentPlayingIndex = null;

function toggleMusicPlayer(index, type, id) {
    if (typeof audioSystem !== 'undefined') {
        audioSystem.playClick();
    }

    const card = document.querySelector(`.music-card[data-index="${index}"]`);
    const playerContainer = card.querySelector('.music-player-container');
    const playBtn = card.querySelector('.music-play-btn');

    if (currentPlayingIndex === index) {
        playerContainer.style.display = 'none';
        playerContainer.innerHTML = '';
        playBtn.textContent = '▶ Play';
        playBtn.classList.remove('playing');
        currentPlayingIndex = null;
        return;
    }

    if (currentPlayingIndex !== null) {
        const prevCard = document.querySelector(`.music-card[data-index="${currentPlayingIndex}"]`);
        if (prevCard) {
            const prevContainer = prevCard.querySelector('.music-player-container');
            const prevBtn = prevCard.querySelector('.music-play-btn');
            prevContainer.style.display = 'none';
            prevContainer.innerHTML = '';
            prevBtn.textContent = '▶ Play';
            prevBtn.classList.remove('playing');
        }
    }

    let embedHtml = '';
    
    if (type === 'youtube') {
        embedHtml = `
            <iframe 
                width="100%" 
                height="200" 
                src="https://www.youtube.com/embed/${id}?autoplay=1" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                style="border-radius:8px;">
            </iframe>
        `;
    } else if (type === 'spotify') {
        embedHtml = `
            <iframe 
                src="https://open.spotify.com/embed/track/${id}?utm_source=generator" 
                width="100%" 
                height="152" 
                frameBorder="0" 
                allowfullscreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
                style="border-radius:8px;">
            </iframe>
        `;
    }

    playerContainer.innerHTML = embedHtml;
    playerContainer.style.display = 'block';
    playBtn.textContent = '■ Stop';
    playBtn.classList.add('playing');
    currentPlayingIndex = index;
}

// ============================================
// FIXED: Load Stories with ABSOLUTE PATH
// ============================================
function loadStories() {
    return fetch('../data/zootopia/stories.json')  // ✅ Relative path
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('stories-grid');
            if (!container) return;
            
            container.innerHTML = data.map(story => `
                <div class="fanfic-card">
                    <div class="fanfic-placeholder">
                        <img src="../assets/zootopia/stories/${story.image}" alt="${story.title}" draggable="false" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <span style="display:none;">Story Cover</span>
                    </div>
                    <div class="fanfic-header">
                        <h3>${story.title}</h3>
                        <p class="fanfic-author">by ${story.author}</p>
                        <span class="fanfic-tag">Fiction</span>
                    </div>
                    <div class="fanfic-preview">
                        <p class="fanfic-excerpt">${story.description}</p>
                        <button class="fanfic-read-btn" onclick="handleReadStory('${story.title}')">Read More →</button>
                    </div>
                </div>
            `).join('');
        })
        .catch(err => console.error('Failed to load stories:', err));
}

// Handle Read Story
function handleReadStory(title) {
    if (typeof audioSystem !== 'undefined') {
        audioSystem.playClick();
    }
    
    console.log(`Opening story: ${title}`);
    alert(`Story "${title}" will be opened here!`);
}

// ============================================
// Automatic Banner Rotation (Cross-Fade)
// ============================================
function initializeBannerRotation() {
    const img1 = document.getElementById('hero-banner-image-1');
    const img2 = document.getElementById('hero-banner-image-2');
    
    if (!img1 || !img2) return;

    // List of banner images
    const images = [
        '../assets/zootopia/banner.webp',
        '../assets/zootopia/banner2.jpg',
        '../assets/zootopia/banner3.jpg',
        '../assets/zootopia/banner4.jpg',
        '../assets/zootopia/banner5.jpg',
        '../assets/zootopia/banner6.jpg'
    ];

    let currentIndex = 0;
    let activeImage = 1; // 1 means img1 is active, 2 means img2 is active

    // Start with correct initial state
    img1.src = images[0];
    img1.classList.add('banner-active');
    img1.classList.remove('banner-next');
    
    // Preload next image in the "back" slot
    img2.src = images[1];
    img2.classList.remove('banner-active');
    img2.classList.add('banner-next');

    setInterval(() => {
        // Calculate next index
        const nextIndex = (currentIndex + 1) % images.length;
        
        if (activeImage === 1) {
            // TRANSITION: img1 (visible) -> img2 (hidden, has next image)
            // 1. Ensure img2 has the correct NEXT image ready (it should already have it from previous cycle)
            img2.src = images[nextIndex];
            
            // 2. Perform Cross-Fade
            // Make img2 visible (top)
            img2.classList.add('banner-active');
            img2.classList.remove('banner-next');
            
            // Make img1 hidden (bottom)
            img1.classList.remove('banner-active');
            img1.classList.add('banner-next');
            
            // Now img2 is the Active one
            activeImage = 2;
        } else {
            // TRANSITION: img2 (visible) -> img1 (hidden, has next image)
            // 1. Ensure img1 has the correct NEXT image
            img1.src = images[nextIndex];
            
            // 2. Perform Cross-Fade
            img1.classList.add('banner-active');
            img1.classList.remove('banner-next');
            
            img2.classList.remove('banner-active');
            img2.classList.add('banner-next');
            
            // Now img1 is the Active one
            activeImage = 1;
        }
        
        // Update current index for next loop
        currentIndex = nextIndex;

    }, 6000);
}

// Scroll Reveal - Proven Working Implementation
function initializeScrollReveal() {
    console.log('🎬 Initializing Scroll Reveal Animation...');
    
    // Observer configuration
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.15
    };
    
    // Create observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                console.log('✅ Revealing:', entry.target.className);
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Function to observe elements
    const observeElements = () => {
        // Target main sections
        const sections = document.querySelectorAll('.zootopia-section, .video-highlight-section, .video-interlude-section');
        sections.forEach(section => {
            if (!section.classList.contains('revealed')) {
                section.classList.add('scroll-reveal');
                observer.observe(section);
            }
        });
        
        // Target grids with stagger effect
        const grids = document.querySelectorAll('.fanart-grid, .music-showcase, .fanfic-grid');
        grids.forEach(grid => {
            if (!grid.classList.contains('revealed')) {
                grid.classList.add('scroll-reveal-stagger');
                observer.observe(grid);
            }
        });
        
        console.log(`📋 Observing ${sections.length} sections and ${grids.length} grids`);
    };
    
    // Initial observation
    observeElements();
    
    // Re-observe after dynamic content loads (for music, art, stories)
    setTimeout(observeElements, 500);
    setTimeout(observeElements, 1500);
    setTimeout(observeElements, 3000);
}

// ============================================
// Zootopia Music Player System
// ============================================
const zootopiaAudioPlayer = {
    audio: null,
    isInitialized: false,

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

    play() {
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
        
        // Use relative path to Zootopia music
        this.audio = new Audio('../assets/zootopia/music/1.mp3');
        this.audio.loop = true;
        this.audio.volume = 0.5; // Set volume to 50%
        this.audio.preload = 'auto';
        this.audio.autoplay = true;
        
        this.audio.play().catch(error => {
            console.error("Failed to play Zootopia music:", error);
            if (error.name === 'NotAllowedError') {
                this.showAudioPrompt();
            }
        });

        this.audio.addEventListener('play', () => this.updateButtonUI());
        this.audio.addEventListener('pause', () => this.updateButtonUI());

        this.updateButtonUI();
    },

    toggle() {
        if (!this.audio) {
            this.play();
            return;
        }

        if (this.audio.paused) {
            this.audio.play().catch(e => console.error("Failed to resume music:", e));
        } else {
            this.audio.pause();
        }
    },

    showAudioPrompt() {
        // Silent unlock - no visual prompt
        const enableAudio = () => {
            if (this.audio && this.audio.paused) {
                this.audio.play().catch(e => console.error("Silent autoplay retry failed:", e));
            }
            window.removeEventListener('click', enableAudio);
            window.removeEventListener('touchstart', enableAudio);
            window.removeEventListener('keydown', enableAudio);
        };
        
        window.addEventListener('click', enableAudio, { once: true });
        window.addEventListener('touchstart', enableAudio, { once: true });
        window.addEventListener('keydown', enableAudio, { once: true });
    }
};

function initializeZootopiaMusic() {
    if (zootopiaAudioPlayer.isInitialized) return;
    
    // Setup music toggle button
    const musicBtn = document.getElementById('music-toggle-btn');
    if (musicBtn) {
        musicBtn.addEventListener('click', () => {
            if (typeof audioSystem !== 'undefined') {
                audioSystem.playClick();
            }
            zootopiaAudioPlayer.toggle();
        });
    }
    
    // Auto-play music on page load
    zootopiaAudioPlayer.play();
    zootopiaAudioPlayer.isInitialized = true;
}