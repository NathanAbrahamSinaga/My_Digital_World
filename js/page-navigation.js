// page-navigation.js - Page navigation and content loading

function showPage(pageName) {
    if (typeof audioSystem !== 'undefined') {
        audioSystem.playClick();
    }
    
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

function showMainMenu() {
    if (typeof audioSystem !== 'undefined') {
        audioSystem.playClick();
    }
    
    const mainNav = document.getElementById('mainNav');
    const backBtn = document.getElementById('main-back-btn');
    
    if (typeof activePlayer !== 'undefined' && activePlayer) {
        closePlayerUI(activePlayer);
        window.activePlayer = null;
    }
    
    hideMascot();

    if (typeof backgroundMusicPausedForPlayer !== 'undefined' && backgroundMusicPausedForPlayer) {
        if (typeof persistentAudioPlayer !== 'undefined' && persistentAudioPlayer.audio) {
            persistentAudioPlayer.audio.play().catch(e => console.error("Gagal melanjutkan musik latar:", e));
        }
        window.backgroundMusicPausedForPlayer = false;
    }
    
    if (typeof activeThemeAudio !== 'undefined' && activeThemeAudio && activeThemeAudio.paused) {
        activeThemeAudio.play().catch(e => console.error("Gagal melanjutkan audio tema:", e));
    }
    
    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    
    if (mainNav) mainNav.style.display = 'flex';
    if (backBtn) backBtn.style.display = 'none';
}

function loadPageContent(pageName) {
    // UPDATE: Gunakan path absolute
    const pathPrefix = '/data/';
    
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
                    <div class="gallery-item" style="animation-delay: ${(index * 0.15)}s" onclick="openImageModal('/assets/images/${art.gambar}')">
                        <div class="gallery-img" style="background-image: url(/assets/images/${art.gambar}); background-size: cover; background-position: center;">
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
                        <h2>${data.judul}</h2>
                        <p>${data.paragraf1}</p>
                        <div class="quote">"${data.kutipan}"</div>
                        <p>${data.paragraf2}</p>`;
                })
                .catch(err => console.error(`Gagal memuat ${pageName}:`, err));
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

// Music player functions
function playMusic(btnElement, type, id) {
    if (typeof audioSystem !== 'undefined') {
        audioSystem.playClick();
    }
    
    const thisMusicItem = btnElement.closest('.music-item');
    const isCurrentlyPlaying = thisMusicItem.classList.contains('playing');

    if (typeof activePlayer !== 'undefined' && activePlayer && activePlayer !== thisMusicItem) {
        closePlayerUI(activePlayer);
    }

    if (isCurrentlyPlaying) {
        closePlayerUI(thisMusicItem);
        window.activePlayer = null;
        
        if (typeof backgroundMusicPausedForPlayer !== 'undefined' && backgroundMusicPausedForPlayer) {
            if (typeof persistentAudioPlayer !== 'undefined' && persistentAudioPlayer.audio) {
                persistentAudioPlayer.audio.play().catch(e => console.error("Gagal melanjutkan musik latar:", e));
            }
            window.backgroundMusicPausedForPlayer = false;
        }
        
        if (typeof activeThemeAudio !== 'undefined' && activeThemeAudio && activeThemeAudio.paused) {
            activeThemeAudio.play().catch(e => console.error("Gagal melanjutkan audio tema:", e));
        }
    } else {
        if (typeof persistentAudioPlayer !== 'undefined' && persistentAudioPlayer.audio && !persistentAudioPlayer.audio.paused) {
            persistentAudioPlayer.audio.pause();
            window.backgroundMusicPausedForPlayer = true;
        }
        
        if (typeof activeThemeAudio !== 'undefined' && activeThemeAudio) {
            activeThemeAudio.pause();
        }

        const playerContainer = thisMusicItem.querySelector('.player-container');
        thisMusicItem.classList.add('playing');
        btnElement.classList.add('playing');
        btnElement.innerHTML = '■ Stop';
        window.activePlayer = thisMusicItem;
        
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

// Mascot functions
function showMascot() {
    if (typeof currentMascotElement !== 'undefined' && currentMascotElement) return;

    const mascot = document.createElement('img');
    // UPDATE: Gunakan absolute path
    const basePath = '/';
    mascot.src = `${basePath}assets/images/miku.gif`;
    mascot.className = 'music-mascot';

    document.body.appendChild(mascot);

    const direction = Math.random() > 0.5 ? 'left' : 'right';
    mascot.classList.add(direction === 'left' ? 'enter-from-left' : 'enter-from-right');
    
    mascot.addEventListener('animationend', (e) => {
        if (e.animationName === 'slideAndFadeIn' && !mascot.classList.contains('is-exiting')) {
            mascot.classList.add('is-floating');
        }
    }, { once: true });
    
    window.currentMascotElement = mascot;
}

function hideMascot() {
    if (typeof currentMascotElement === 'undefined' || !currentMascotElement || currentMascotElement.classList.contains('is-exiting')) return;

    currentMascotElement.classList.remove('is-floating');
    currentMascotElement.classList.add('is-exiting');

    currentMascotElement.addEventListener('animationend', (e) => {
        if (e.animationName === 'shrinkAndFadeOut') {
            if (e.currentTarget) e.currentTarget.remove();
            if (e.currentTarget === currentMascotElement) {
                window.currentMascotElement = null;
            }
        }
    }, { once: true });
}

// Image modal
function openImageModal(src) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    if (!modal || !modalImg) return;
    
    modal.classList.add('show');
    modalImg.src = src;
}