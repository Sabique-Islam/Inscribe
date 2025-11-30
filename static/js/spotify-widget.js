(function() {
    'use strict';

    const API_URL = 'https://sabique.vercel.app/api/spotify/now-playing';
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
    let lastPlayedTrack = null;

    function formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function updateProgress() {
        if (!isPlaying || !progressBar || !currentTimeEl || duration <= 0) return;
        const now = Date.now();
        currentProgress = Math.min(currentProgress + (now - lastUpdateTime), duration);
        lastUpdateTime = now;
        progressBar.style.width = `${(currentProgress / duration) * 100}%`;
        currentTimeEl.textContent = formatTime(currentProgress);
    }

    function startProgressTracking() {
        if (progressTimer) clearInterval(progressTimer);
        progressTimer = setInterval(updateProgress, PROGRESS_INTERVAL);
    }

    function stopProgressTracking() {
        if (progressTimer) {
            clearInterval(progressTimer);
            progressTimer = null;
        }
    }

    function setLogoRotation(spinning) {
        const logoEl = document.querySelector('#spotify-logo');
        if (logoEl) logoEl.classList.toggle('spinning', spinning);
    }

    function renderTrack(track, showProgress) {
        const artists = Array.isArray(track.artists)
            ? track.artists.map(a => escapeHtml(typeof a === 'string' ? a : a.name)).join(', ')
            : escapeHtml(track.artist || 'Unknown Artist');
        const albumImage = track.albumImageUrl || track.album?.images?.[0]?.url || '';
        const albumName = typeof track.album === 'string' ? track.album : (track.album?.name || 'Unknown Album');
        const trackName = track.title || track.name || 'Unknown Track';

        return `
            <div class="spotify-widget__track">
                <img src="${escapeHtml(albumImage)}" alt="${escapeHtml(albumName)}" width="60" height="60" 
                     class="spotify-widget__album-art${showProgress ? '' : ' not-playing'}" onload="this.classList.add('loaded')">
                <div class="spotify-widget__track-info">
                    <div class="spotify-widget__track-name">${escapeHtml(trackName)}</div>
                    <div class="spotify-widget__artist">by ${artists}</div>
                    <div class="spotify-widget__album">on ${escapeHtml(albumName)}</div>
                </div>
            </div>
            ${showProgress ? `<div class="spotify-widget__progress"><div class="spotify-widget__progress-fill"></div></div>
            <div class="spotify-widget__time"><span class="spotify-widget__time-current">${formatTime(currentProgress)}</span><span class="spotify-widget__time-total">${formatTime(duration)}</span></div>` : ''}
        `;
    }

    function animateTrackInfo() {
        document.querySelector('.spotify-widget__track-info')?.classList.add('loaded');
        document.querySelector('.spotify-widget__time')?.classList.add('loaded');
    }

    function updateWidget(data) {
        const contentEl = document.querySelector('#spotify-content');
        const statusEl = document.querySelector('#status-text');
        const logoEl = document.querySelector('#spotify-logo');
        const widget = document.querySelector('#spotify-widget');

        if (!contentEl || !statusEl || !widget) return;

        const track = data.item || data;
        const playing = data.is_playing ?? data.isPlaying ?? false;
        const hasTrack = track && (track.name || track.title);

        if (hasTrack) {
            lastPlayedTrack = track;
            const trackUrl = track.external_urls?.spotify || track.songUrl || track.url;

            if (playing) {
                currentProgress = data.progress_ms || data.progressMs || 0;
                duration = track.duration_ms || track.durationMs || 0;
                lastUpdateTime = Date.now();
                isPlaying = true;
                statusEl.textContent = 'Listening to Spotify';
                setLogoRotation(true);

                if (logoEl && trackUrl) {
                    logoEl.href = trackUrl;
                    logoEl.style.display = 'inline-block';
                }

                if (currentTrackId !== (track.id || track.title)) {
                    currentTrackId = track.id || track.title;
                    contentEl.innerHTML = renderTrack(track, true);
                    progressBar = document.querySelector('.spotify-widget__progress-fill');
                    currentTimeEl = document.querySelector('.spotify-widget__time-current');
                    animateTrackInfo();
                }
                startProgressTracking();
            } else {
                isPlaying = false;
                stopProgressTracking();
                setLogoRotation(false);
                statusEl.textContent = 'Last Played :)';

                if (logoEl && trackUrl) {
                    logoEl.href = trackUrl;
                    logoEl.style.display = 'inline-block';
                }
                contentEl.innerHTML = renderTrack(track, false);
                animateTrackInfo();
            }
        } else if (lastPlayedTrack) {
            isPlaying = false;
            stopProgressTracking();
            setLogoRotation(false);
            statusEl.textContent = 'Last Played :)';

            const trackUrl = lastPlayedTrack.external_urls?.spotify || lastPlayedTrack.songUrl || lastPlayedTrack.url;
            if (logoEl && trackUrl) {
                logoEl.href = trackUrl;
                logoEl.style.display = 'inline-block';
            }
            contentEl.innerHTML = renderTrack(lastPlayedTrack, false);
            animateTrackInfo();
        } else {
            setLogoRotation(false);
            statusEl.textContent = 'Connecting to Spotify...';
            contentEl.innerHTML = '<p style="color: rgba(0, 0, 0, 0.6); font-size: 14px;">Loading...</p>';
            if (logoEl) logoEl.style.display = 'none';
        }
    }

    async function fetchAndUpdate() {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            if (response.status === 204 || !data || Object.keys(data).length === 0) {
                if (lastPlayedTrack) updateWidget({ isPlaying: false, ...lastPlayedTrack });
                return;
            }
            updateWidget(data);
        } catch {
            if (lastPlayedTrack) {
                isPlaying = false;
                stopProgressTracking();
                setLogoRotation(false);
                document.querySelector('#status-text').textContent = 'Last Played :)';
                document.querySelector('#spotify-content').innerHTML = renderTrack(lastPlayedTrack, false);
            }
        }
    }

    function init() {
        const widget = document.querySelector('#spotify-widget');
        if (!widget) return;
        widget.style.display = 'block';
        widget.classList.add('show');
        fetchAndUpdate();
        setInterval(fetchAndUpdate, UPDATE_INTERVAL);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

