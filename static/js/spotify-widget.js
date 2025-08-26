(function() {
    'use strict';

    const API_URL = 'https://spotify-current-track-init.onrender.com/api/current-track';
    const UPDATE_INTERVAL = 10000;
    const PROGRESS_INTERVAL = 250;

    let currentTrackId = null;
    let progressTimer = null;
    let currentProgress = 0;
    let duration = 0;
    let lastUpdateTime = 0;
    let isPlaying = false;
    let progressBar = null;
    let currentTimeEl = null;

    function formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function updateProgress() {
        if (!isPlaying || !progressBar || !currentTimeEl || duration <= 0) return;
        
        const now = Date.now();
        const elapsed = now - lastUpdateTime;
        currentProgress = Math.min(currentProgress + elapsed, duration);
        lastUpdateTime = now;
        
        const percentage = (currentProgress / duration) * 100;
        progressBar.style.width = `${percentage}%`;
        currentTimeEl.textContent = formatTime(currentProgress);
    }

    function startProgressTracking() {
        stopProgressTracking();
        progressTimer = setInterval(updateProgress, PROGRESS_INTERVAL);
    }

    function stopProgressTracking() {
        if (progressTimer) {
            clearInterval(progressTimer);
            progressTimer = null;
        }
    }

    function renderTrack(track) {
        const artists = track.artists.map(artist => escapeHtml(artist.name)).join(', ');
        const albumImage = track.album.images[2]?.url || track.album.images[0]?.url || '';

        return `
            <div class="spotify-widget__track">
                <img src="${escapeHtml(albumImage)}" 
                     alt="${escapeHtml(track.album.name)}" 
                     width="60" height="60" 
                     class="spotify-widget__album-art"
                     onload="this.classList.add('loaded')">
                <div class="spotify-widget__track-info">
                    <div class="spotify-widget__track-name">${escapeHtml(track.name)}</div>
                    <div class="spotify-widget__artist">by ${artists}</div>
                    <div class="spotify-widget__album">on ${escapeHtml(track.album.name)}</div>
                </div>
            </div>
            <div class="spotify-widget__progress">
                <div class="spotify-widget__progress-fill"></div>
            </div>
            <div class="spotify-widget__time">
                <span class="spotify-widget__time-current">${formatTime(currentProgress)}</span>
                <span class="spotify-widget__time-total">${formatTime(duration)}</span>
            </div>
        `;
    }

    function showWidget(widget) {
        widget.style.display = 'block';
        widget.classList.add('show');
    }

    function hideWidget(widget) {
        widget.classList.remove('show');
        setTimeout(() => widget.style.display = 'none', 400);
    }

    function animateTrackInfo() {
        requestAnimationFrame(() => {
            const trackInfo = document.querySelector('.spotify-widget__track-info');
            const timeEl = document.querySelector('.spotify-widget__time');
            
            if (trackInfo) trackInfo.classList.add('loaded');
            if (timeEl) timeEl.classList.add('loaded');
        });
    }

    function updateWidget(data) {
        const contentEl = document.querySelector('#spotify-content');
        const statusEl = document.querySelector('#status-text');
        const logoEl = document.querySelector('#spotify-logo');
        const widget = document.querySelector('#spotify-widget');

        if (!contentEl || !statusEl || !widget) return;

        // Only show widget when actively playing
        if (data.item && data.is_playing) {
            const track = data.item;
            currentProgress = data.progress_ms || 0;
            duration = track.duration_ms || 0;
            lastUpdateTime = Date.now();
            isPlaying = true;
            statusEl.textContent = 'Listening to Spotify';

            if (logoEl && track.external_urls?.spotify) {
                logoEl.href = track.external_urls.spotify;
                logoEl.style.display = 'inline-block';
            }

            if (currentTrackId !== track.id) {
                currentTrackId = track.id;
                contentEl.innerHTML = renderTrack(track);
                // Cache DOM elements after render
                progressBar = document.querySelector('.spotify-widget__progress-fill');
                currentTimeEl = document.querySelector('.spotify-widget__time-current');
                animateTrackInfo();
            }

            showWidget(widget);
            startProgressTracking();
        } else {
            // Hide widget when not playing
            isPlaying = false;
            progressBar = null;
            currentTimeEl = null;
            hideWidget(widget);
            if (logoEl) logoEl.style.display = 'none';
            stopProgressTracking();
        }
    }

    async function fetchAndUpdate() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            updateWidget(data);
        } catch (error) {
            const widget = document.querySelector('#spotify-widget');
            if (widget) {
                isPlaying = false;
                hideWidget(widget);
            }
            stopProgressTracking();
        }
    }

    function init() {
        const widget = document.querySelector('#spotify-widget');
        if (!widget) return;

        fetchAndUpdate();
        setInterval(fetchAndUpdate, UPDATE_INTERVAL);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    window.SpotifyWidget = { init };
})();
