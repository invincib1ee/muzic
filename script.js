// ===== Music45 (JioSaavn integration + localStorage for Recently Played + Music Banner + LrcLib lyrics) =====

// Initialize Lucide icons
function refreshIcons() {
  try {
    lucide.createIcons();
    console.log('Lucide icons initialized');
  } catch (e) {
    console.error('Failed to initialize Lucide icons:', e);
  }
}

// Add this function to fetch song suggestions
async function fetchSongSuggestions(songId) {
  try {
    const res = await fetch(`https://music45-api.vercel.app/api/songs/${songId}/suggestions`);
    const data = await res.json();
    return data?.data?.results || data?.data || [];
  } catch (e) {
    console.error('Failed to fetch suggestions', e);
    return [];
  }
}

// Optional: Add a function to manually get suggestions for the current song
async function playSuggestions() {
  const currentSong = queue[currentIndex];
  if (!currentSong || !currentSong.id) return;

  const suggestions = await fetchSongSuggestions(currentSong.id);
  if (suggestions.length > 0) {
    const suggestedQueue = suggestions.map(s => ({
      id: s.id,
      title: getTitle(s),
      artist: getArtist(s),
      cover: getCover(s),
      url: null,
      raw: s
    }));

    queue = suggestedQueue;
    currentIndex = 0;
    await playIndex(0);
  }
}

// Ensure DOM is loaded before attaching listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  refreshIcons();

  // Greeting
  (function setGreeting() {
    const hour = new Date().getHours();
    const greetingEl = document.getElementById('greeting');
    if (greetingEl) {
      greetingEl.textContent =
        hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    } else {
      console.error('Greeting element not found');
    }
  })();

  // DOM refs
  const audio = document.getElementById('audio');
  const imgEl = document.getElementById('current-track-image');
  const titleEl = document.getElementById('current-track-title');
  const artistEl = document.getElementById('current-track-artist');
  const playBtn = document.getElementById('btn-play');
  const playIcon = document.getElementById('play-icon');
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const progressTrack = document.getElementById('progress-track');
  const progressFill = document.getElementById('progress-fill');
  const albumsWrap = document.getElementById('albums');
  const recentlyWrap = document.getElementById('recently');
  const newReleasesWrap = document.getElementById('new-releases');
  const musicBanner = document.getElementById('music-banner');
  const bannerCover = document.getElementById('banner-cover-image');
  const bannerTitle = document.getElementById('banner-song-title');
  const bannerArtist = document.getElementById('banner-artist-name');
  const bannerPlayPauseBtn = document.getElementById('banner-play-pause');
  const bannerPlayIcon = document.getElementById('banner-play-icon');
  const bannerPrev = document.getElementById('banner-prev');
  const bannerNext = document.getElementById('banner-next');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const repeatBtn = document.getElementById('repeat-btn');
  const closeBannerBtn = document.getElementById('close-banner-btn');
  const bannerProgressTrack = document.getElementById('banner-progress-track');
  const bannerProgressFill = document.getElementById('banner-progress-fill');
  const bannerProgressHandle = document.getElementById('progress-handle-circle');
  const currentTimeEl = document.getElementById('current-time');
  const durationEl = document.getElementById('duration');
  const shufflePopup = document.getElementById('shuffle-popup');
  const shuffleStatus = document.getElementById('shuffle-status');
  const repeatPopup = document.getElementById('repeat-popup');
  const repeatStatus = document.getElementById('repeat-status');
  const openBanner = document.getElementById('open-banner');

  // Compact Footer refs
  const compactFooter = document.getElementById('compact-footer');
  const footerTrackImage = document.getElementById('footer-track-image');
  const footerTrackTitle = document.getElementById('footer-track-title');
  const footerTrackArtist = document.getElementById('footer-track-artist');
  const footerPlayBtn = document.getElementById('footer-btn-play');
  const footerPlayIcon = document.getElementById('footer-play-icon');
  const footerNextBtn = document.getElementById('footer-btn-next');
  const footerProgressFill = document.getElementById('footer-progress-fill');
  const footerOpenBanner = document.getElementById('footer-open-banner');

  // Lyrics DOM (these may not exist if you forgot to add HTML — code handles that)
  const lyricsContainer = document.getElementById('lyrics-container'); // for synced-lines
  const lyricsText = document.getElementById('lyrics-text'); // for plain lyrics or fallback


  // Log DOM elements for debugging
  console.log('closeBannerBtn:', closeBannerBtn);
  console.log('musicBanner:', musicBanner);
  console.log('lyricsContainer:', !!lyricsContainer, 'lyricsText:', !!lyricsText);

  // State
  let queue = [];
  let currentIndex = -1;
  let isPlaying = false;
  let recentlyPlayed = [];
  let shuffleMode = false;
  let repeatMode = false;
  let qualitySetting = localStorage.getItem('qualitySetting') || 'auto';
  let queueSource = 'generic';

  // Pagination State
  let currentViewId = null;
  let currentViewType = null; // 'album' or 'playlist'
  let currentViewPage = 1;
  let currentViewTotal = 0;
  let currentLoadedCount = 0;

  // Helpers
  const FALLBACK_COVER = 'LOGO.jpg'; // Local fallback image
  const escapeHtml = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' })[c]);
  const getTitle = s => decodeHtmlEntities(s?.name || s?.song || s?.title || 'Unknown Title');
  const getArtist = s => {
    let a =
      s?.primaryArtists ||
      s?.primary_artists ||
      (s?.artists?.primary?.length ? s.artists.primary.map(a => a.name).join(', ') : null) ||
      (s?.artists?.featured?.length ? s.artists.featured.map(a => a.name).join(', ') : null) ||
      s?.singers ||
      s?.artist ||
      'Unknown Artist';
    return decodeHtmlEntities(a);
  };
  const getCover = s => {
    if (!s) return FALLBACK_COVER;
    if (Array.isArray(s.image) && s.image.length) {
      const best = s.image.find(i => i.quality && /500|b|large|high/i.test(i.quality)) || s.image[s.image.length - 1];
      return best.link || best.url || FALLBACK_COVER;
    }
    return s.image_url || s.image || FALLBACK_COVER;
  };

  function decodeHtmlEntities(str) {
    if (!str) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  }

  function formatTime(seconds) {
    if (!isFinite(seconds)) return '00:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  function extractPlayableUrl(details, quality = qualitySetting) {
    if (!details) return null;
    const dl = details.downloadUrl || details.download_url;
    if (Array.isArray(dl) && dl.length) {
      if (quality === 'auto') {
        return dl[dl.length - 1].link || dl[dl.length - 1].url || null;
      }
      if (quality === 'Less_low') {
        const lessLow = dl.find(x => /48/i.test(x.quality));
        if (lessLow) return lessLow.link || lessLow.url;
      }
      if (quality === 'low') {
        const low = dl.find(x => /96/i.test(x.quality));
        if (low) return low.link || low.url;
      }
      if (quality === 'medium') {
        const med = dl.find(x => /160/i.test(x.quality));
        if (med) return med.link || med.url;
      }
      if (quality === 'high') {
        const high = dl.find(x => /320/i.test(x.quality));
        if (high) return high.link || high.url;
      }
      return dl[dl.length - 1].link || dl[dl.length - 1].url || null;
    }
    return details.media_url || details.url || details.audio || null;
  }


  // Add to your existing DOM refs
  const flipInner = document.getElementById('flip-inner');
  const showLyricsBtn = document.getElementById('show-lyrics-btn'); // Removed in HTML but kept ref for safety or remove
  const showCoverBtn = document.getElementById('show-cover-btn'); // Removed in HTML

  // Flip functionality with smart button visibility
  // Flip functionality - Click Cover to Open Lyrics
  if (bannerCover) {
    bannerCover.addEventListener('click', () => {
      // Toggle lyrics view
      if (!flipInner.classList.contains('flipped')) {
        flipInner.classList.add('flipped');
        history.pushState({ bannerView: true, lyricsView: true }, 'Lyrics', '#lyrics');
      }
    });
  }

  // Click lyrics area to close (go back)
  const lyricsClickArea = document.getElementById('lyrics-click-area');
  if (lyricsClickArea) {
    lyricsClickArea.addEventListener('click', (e) => {
      // Only close if clicking the header/click area, not necessarily the text selection?
      // Actually user wants "first back lyrics close", but clicking the area (header) is a good alternative.
      history.back();
    });
  }

  // Update lyrics display function with compact styling
  function renderSyncedLyrics(lrcText) {
    const lyricsContainer = document.getElementById('lyrics-container');
    if (!lyricsContainer) return;

    lyricsContainer.innerHTML = '';

    if (!lrcText) {
      lyricsContainer.innerHTML = '<p style="font-size:0.5rem; opacity:0.6;">No lyrics available</p>';
      return;
    }

    // Your existing lyrics parsing logic...
    // Add parsed lines to lyricsContainer with 'lyrics-line' class
  }

  // Lyrics parsing state
  let parsedLyrics = [];

  function clearLyricsDisplay() {
    parsedLyrics = [];
    if (lyricsContainer) lyricsContainer.innerHTML = '';
    if (lyricsText) lyricsText.textContent = '';
  }

  function renderSyncedLyrics(lrcText) {
    clearLyricsDisplay();
    if (!lrcText) return;

    // tolerate different time formats: [mm:ss.xx] or [m:ss] etc.
    const lines = lrcText.split('\n');
    parsedLyrics = lines.map(line => {
      line = line.trim();
      if (!line) return null;

      // 1. Try standard LRC: [mm:ss.xx]
      const tsMatches = [...line.matchAll(/\[(\d{1,2}):(\d{2}(?:\.\d+)?)\]/g)];
      if (tsMatches.length > 0) {
        const text = line.replace(/\[(\d{1,2}):(\d{2}(?:\.\d+)?)\]/g, '').trim();
        return tsMatches.map(m => {
          const min = parseInt(m[1], 10);
          const sec = parseFloat(m[2]);
          return { time: min * 60 + sec, text: text || '' };
        });
      }

      // 2. Try format: HH:MM:SS.mmm ~ HH:MM:SS.mmm Text (or similar)
      // Example: 00:01:37.290 ~ 00:01:39.770  Ni dell mull...
      // Regex: Start with HH:MM:SS.mmm or MM:SS.mmm
      const complexMatch = line.match(/^(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/);
      if (complexMatch) {
        const h = parseInt(complexMatch[1], 10);
        const m = parseInt(complexMatch[2], 10);
        const s = parseFloat(complexMatch[3]);
        const time = h * 3600 + m * 60 + s;

        // Remove the timestamp(s) part to get text
        // Matches "Start ~ End" or just "Start"
        let text = line.replace(/^[\d:.]+(\s*~\s*[\d:.]+)?\s*/, '').trim();
        // Remove trailing slash if present
        text = text.replace(/\/$/, '').trim();

        return [{ time, text }];
      }

      return null;
    }).filter(Boolean).flat().sort((a, b) => a.time - b.time);

    if (!parsedLyrics.length) {
      // fallback: just show raw text
      if (lyricsText) lyricsText.textContent = lrcText;
      else if (lyricsContainer) lyricsContainer.innerHTML = `<p>${escapeHtml(lrcText)}</p>`;
      return;
    }

    if (lyricsContainer) {
      lyricsContainer.innerHTML = '';
      parsedLyrics.forEach((l, i) => {
        const p = document.createElement('p');
        p.textContent = l.text || '...';
        p.dataset.time = l.time;
        p.classList.toggle('lyrics-line', true);
        lyricsContainer.appendChild(p);
      });
    } else if (lyricsText) {
      // if there's no container for synced lines, display them as plain text
      lyricsText.textContent = parsedLyrics.map(p => p.text).join('\n');
    }
  }

  async function fetchLyrics(title, artist, duration) {
    // defensive: require at least a title
    if (!title && !artist) return;
    // show loading
    if (lyricsText) lyricsText.textContent = 'Loading lyrics...';
    if (lyricsContainer) lyricsContainer.innerHTML = '<p>Loading lyrics…</p>';
    parsedLyrics = [];

    const normalize = (s) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

    try {
      let data = null;
      let fallbackData = null;

      // Helper for language check
      const isLatin = (s) => {
        if (!s) return false;
        const latinCount = (s.match(/[a-zA-Z]/g) || []).length;
        const nonLatinCount = (s.match(/[^\x00-\x7F]/g) || []).length;
        return latinCount > nonLatinCount;
      };

      // 1. Try exact match first (only if we don't have a specific reason to skip, but search is often better for fuzzy)
      // Actually, let's try search directly if we want to prioritize synced lyrics across variations, 
      // but 'get' is faster if it works. We'll try 'get' first.
      const urlGet = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title || '')}&artist_name=${encodeURIComponent(artist || '')}&duration=${duration || ''}`;
      const resGet = await fetch(urlGet);

      if (resGet.ok) {
        const exactData = await resGet.json();
        if (exactData.syncedLyrics) {
          // Check if it matches our language preference (Latin)
          if (isLatin(exactData.syncedLyrics)) {
            data = exactData;
          } else {
            console.log('Exact match found but not Latin, saving as fallback and trying search...');
            fallbackData = exactData;
          }
        }
      }

      // 2. If no exact synced lyrics found, try search to find *any* version with synced lyrics
      if (!data) {
        console.log('Exact synced match not found, trying search...');
        // Use primary artist for search to avoid separator mismatches (e.g. "," vs "&")
        // This solves issues where our metadata has "A, B" but LrcLib has "A & B"
        const primaryArtist = artist ? artist.split(/,|&|\band\b|\bfeat\.?\b|\bft\.?\b|\/|\+/i)[0].trim() : artist;
        const urlSearch = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title || '')}&artist_name=${encodeURIComponent(primaryArtist || '')}`;
        const resSearch = await fetch(urlSearch);

        if (resSearch.ok) {
          const results = await resSearch.json();
          if (Array.isArray(results) && results.length > 0) {
            const targetTitle = normalize(title);

            // Helper to split artist string into individual normalized tokens
            const getArtistTokens = (s) => {
              if (!s) return [];
              const decoded = decodeHtmlEntities(s);
              // Split by comma, &, 'and', 'feat.', 'ft.', '/', '+'
              return decoded.toLowerCase().split(/,|&|\band\b|\bfeat\.\b|\bft\.\b|\/|\+/).map(t => t.trim().replace(/[^a-z0-9]/g, '')).filter(t => t.length > 0);
            };

            const targetArtistTokens = getArtistTokens(artist);

            // Filter candidates
            const candidates = results.filter(item => {
              const itemTitle = normalize(item.trackName);

              // Title check: allow partial match
              if (!itemTitle.includes(targetTitle) && !targetTitle.includes(itemTitle)) return false;

              // Artist check: Robust multi-artist matching
              const itemArtistTokens = getArtistTokens(item.artistName);

              // Check if ANY of the target artists match ANY of the item artists
              // OR if the full normalized strings contain each other (fallback)
              const hasTokenMatch = targetArtistTokens.some(t => itemArtistTokens.some(i => i.includes(t) || t.includes(i)));

              if (hasTokenMatch) return true;

              // Fallback: Check full string inclusion for cases where splitting failed
              const itemArtist = normalize(item.artistName);
              const targetArtist = normalize(artist);
              return itemArtist.includes(targetArtist) || targetArtist.includes(itemArtist);
            });

            // Sort candidates to find the best one
            candidates.sort((a, b) => {
              // Priority 1: Has Synced Lyrics
              const aSynced = !!a.syncedLyrics;
              const bSynced = !!b.syncedLyrics;
              if (aSynced && !bSynced) return -1;
              if (!aSynced && bSynced) return 1;

              // Priority 2: Duration Match (if available)
              if (duration) {
                const dur = parseFloat(duration);
                const aDur = parseFloat(a.duration);
                const bDur = parseFloat(b.duration);
                if (!isNaN(dur) && !isNaN(aDur) && !isNaN(bDur)) {
                  const aDiff = Math.abs(aDur - dur);
                  const bDiff = Math.abs(bDur - dur);
                  // If difference is significant (e.g. > 2s difference between candidates), prefer closer one
                  if (Math.abs(aDiff - bDiff) > 2) {
                    return aDiff - bDiff;
                  }
                }
              }

              // Priority 3: Language Preference (English/Latin script preferred)
              // This helps choose Hinglish/English over Devanagari/Other scripts
              // Priority 3: Language Preference (English/Latin script preferred)
              // This helps choose Hinglish/English over Devanagari/Other scripts
              // isLatin is defined above

              const aText = a.plainLyrics || a.syncedLyrics || "";
              const bText = b.plainLyrics || b.syncedLyrics || "";
              const aIsLatin = isLatin(aText);
              const bIsLatin = isLatin(bText);

              if (aIsLatin && !bIsLatin) return -1;
              if (!aIsLatin && bIsLatin) return 1;

              // Priority 4: Title Length (closer to original title length is usually better)
              const aLenDiff = Math.abs(normalize(a.trackName).length - targetTitle.length);
              const bLenDiff = Math.abs(normalize(b.trackName).length - targetTitle.length);
              return aLenDiff - bLenDiff;
            });

            if (candidates.length > 0) {
              data = candidates[0];
            }
          }
        }
      }

      // If we didn't find a better match in search, use the fallback (non-Latin exact match)
      if (!data && fallbackData) {
        data = fallbackData;
      }

      if (!data) throw new Error('No lyrics found');

      // Render Logic
      let lrc = null;
      if (data?.syncedLyrics) lrc = data.syncedLyrics;
      else if (data?.lrc) lrc = data.lrc;
      else if (data?.plainLyrics) {
        if (lyricsText) lyricsText.textContent = data.plainLyrics;
        if (lyricsContainer) lyricsContainer.innerHTML = `<p>${escapeHtml(data.plainLyrics)}</p>`;
        return;
      } else if (data?.lyrics) {
        if (typeof data.lyrics === 'string') {
          if (/\[\d{1,2}:\d{2}/.test(data.lyrics)) lrc = data.lyrics;
          else {
            if (lyricsText) lyricsText.textContent = data.lyrics;
            if (lyricsContainer) lyricsContainer.innerHTML = `<p>${escapeHtml(data.lyrics)}</p>`;
            return;
          }
        }
      }

      if (lrc) {
        renderSyncedLyrics(lrc);
      } else {
        if (lyricsText) lyricsText.textContent = 'No lyrics available.';
        if (lyricsContainer) lyricsContainer.innerHTML = `<p>No lyrics available.</p>`;
      }
    } catch (err) {
      console.error('Lyrics fetch failed', err);
      if (lyricsText) lyricsText.textContent = 'No lyrics found.';
      if (lyricsContainer) lyricsContainer.innerHTML = `<p>No lyrics found.</p>`;
    }
  }

  // UI Updates
  function updateUI(item, playing) {
    const cover = item?.cover || FALLBACK_COVER;
    const title = item?.title || 'No song';
    const artist = item?.artist || '—';

    // Update floating player
    if (imgEl) imgEl.src = cover;
    if (titleEl) titleEl.textContent = title;
    if (artistEl) artistEl.textContent = artist;
    if (playBtn) playBtn.innerHTML = playing ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';

    // Update compact footer
    if (footerTrackImage) footerTrackImage.src = cover;
    if (footerTrackTitle) footerTrackTitle.textContent = title;
    if (footerTrackArtist) footerTrackArtist.textContent = artist;
    if (footerPlayBtn) footerPlayBtn.innerHTML = playing ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';

    // Show/hide compact footer based on whether we have a song
    if (compactFooter) {
      if (item && title !== 'No song') {
        compactFooter.style.display = 'flex';
        compactFooter.classList.add('active');
      } else {
        compactFooter.style.display = 'none';
        compactFooter.classList.remove('active');
      }
    }
    // Update music banner
    if (bannerCover) bannerCover.src = cover;
    if (bannerTitle) bannerTitle.textContent = title;
    if (bannerArtist) bannerArtist.textContent = artist;
    if (bannerPlayPauseBtn) bannerPlayPauseBtn.innerHTML = playing ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
    if (document.querySelector('.player-container')) {
      document.querySelector('.player-container').style.setProperty('--banner-cover-url', `url("${cover}")`);
    }

    refreshIcons();
  }

  // Recently Played
  function saveRecentlyToStorage() {
    localStorage.setItem('recentSongs', JSON.stringify(recentlyPlayed));
  }

  function loadRecentlyFromStorage() {
    try {
      const data = JSON.parse(localStorage.getItem('recentSongs')) || [];
      recentlyPlayed = data;
    } catch (e) {
      recentlyPlayed = [];
    }
    renderRecently();
  }

  function addToRecently(item) {
    if (!item) return;
    const key = item.id ? 'id:' + item.id : 't:' + item.title;
    // Include the current quality setting in the item
    recentlyPlayed = recentlyPlayed.filter(x => x._k !== key);
    recentlyPlayed.unshift({ ...item, _k: key, quality: qualitySetting });
    recentlyPlayed = recentlyPlayed.slice(0, 12);
    saveRecentlyToStorage();
    renderRecently();
  }

  function renderRecently() {
    if (!recentlyWrap) return;
    recentlyWrap.innerHTML = '';
    recentlyPlayed.forEach(item => {
      const card = document.createElement('div');
      card.className = 'music-card';
      card.innerHTML = `
        <img src="${escapeHtml(item.cover || FALLBACK_COVER)}" alt="${escapeHtml(item.title)}">
        <span>${escapeHtml(item.title)}</span>
      `;
      card.addEventListener('click', () => {
        queue = [item];
        currentIndex = 0;
        playIndex(0);
      });
      recentlyWrap.appendChild(card);
    });
  }

  // Search and Queue
  async function searchAndQueue(query, autoplay = true) {
    if (!query) return;
    try {
      const res = await fetch(`https://music45-api.vercel.app/api/search/songs?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      const results = data?.data?.results || [];
      queue = results.map(r => ({
        id: r.id,
        title: getTitle(r),
        artist: getArtist(r),
        cover: getCover(r),
        url: null,
        raw: r
      }));
      currentIndex = queue.length ? 0 : -1;
      if (autoplay && currentIndex >= 0) await playIndex(currentIndex);
    } catch (e) {
      console.error('Search failed', e);
      alert('Search failed. Try another query.');
    }
  }

  async function ensureUrlFor(index, quality = qualitySetting) {
    const item = queue[index];
    if (!item) return null;
    if (item.url) return item.url;
    try {
      const res = await fetch(`https://music45-api.vercel.app/api/songs?ids=${encodeURIComponent(item.id)}`);
      const d = await res.json();
      const full = d?.data?.[0] || d?.data || null;
      if (!full) return null;
      item.url = extractPlayableUrl(full, quality);  // Pass quality to extractPlayableUrl
      item.title = getTitle(full) || item.title;
      item.artist = getArtist(full) || item.artist;
      item.cover = getCover(full) || item.cover;
      item.duration = full.duration || item.duration;
      return item.url || null;
    } catch (e) {
      console.error('Details failed', e);
      return null;
    }
  }

  async function playIndex(index) {
    if (index < 0 || index >= queue.length) return;
    const item = queue[index];
    const quality = item.quality || qualitySetting;  // Use the item's quality if available, else global

    // Update UI immediately (cover/title) then load url
    updateUI(item, false);

    const url = await ensureUrlFor(index, quality);
    if (!url) {
      alert('No playable URL found for this track.');
      return;
    }

    // Clear previous lyrics while we fetch new ones
    clearLyricsDisplay();

    audio.src = url;
    try {
      await audio.play();
      isPlaying = true;
    } catch (e) {
      console.error('Play failed', e);
      isPlaying = false;
    }

    currentIndex = index;
    updateUI(item, isPlaying);
    addToRecently(item);
    setMediaSession(item);

    // Fetch lyrics for this track (non-blocking)
    try {
      fetchLyrics(item.title || getTitle(item.raw), item.artist || getArtist(item.raw), item.duration || item.raw?.duration);
    } catch (e) {
      console.error('fetchLyrics threw', e);
    }
  }

  async function nextSong() {
    if (!queue.length) {
      const last = (recentlyPlayed && recentlyPlayed[0]) || null;
      if (last && last.id) {
        const suggestions = await fetchSongSuggestions(last.id);
        if (suggestions.length > 0) {
          const suggestedQueue = suggestions.map(s => ({
            id: s.id,
            title: getTitle(s),
            artist: getArtist(s),
            cover: getCover(s),
            url: null,
            raw: s
          }));
          queue = suggestedQueue;
          currentIndex = 0;
          await playIndex(0);
        }
      }
      return;
    }
    const currentSong = queue[currentIndex];
    const atEnd = currentIndex >= queue.length - 1;
    if ((atEnd || queue.length === 1) && currentSong && currentSong.id) {
      const suggestions = await fetchSongSuggestions(currentSong.id);
      if (suggestions.length > 0) {
        const suggestedQueue = suggestions.map(s => ({
          id: s.id,
          title: getTitle(s),
          artist: getArtist(s),
          cover: getCover(s),
          url: null,
          raw: s
        }));
        queue = suggestedQueue;
        currentIndex = 0;
        await playIndex(0);
        return;
      } else {
        isPlaying = false;
        updateUI(queue[currentIndex], false);
        return;
      }
    }
    let n;
    if (shuffleMode) {
      n = Math.floor(Math.random() * queue.length);
      if (queue.length > 1 && n === currentIndex) n = (n + 1) % queue.length;
    } else {
      n = (currentIndex + 1) % queue.length;
    }
    await playIndex(n);
  }

  async function prevSong() {
    if (!queue.length) return;
    let n;
    if (shuffleMode) {
      n = Math.floor(Math.random() * queue.length);
      if (queue.length > 1 && n === currentIndex) n = (n + 1) % queue.length;
    } else {
      n = (currentIndex - 1 + queue.length) % queue.length;
    }
    await playIndex(n);
  }

  async function togglePlay() {
    if (!audio.src) {
      await searchAndQueue('90s hindi', true);
      return;
    }
    if (audio.paused) {
      try {
        await audio.play();
        isPlaying = true;
      } catch (e) {
        console.error('Play failed', e);
      }
    } else {
      audio.pause();
      isPlaying = false;
    }
    updateUI(queue[currentIndex], isPlaying);
  }

  // Progress and Time (single consolidated handler; also does lyrics sync)
  audio.addEventListener('timeupdate', () => {
    const cur = audio.currentTime || 0;
    const dur = audio.duration || 0;
    const pct = dur > 0 ? (cur / dur) * 100 : 0;
    if (progressFill) progressFill.style.width = pct + '%';
    if (bannerProgressFill) bannerProgressFill.style.width = pct + '%';
    if (bannerProgressHandle) bannerProgressHandle.style.left = pct + '%';
    if (footerProgressFill) footerProgressFill.style.width = pct + '%';
    if (currentTimeEl) currentTimeEl.textContent = formatTime(cur);
    if (durationEl) durationEl.textContent = formatTime(dur);

    // === Lyrics sync ===
    if (parsedLyrics && parsedLyrics.length && lyricsContainer) {
      // find current active index
      let activeIndex = parsedLyrics.findIndex((l, i) =>
        cur >= l.time && (!parsedLyrics[i + 1] || cur < parsedLyrics[i + 1].time)
      );

      if (activeIndex >= 0) {
        // Don't focus on the last line
        const isLastLine = activeIndex === parsedLyrics.length - 1;

        // toggle active classes
        const children = [...lyricsContainer.children];
        children.forEach((p, i) => {
          p.classList.toggle('active-line', i === activeIndex && !isLastLine);

          // Only scroll if it's not the last line
          if (i === activeIndex && !isLastLine) {
            try {
              p.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch (e) { /* ignore scroll errors on some devices */ }
          }
        });
      }
    }
  });

  // Click-to-seek handler for the main (non-banner) player
  if (progressTrack) {
    progressTrack.addEventListener('click', e => {
      const rect = progressTrack.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      if (isFinite(audio.duration)) audio.currentTime = Math.max(0, Math.min(1, pct)) * audio.duration;
    });
  }

  // Enhanced seeking logic (drag and click) for the music banner progress bar
  let isSeeking = false;

  function handleSeek(e) {
    if (!isFinite(audio.duration)) return;

    e.preventDefault();

    const trackRect = bannerProgressTrack.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;

    let percent = (clientX - trackRect.left) / trackRect.width;
    percent = Math.max(0, Math.min(1, percent));

    const newTime = percent * audio.duration;
    audio.currentTime = newTime;

    // Immediate UI update for responsiveness
    const pct = percent * 100;
    if (bannerProgressFill) bannerProgressFill.style.width = pct + '%';
    if (bannerProgressHandle) bannerProgressHandle.style.left = pct + '%';
  }

  function startSeeking(e) {
    isSeeking = true;
    handleSeek(e);

    document.addEventListener('mousemove', handleSeek);
    document.addEventListener('touchmove', handleSeek, { passive: false });

    document.addEventListener('mouseup', stopSeeking);
    document.addEventListener('touchend', stopSeeking);
  }

  function stopSeeking() {
    isSeeking = false;
    document.removeEventListener('mousemove', handleSeek);
    document.removeEventListener('touchmove', handleSeek);
    document.removeEventListener('mouseup', stopSeeking);
    document.removeEventListener('touchend', stopSeeking);
  }

  if (bannerProgressTrack) {
    bannerProgressTrack.addEventListener('mousedown', startSeeking);
    bannerProgressTrack.addEventListener('touchstart', startSeeking, { passive: false });
  }

  audio.addEventListener('play', () => {
    isPlaying = true;
    updateUI(queue[currentIndex], true);
  });

  audio.addEventListener('pause', () => {
    isPlaying = false;
    updateUI(queue[currentIndex], false);
  });

  // MODIFIED: Ended event listener with suggestions
  audio.addEventListener('ended', async () => {
    if (repeatMode) {
      playIndex(currentIndex);
    } else {
      // Check if we're at the end of the current queue
      if (currentIndex >= queue.length - 1) {
        // Get current song ID for suggestions
        const currentSong = queue[currentIndex];
        if (currentSong && currentSong.id) {
          // Fetch suggestions based on current song
          const suggestions = await fetchSongSuggestions(currentSong.id);

          if (suggestions.length > 0) {
            // Convert suggestions to queue format
            const suggestedQueue = suggestions.map(s => ({
              id: s.id,
              title: getTitle(s),
              artist: getArtist(s),
              cover: getCover(s),
              url: null,
              raw: s
            }));

            // Add suggestions to queue and play the first one
            queue = suggestedQueue;
            currentIndex = 0;
            await playIndex(0);
            return;
          } else if (queueSource === 'search-single') {
            isPlaying = false;
            updateUI(queue[currentIndex], false);
            return;
          }
        } else if (queueSource === 'search-single') {
          isPlaying = false;
          updateUI(queue[currentIndex], false);
          return;
        }
      }

      // If no suggestions or not at end of queue, proceed normally
      nextSong();
    }
  });

  // Media Session
  function setMediaSession(item) {
    if (!('mediaSession' in navigator) || !item) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: item.title,
        artist: item.artist,
        artwork: [{ src: item.cover || FALLBACK_COVER, sizes: '512x512', type: 'image/png' }]
      });
      navigator.mediaSession.setActionHandler('play', () => audio.play());
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      navigator.mediaSession.setActionHandler('previoustrack', prevSong);
      navigator.mediaSession.setActionHandler('nexttrack', nextSong);
      navigator.mediaSession.setActionHandler('seekto', e => {
        if (e.seekTime != null) audio.currentTime = e.seekTime;
      });
    } catch (e) {
      console.warn('Media session setup failed', e);
    }
  }

  // Music Banner Controls
  function isMobileDevice() {
    const isMobile = window.innerWidth <= 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    console.log('isMobileDevice:', isMobile);
    return isMobile;
  }

  const settingsSheet = document.getElementById('settings-sheet');
  const closeSettings = document.getElementById('close-settings');

  function refreshQualityButtons() {
    document.querySelectorAll('.quality-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.quality === qualitySetting);
    });
  }

  document.querySelectorAll('.quality-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      qualitySetting = btn.dataset.quality;
      localStorage.setItem('qualitySetting', qualitySetting);
      refreshQualityButtons();
    });
  });

  if (document.querySelector('.header-icons button:last-child')) {
    document.querySelector('.header-icons button:last-child').addEventListener('click', () => {
      if (settingsSheet) {
        settingsSheet.classList.add('active');
        refreshQualityButtons();
        history.pushState({ settingsView: true }, 'Settings', '#settings');
      }
    });
  }

  if (closeSettings) {
    closeSettings.addEventListener('click', () => {
      if (settingsSheet) settingsSheet.classList.remove('active');
      if (window.history.state && window.history.state.settingsView) {
        history.back();
      }
    });
  }

  window.addEventListener('popstate', () => {
    console.log('popstate triggered, state:', window.history.state);
    if (window.history.state && window.history.state.settingsView) {
      if (settingsSheet) settingsSheet.classList.add('active');
    } else {
      if (settingsSheet) settingsSheet.classList.remove('active');
    }

    // Lyrics View State Logic
    if (window.history.state && window.history.state.lyricsView) {
      if (flipInner) flipInner.classList.add('flipped');
    } else {
      if (flipInner) flipInner.classList.remove('flipped');
    }

    if (window.history.state && window.history.state.bannerView && isMobileDevice()) {
      if (musicBanner) {
        musicBanner.style.display = 'flex';
        musicBanner.classList.add('active');
      }
    } else {
      if (musicBanner) {
        musicBanner.style.display = 'none';
        musicBanner.classList.remove('active');
      }
    }
    if (!window.history.state || !window.history.state.albumView) {
      const av = document.getElementById('album-view');
      if (av) av.style.display = 'none';
    }
  });

  // Music banner open/close
  // Compact footer controls
  if (footerPlayBtn) footerPlayBtn.addEventListener('click', togglePlay);
  if (footerNextBtn) footerNextBtn.addEventListener('click', nextSong);
  if (footerOpenBanner) {
    footerOpenBanner.addEventListener('click', () => {
      if (isMobileDevice()) {
        if (musicBanner) {
          musicBanner.style.display = 'flex';
          musicBanner.classList.add('active');
          history.pushState({ bannerView: true }, 'Now Playing', '#now-playing');
        }
      }
    });
  }

  if (closeBannerBtn) {
    const closeAction = (e) => {
      // Prevent ghost clicks if using touch
      if (e.type === 'touchstart') {
        e.preventDefault();
      }

      if (musicBanner) {
        musicBanner.style.display = 'none';
        musicBanner.classList.remove('active');

        // Smart back navigation to ensure banner closes completely
        if (window.history.state && window.history.state.lyricsView) {
          // If lyrics are open, we are 2 steps deep (Banner -> Lyrics)
          history.go(-2);
        } else if (window.history.state && window.history.state.bannerView) {
          // If just banner is open
          history.back();
        }
      }
    };

    closeBannerBtn.addEventListener('click', closeAction);
    closeBannerBtn.addEventListener('touchstart', closeAction, { passive: false });
  }

  if (bannerPlayPauseBtn) bannerPlayPauseBtn.addEventListener('click', togglePlay);
  if (bannerPrev) bannerPrev.addEventListener('click', prevSong);
  if (bannerNext) bannerNext.addEventListener('click', nextSong);

  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      shuffleMode = !shuffleMode;
      if (shuffleStatus) shuffleStatus.textContent = shuffleMode ? 'On' : 'Off';
      if (shufflePopup) {
        shufflePopup.classList.add('active');
        setTimeout(() => shufflePopup.classList.remove('active'), 2000);
      }
    });
  }

  if (repeatBtn) {
    repeatBtn.addEventListener('click', () => {
      repeatMode = !repeatMode;
      if (repeatStatus) repeatStatus.textContent = repeatMode ? 'On' : 'Off';
      if (repeatPopup) {
        repeatPopup.classList.add('active');
        setTimeout(() => repeatPopup.classList.remove('active'), 2000);
      }
    });
  }

  // Footer controls
  if (playBtn) playBtn.addEventListener('click', togglePlay);
  if (prevBtn) prevBtn.addEventListener('click', prevSong);
  if (nextBtn) nextBtn.addEventListener('click', nextSong);

  // Albums
  async function loadAlbums(queries) {
    try {
      // Default fallback if no queries provided (backward compatibility)
      const albumQueries = queries || ['Arijit Singh', 'Pritam', 'Shreya Ghoshal', 'kishor kumar', 'A.R. Rahman'];
      const allAlbums = [];

      // Randomize queries to show variety if too many
      const selectedQueries = albumQueries.sort(() => 0.5 - Math.random()).slice(0, 5);

      for (const query of selectedQueries) {
        const res = await fetch(`https://music45-api.vercel.app/api/search/albums?query=${encodeURIComponent(query)}&limit=20`);
        const data = await res.json();
        if (data?.data?.results) {
          // Take more results per language to show 'more' content
          allAlbums.push(...data.data.results.slice(0, 10));
        }
      }
      // Shuffle results
      renderAlbums(allAlbums.sort(() => 0.5 - Math.random()));
    } catch (e) {
      console.error('Failed to load albums', e);
    }
  }

  function renderAlbums(albums) {
    if (!albumsWrap) return;
    albumsWrap.innerHTML = '';
    albums.forEach(album => {
      const card = document.createElement('div');
      card.className = 'music-card';
      card.innerHTML = `
        <img src="${getCover(album)}" alt="${getTitle(album)}">
        <span>${getTitle(album)}</span>
      `;
      card.addEventListener('click', () => {
        playAlbum(album.id);
      });
      albumsWrap.appendChild(card);
    });
  }

  async function playAlbum(albumId) {
    try {
      const res = await fetch(`https://music45-api.vercel.app/api/albums?id=${encodeURIComponent(albumId)}`);
      const data = await res.json();
      const album = data?.data?.[0] || data?.data;
      const songs = album?.songs || [];

      if (!songs.length) {
        alert('No songs found in this album.');
        return;
      }

      const albumCoverEl = document.getElementById('album-cover');
      const albumTitleEl = document.getElementById('album-title');
      const albumStickyTitleEl = document.getElementById('album-sticky-title');
      const albumArtistEl = document.getElementById('album-artist');
      const albumArtistImgEl = document.getElementById('album-artist-img');
      const albumYearEl = document.getElementById('album-year');
      const albumPlayBtn = document.getElementById('album-play');
      const albumViewEl = document.getElementById('album-view');
      const tracksWrap = document.getElementById('album-tracks');
      const albumScroll = document.querySelector('.album-content-scroll');
      const albumStickyHeader = document.querySelector('.album-sticky-header');
      const loadMoreContainer = document.getElementById('album-load-more-container');

      if (loadMoreContainer) loadMoreContainer.style.display = 'none';

      const title = getTitle(album);
      const artist = getArtist(album);
      const cover = getCover(album);
      const year = album.year || '';

      if (albumCoverEl) albumCoverEl.src = cover;
      if (albumTitleEl) albumTitleEl.textContent = title;
      if (albumStickyTitleEl) albumStickyTitleEl.textContent = title;
      if (albumArtistEl) albumArtistEl.textContent = artist;
      if (albumArtistImgEl) albumArtistImgEl.src = cover;
      if (albumYearEl) albumYearEl.textContent = year ? 'Album • ' + year : 'Album';


      if (tracksWrap) {
        tracksWrap.innerHTML = '';
        songs.forEach((s, i) => {
          const div = document.createElement('div');
          div.className = 'album-track';
          div.innerHTML = `
            <span class="track-index">${i + 1}</span>
            <div class="track-name-wrapper">
              <span class="track-title">${getTitle(s)}</span>
              <span class="track-artist">${getArtist(s)}</span>
            </div>
            <div class="track-duration">${formatTime(s.duration)}</div>
            <div class="track-more"><i data-lucide="more-horizontal"></i></div>
          `;
          div.addEventListener('click', () => {
            queue = songs.map(x => ({
              id: x.id,
              title: getTitle(x),
              artist: getArtist(x),
              cover: getCover(x),
              url: null,
              raw: x
            }));
            currentIndex = i;
            playIndex(i);
          });
          tracksWrap.appendChild(div);
        });
        refreshIcons();
      }

      if (albumPlayBtn) {
        albumPlayBtn.onclick = () => {
          queue = songs.map(x => ({
            id: x.id,
            title: getTitle(x),
            artist: getArtist(x),
            cover: getCover(x),
            url: null,
            raw: x
          }));
          currentIndex = 0;
          playIndex(0);
        };
      }

      if (albumViewEl) {
        albumViewEl.style.display = 'flex';
        if (albumScroll) {
          albumScroll.scrollTop = 0;
          albumScroll.onscroll = () => {
            if (albumScroll.scrollTop > 150) {
              albumStickyHeader.classList.add('scrolled');
            } else {
              albumStickyHeader.classList.remove('scrolled');
            }
          };
        }
        const safeTitle = (title && typeof title === 'string' && title.trim()) ? title : 'Album';
        history.pushState({ albumView: true }, safeTitle, '#' + encodeURIComponent(safeTitle.replace(/\s+/g, '')));
      }
    } catch (e) {
      console.error('Failed to fetch album songs', e);
      alert('Failed to load album songs.');
    }
  }

  const albumBackBtn = document.getElementById('album-back');
  if (albumBackBtn) {
    albumBackBtn.addEventListener('click', () => {
      const albumView = document.getElementById('album-view');
      if (albumView) albumView.style.display = 'none';
      if (window.history.state && window.history.state.albumView) {
        history.back();
      }
    });
  }

  async function playPlaylist(playlistId, page = 1) {
    try {
      if (page === 1) {
        // Reset state on new playlist load
        currentViewId = playlistId;
        currentViewType = 'playlist';
        currentViewPage = 1;
        currentLoadedCount = 0;
        currentViewTotal = 0;

        // Show loading state or clear previous
        const tracksWrap = document.getElementById('album-tracks');
        if (tracksWrap) tracksWrap.innerHTML = '<p style="padding:20px; text-align:center;">Loading...</p>';
      }

      const limit = 20; // Default page limit
      const res = await fetch(`https://music45-api.vercel.app/api/playlists?id=${encodeURIComponent(playlistId)}&page=${page}&limit=${limit}`);
      const data = await res.json();
      const playlist = data?.data;
      const songs = playlist?.songs || [];

      if (!songs.length && page === 1) {
        alert('No songs found in this playlist.');
        return;
      }

      const albumCoverEl = document.getElementById('album-cover');
      const albumTitleEl = document.getElementById('album-title');
      const albumStickyTitleEl = document.getElementById('album-sticky-title');
      const albumArtistEl = document.getElementById('album-artist');
      const albumArtistImgEl = document.getElementById('album-artist-img');
      const albumYearEl = document.getElementById('album-year');
      const albumPlayBtn = document.getElementById('album-play');
      const albumViewEl = document.getElementById('album-view');
      const tracksWrap = document.getElementById('album-tracks');
      const albumScroll = document.querySelector('.album-content-scroll');
      const albumStickyHeader = document.querySelector('.album-sticky-header');
      const loadMoreContainer = document.getElementById('album-load-more-container');
      const loadMoreBtn = document.getElementById('album-load-more-btn');

      const title = playlist.name || playlist.title || 'Playlist';
      const artist = 'Playlist';
      const cover = getCover(playlist);

      // Metadata updates only on first page
      if (page === 1) {
        if (albumCoverEl) albumCoverEl.src = cover;
        if (albumTitleEl) albumTitleEl.textContent = title;
        if (albumStickyTitleEl) albumStickyTitleEl.textContent = title;
        if (albumArtistEl) albumArtistEl.textContent = artist;
        if (albumArtistImgEl) albumArtistImgEl.src = cover;
        if (albumYearEl) albumYearEl.textContent = playlist.songCount ? `${playlist.songCount} Songs` : 'Playlist';

        currentViewTotal = parseInt(playlist.songCount || 0) || 0;
        if (tracksWrap) tracksWrap.innerHTML = ''; // Clear loading text
      }

      if (tracksWrap) {
        songs.forEach((s, i) => {
          // Adjust index for pagination ?? API might not give global index. 
          // We'll just use currentLoadedCount + i + 1
          const displayIndex = currentLoadedCount + i + 1;

          const div = document.createElement('div');
          div.className = 'album-track';
          div.innerHTML = `
            <span class="track-index">${displayIndex}</span>
            <div class="track-name-wrapper">
              <span class="track-title">${getTitle(s)}</span>
              <span class="track-artist">${getArtist(s)}</span>
            </div>
            <div class="track-duration">${formatTime(s.duration)}</div>
            <div class="track-more"><i data-lucide="more-horizontal"></i></div>
          `;
          div.addEventListener('click', () => {
            // NOTE: If we click a song in a paginated playlist, we ideally want the queue to be the *entire* text so far,
            // or at least this chunk. For simplicity, we'll set queue to all CURRENTLY loaded songs in DOM order? 
            // Or just this chunk? 
            // Better UX: Append to a global "playlistSongs" array as we load, and use that for queue.
            // For now, let's just make a queue from *this batch* or try to reconstruct. 
            // A simple approach: When clicking a song, play IT. 
            // If user wants to seek, we ideally need the full context. 
            // Let's rely on the fact that we can just play this song. 
            // BUT standard behavior is "play from here". 
            // Let's simplisticly set queue to these new songs? No, breaks previous songs.
            // Let's Accumulate.

            // Actually, simply setting queue to 'songs' (current batch) is safest for now to avoid complexity 
            // with merging previous batches if we didn't store them.
            // User requested "load more", they probably just want to find a song.
            // Let's stick to: Queue = All Currently Displayed Songs?
            // To do that, we'd need to store `allLoadedPlaylistSongs`.

            // Let's implement `allLoadedPlaylistSongs`.
            if (page === 1) window.allLoadedPlaylistSongs = [];

            // This logic is tricky inside the loop because we are adding listeners *now*.
            // Instead, we should update the queue wrapper logic.

            // Simpler: Just set queue to this song + rest of batch.
            queue = songs.map(x => ({
              id: x.id,
              title: getTitle(x),
              artist: getArtist(x),
              cover: getCover(x),
              url: null,
              raw: x
            }));
            currentIndex = i;
            playIndex(i);
          });
          tracksWrap.appendChild(div);
        });

        // Append to global tracker
        if (page === 1) window.allLoadedPlaylistSongs = [...songs];
        else window.allLoadedPlaylistSongs.push(...songs);

        currentLoadedCount += songs.length;
        refreshIcons();
      }

      // Handle Load More Button
      if (loadMoreContainer) {
        if (songs.length === limit) {
          loadMoreContainer.style.display = 'block';
        } else {
          loadMoreContainer.style.display = 'none';
        }
      }

      if (albumPlayBtn && page === 1) {
        albumPlayBtn.onclick = () => {
          if (!window.allLoadedPlaylistSongs || !window.allLoadedPlaylistSongs.length) return;
          queue = window.allLoadedPlaylistSongs.map(x => ({
            id: x.id,
            title: getTitle(x),
            artist: getArtist(x),
            cover: getCover(x),
            url: null,
            raw: x
          }));
          currentIndex = 0;
          playIndex(0);
        };
      }

      if (albumViewEl && page === 1) {
        albumViewEl.style.display = 'flex';
        // Reset scroll only on first load
        if (albumScroll) {
          albumScroll.scrollTop = 0;
          albumScroll.onscroll = () => {
            if (albumScroll.scrollTop > 150) {
              albumStickyHeader.classList.add('scrolled');
            } else {
              albumStickyHeader.classList.remove('scrolled');
            }
          };
        }
        const safeTitle = (title && typeof title === 'string' && title.trim()) ? title : 'Playlist';
        history.pushState({ albumView: true }, safeTitle, '#' + encodeURIComponent(safeTitle.replace(/\s+/g, '')));
      }
    } catch (e) {
      console.error('Failed to fetch playlist songs', e);
      alert('Failed to load playlist songs.');
    }
  }

  async function loadMultipleNewReleaseAlbums(languages) {
    const wrap = document.getElementById('new-releases');
    if (!wrap) return;
    wrap.innerHTML = '';

    // If languages provided, search for them
    let queries = [];
    if (languages && languages.length) {
      queries = languages.map(l => `${l} top hits`);
    } else {
      // Fallback
      queries = ['Hindi Top 50', 'English Top 50'];
    }

    try {
      const allItems = [];
      const usedIds = new Set();

      // Randomize queries
      const selectedQueries = queries.sort(() => 0.5 - Math.random()).slice(0, 4);

      for (const q of selectedQueries) {
        const res = await fetch(`https://music45-api.vercel.app/api/search/playlists?query=${encodeURIComponent(q)}&limit=20`);
        const data = await res.json();
        if (data?.data?.results) {
          const items = data.data.results.slice(0, 10);
          items.forEach(item => {
            if (!usedIds.has(item.id)) {
              usedIds.add(item.id);
              allItems.push(item);
            }
          });
        }
      }

      // Shuffle
      const final = allItems.sort(() => 0.5 - Math.random());

      final.forEach(item => {
        const card = document.createElement('div');
        card.className = 'music-card';
        const cover = getCover(item);
        const title = item.name || item.title || 'Unknown Playlist';

        card.innerHTML = `
        <img src="${cover}" alt="${escapeHtml(title)}">
        <span>${escapeHtml(title)}</span>
      `;
        // Check API for PLAYLIST or ALBUM. Here we fetched playlists.
        card.addEventListener('click', () => playPlaylist(item.id));
        wrap.appendChild(card);
      });

    } catch (e) {
      console.error('Playlists error', e);
    }
  }



  // Search
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const searchResultsWrap = document.getElementById('search-results');

  async function handleSearch() {
    const query = (searchInput && searchInput.value || '').trim();
    if (!query) return;
    try {
      // GLOBAL SEARCH
      const res = await fetch(`https://music45-api.vercel.app/api/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();

      const allData = data?.data || {};
      const songs = allData.songs?.results || [];
      const albums = allData.albums?.results || [];
      const playlists = allData.playlists?.results || [];
      const artists = allData.artists?.results || [];

      if (searchResultsWrap) searchResultsWrap.innerHTML = '';

      const hasAnyResults = songs.length || albums.length || playlists.length || artists.length;

      if (!hasAnyResults) {
        if (searchResultsWrap) searchResultsWrap.innerHTML = `<p style="color:var(--foreground-muted)">No results found.</p>`;
        return;
      }

      // Helper to create sections
      const createSection = (title, items, type) => {
        if (!items || !items.length) return;

        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section';
        sectionDiv.style.marginBottom = '2rem';

        const titleEl = document.createElement('h2');
        titleEl.className = 'section-title';
        titleEl.textContent = title;
        sectionDiv.appendChild(titleEl);

        if (type === 'song') {
          // Vertical list
          const listDiv = document.createElement('div');
          listDiv.style.display = 'flex';
          listDiv.style.flexDirection = 'column';
          listDiv.style.gap = '0.5rem';

          items.forEach(r => {
            const item = {
              id: r.id,
              title: getTitle(r),
              artist: getArtist(r),
              cover: getCover(r),
              url: null,
              raw: r
            };
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
              <img src="${item.cover}" alt="${item.title}">
              <div class="search-result-info">
                <h4>${item.title}</h4>
                <p>${item.artist}</p>
              </div>
            `;
            div.addEventListener('click', () => {
              queueSource = 'search-single';
              queue = [item];
              currentIndex = 0;
              playIndex(0);
            });
            listDiv.appendChild(div);
          });
          sectionDiv.appendChild(listDiv);

        } else {
          // Horizontal scroll (Albums, Playlists, Artists)
          const scrollDiv = document.createElement('div');
          scrollDiv.className = 'horizontal-scroll';

          items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'music-card';
            const cover = getCover(item);
            const title = item.title || item.name || (type === 'artist' ? item.name : 'Unknown');
            card.innerHTML = `
              <img src="${cover}" alt="${escapeHtml(title)}">
              <span>${escapeHtml(title)}</span>
            `;
            card.addEventListener('click', () => {
              if (type === 'album') playAlbum(item.id);
              if (type === 'playlist') playPlaylist(item.id);
              if (type === 'artist') {
                // For artist, maybe trigger search for that artist or open artist page (not implemented yet)
                // For now, let's search for the artist's songs
                searchInput.value = title;
                handleSearch();
              }
            });
            scrollDiv.appendChild(card);
          });
          sectionDiv.appendChild(scrollDiv);
        }

        if (searchResultsWrap) searchResultsWrap.appendChild(sectionDiv);
      };

      // Create sections in order
      createSection('Songs', songs, 'song');
      createSection('Albums', albums, 'album');
      createSection('Playlists', playlists, 'playlist');
      createSection('Artists', artists, 'artist');

    } catch (e) {
      console.error('Search failed', e);
      if (searchResultsWrap) searchResultsWrap.innerHTML = `<p style="color:red">Error fetching results</p>`;
    }
  }

  if (searchBtn) searchBtn.addEventListener('click', handleSearch);
  if (searchInput) searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSearch();
  });

  // Load More Button Helper
  const albumLoadMoreBtn = document.getElementById('album-load-more-btn');
  if (albumLoadMoreBtn) {
    albumLoadMoreBtn.addEventListener('click', () => {
      // Logic for loading more
      if (currentViewId && currentViewType === 'playlist') {
        currentViewPage++;
        albumLoadMoreBtn.textContent = 'Loading...';
        playPlaylist(currentViewId, currentViewPage).then(() => {
          albumLoadMoreBtn.textContent = 'Load More Songs';
        });
      }
    });
  }

  // Initial Load
  loadRecentlyFromStorage();
  refreshQualityButtons();

  // Language Selection Logic
  const AVAILABLE_LANGUAGES = [
    { name: 'Hindi', native: 'हिंदी', bg: 'linear-gradient(135deg, #FF9933, #FFFFFF, #128807)' }, // Tiranga inspired
    { name: 'English', native: 'English', bg: 'linear-gradient(135deg, #00247D, #CF142B)' }, // Union Jack inspired
    { name: 'Punjabi', native: 'ਪੰਜਾਬੀ', bg: 'linear-gradient(135deg, #FFD700, #FF8C00)' },
    { name: 'Tamil', native: 'தமிழ்', bg: 'linear-gradient(135deg, #FF4B2B, #FF416C)' },
    { name: 'Telugu', native: 'తెలుగు', bg: 'linear-gradient(135deg, #1D976C, #93F9B9)' },
    { name: 'Malayalam', native: 'മലയാളം', bg: 'linear-gradient(135deg, #00b09b, #96c93d)' },
    { name: 'Marathi', native: 'मराठी', bg: 'linear-gradient(135deg, #f83600, #f9d423)' },
    { name: 'Gujarati', native: 'ગુજરાતી', bg: 'linear-gradient(135deg, #ee0979, #ff6a00)' },
    { name: 'Bengali', native: 'বাংলা', bg: 'linear-gradient(135deg, #0052D4, #4364F7, #6FB1FC)' },
    { name: 'Kannada', native: 'ಕನ್ನಡ', bg: 'linear-gradient(135deg, #f7ff00, #db36a4)' },
    { name: 'Bhojpuri', native: 'भोजपुरी', bg: 'linear-gradient(135deg, #ED213A, #93291E)' },
    { name: 'Haryanvi', native: 'हरियाणवी', bg: 'linear-gradient(135deg, #11998e, #38ef7d)' },
    { name: 'Rajasthani', native: 'राजस्थानी', bg: 'linear-gradient(135deg, #8E2DE2, #4A00E0)' },
    { name: 'Odia', native: 'ଓଡ଼ିଆ', bg: 'linear-gradient(135deg, #00c6ff, #0072ff)' },
    { name: 'Assamese', native: 'অসমীয়া', bg: 'linear-gradient(135deg, #fc00ff, #00dbde)' },
    { name: 'Sanskrit', native: 'संस्कृत', bg: 'linear-gradient(135deg, #7028e4, #e5e5be)' }
  ];

  const selectedLanguageSet = new Set();
  const langOverlay = document.getElementById('language-selection-overlay');
  const langGrid = document.getElementById('language-grid');
  const langNextBtn = document.getElementById('lang-next-btn');
  const selectedCountEl = document.getElementById('selected-count');

  function updateLangFooter() {
    const count = selectedLanguageSet.size;
    if (selectedCountEl) selectedCountEl.textContent = `${count} Selected`;
    if (langNextBtn) {
      langNextBtn.disabled = count < 2;
      langNextBtn.classList.toggle('active', count >= 2);
    }
  }

  function renderLanguageGrid() {
    if (!langGrid) return;
    langGrid.innerHTML = '';
    AVAILABLE_LANGUAGES.forEach(lang => {
      const card = document.createElement('div');
      card.className = 'lang-card';
      // Check if already selected (e.g. if we add edit feature later)

      card.innerHTML = `
            <div class="lang-card-bg" style="background: ${lang.bg}"></div>
            <div class="lang-card-content">
                <span class="lang-name">${lang.name}</span>
                <span class="lang-native">${lang.native}</span>
            </div>
            <div class="lang-check"><i data-lucide="check"></i></div>
          `;

      card.addEventListener('click', () => {
        if (selectedLanguageSet.has(lang.name)) {
          selectedLanguageSet.delete(lang.name);
          card.classList.remove('selected');
        } else {
          selectedLanguageSet.add(lang.name);
          card.classList.add('selected');
        }
        updateLangFooter();
      });

      langGrid.appendChild(card);
    });
    refreshIcons(); // For checks
  }

  function loadContentBasedOnLanguages(langs) {
    if (!langs || !langs.length) return;
    // Load Albums for these languages
    loadAlbums(langs);
    // Load New Releases
    loadMultipleNewReleaseAlbums(langs);
  }

  // Check storage
  const savedLangsJson = localStorage.getItem('selectedLanguages');
  if (!savedLangsJson) {
    // First time user
    if (langOverlay) {
      langOverlay.style.display = 'flex';
      renderLanguageGrid();

      if (langNextBtn) {
        langNextBtn.addEventListener('click', () => {
          if (selectedLanguageSet.size < 2) return;
          const langs = Array.from(selectedLanguageSet);
          localStorage.setItem('selectedLanguages', JSON.stringify(langs));

          // Hide overlay
          langOverlay.style.display = 'none';

          // Load content
          loadContentBasedOnLanguages(langs);
        });
      }
    }
  } else {
    // Returning user
    try {
      const langs = JSON.parse(savedLangsJson);
      loadContentBasedOnLanguages(langs);
    } catch (e) {
      console.error("Error parsing languages", e);
      loadAlbums(); // Fallback
      loadMultipleNewReleaseAlbums();
    }
  }

});
// --- CLICK TO ENTER LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
  const entryScreen = document.getElementById("entry-screen");
  const enterBtn = document.getElementById("enter-btn");

  if (enterBtn && entryScreen) {
    enterBtn.addEventListener("click", () => {
      // Fade out the black screen
      entryScreen.style.opacity = "0";
      entryScreen.style.visibility = "hidden";
    });
    
    // Add hover effect for the button
    enterBtn.addEventListener("mouseenter", () => {
        enterBtn.style.background = "#fff";
        enterBtn.style.color = "#000";
    });
    enterBtn.addEventListener("mouseleave", () => {
        enterBtn.style.background = "transparent";
        enterBtn.style.color = "#fff";
    });
  }
});
