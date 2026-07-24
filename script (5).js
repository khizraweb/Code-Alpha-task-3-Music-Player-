/* =========================================================
   VINYL — Music Player logic
   Handles: play/pause/next/prev, progress + seek, volume,
   playlist rendering, shuffle, repeat, autoplay, like toggle.
   ========================================================= */

(function () {
  "use strict";

  // ---- Demo playlist -------------------------------------------------
  // Free-to-use demo audio streams (SoundHelix sample tracks) so the
  // player works out of the box. Swap the `src` values for your own
  // mp3/ogg files — everything else keeps working unchanged.
  const tracks = [
    { title: "Midnight Drive",     artist: "Lo-Fi Harbour",   src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { title: "Amber Skyline",      artist: "The Copper Keys", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { title: "Static & Velvet",    artist: "Noor Waves",      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { title: "Rewind, Slowly",     artist: "Dial Tone Room",  src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
    { title: "Paper Moon",         artist: "Amber & Rye",     src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
    { title: "Analog Heart",       artist: "Static Bloom",    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
  ];

  // ---- State -----------------------------------------------------------
  let currentIndex = 0;
  let isPlaying = false;
  let isShuffle = false;
  let isRepeat = false;
  let isAutoplay = true;
  let liked = new Set();
  let lastVolume = 0.8;
  let searchQuery = "";
  let showLikedOnly = false;
  const speeds = [1, 1.25, 1.5, 1.75, 0.75];
  let speedIdx = 0;
  let sleepTimeoutId = null;
  let sleepEndsAt = null;

  // ---- DOM refs ----------------------------------------------------------
  const audio        = document.getElementById("audio");
  const platter       = document.getElementById("platter");
  const tonearm        = document.getElementById("tonearm");
  const vinylLabel      = document.getElementById("vinylLabel");
  const liveDot          = document.getElementById("liveDot");
  const trackTitle        = document.getElementById("trackTitle");
  const trackArtist        = document.getElementById("trackArtist");
  const seek                = document.getElementById("seek");
  const currentTimeEl        = document.getElementById("currentTime");
  const durationEl            = document.getElementById("duration");
  const playBtn                 = document.getElementById("playBtn");
  const prevBtn                  = document.getElementById("prevBtn");
  const nextBtn                   = document.getElementById("nextBtn");
  const shuffleBtn                  = document.getElementById("shuffleBtn");
  const repeatBtn                    = document.getElementById("repeatBtn");
  const autoplayBtn                   = document.getElementById("autoplayBtn");
  const muteBtn                        = document.getElementById("muteBtn");
  const volIcon                         = document.getElementById("volIcon");
  const volume                           = document.getElementById("volume");
  const playlistEl                        = document.getElementById("playlist");
  const trackCountEl                       = document.getElementById("trackCount");
  const themeToggle    = document.getElementById("themeToggle");
  const themeIcon      = document.getElementById("themeIcon");
  const speedBtn       = document.getElementById("speedBtn");
  const speedLabel     = document.getElementById("speedLabel");
  const timerBtn       = document.getElementById("timerBtn");
  const timerLabel     = document.getElementById("timerLabel");
  const searchInput    = document.getElementById("searchInput");
  const likedFilterBtn = document.getElementById("likedFilterBtn");
  const uploadInput    = document.getElementById("uploadInput");
  const emptyState     = document.getElementById("emptyState");
  const toastStack     = document.getElementById("toastStack");

  const SUN_ICON  = '<path d="M12 7a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0-5v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
  const MOON_ICON = '<path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.4 5.4 0 0 1-7.54-7.54c-.44-.06-.9-.1-1.36-.1z"/>';

  // ---- Helpers -----------------------------------------------------------
  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function showToast(message) {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span class="dot"></span>${message}`;
    toastStack.appendChild(el);
    setTimeout(() => {
      el.classList.add("out");
      el.addEventListener("animationend", () => el.remove());
    }, 2600);
  }

  function initials(title) {
    return title
      .split(" ")
      .map(w => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();
  }

  // ---- Rendering -----------------------------------------------------------
  const durationCache = {};

  function renderPlaylist() {
    playlistEl.innerHTML = "";
    trackCountEl.textContent = `${tracks.length} tracks`;

    const q = searchQuery.trim().toLowerCase();
    const visibleIdx = tracks
      .map((t, i) => i)
      .filter(i => {
        const t = tracks[i];
        const matchesSearch = !q || t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q);
        const matchesLiked = !showLikedOnly || liked.has(i);
        return matchesSearch && matchesLiked;
      });

    emptyState.hidden = visibleIdx.length !== 0;

    visibleIdx.forEach((i) => {
      const track = tracks[i];
      const li = document.createElement("li");
      li.className = "track-row" + (i === currentIndex ? " active" : "");
      li.setAttribute("role", "button");
      li.setAttribute("tabindex", "0");

      const isLiked = liked.has(i);

      li.innerHTML = `
        <span class="idx">${i === currentIndex && isPlaying
          ? '<img src="assets/icons/playing.gif" alt="Now playing" class="eq-gif">'
          : String(i + 1).padStart(2, "0")}</span>
        <span class="info">
          <span class="t">${track.title}</span>
          <span class="a">${track.artist}</span>
        </span>
        <span class="dur" data-dur="${i}">--:--</span>
        <button class="heart ${isLiked ? "liked" : ""}" data-like="${i}" aria-label="Like track" title="Like">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.7-4.35-9.3-8.1C1.1 10.6 1.6 7.6 4 6.1c2.1-1.3 4.6-.7 6 1.1l2 2.4 2-2.4c1.4-1.8 3.9-2.4 6-1.1 2.4 1.5 2.9 4.5 1.3 6.8C18.7 16.65 12 21 12 21z"/></svg>
        </button>
      `;

      li.addEventListener("click", (e) => {
        if (e.target.closest("[data-like]")) return; // handled separately
        loadTrack(i);
        playAudio();
      });
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); loadTrack(i); playAudio(); }
      });

      playlistEl.appendChild(li);
    });

    // wire up like buttons + fetch durations for display
    playlistEl.querySelectorAll("[data-like]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const i = Number(btn.dataset.like);
        const nowLiked = !liked.has(i);
        nowLiked ? liked.add(i) : liked.delete(i);
        showToast(nowLiked ? `Liked "${tracks[i].title}"` : `Removed from liked`);
        renderPlaylist();
      });
    });

    visibleIdx.forEach((i) => {
      if (durationCache[i] != null) {
        const el = playlistEl.querySelector(`[data-dur="${i}"]`);
        if (el) el.textContent = formatTime(durationCache[i]);
        return;
      }
      const probe = new Audio();
      probe.preload = "metadata";
      probe.src = tracks[i].src;
      probe.addEventListener("loadedmetadata", () => {
        durationCache[i] = probe.duration;
        const el = playlistEl.querySelector(`[data-dur="${i}"]`);
        if (el) el.textContent = formatTime(probe.duration);
      });
    });
  }

  function loadTrack(index, autoPlay = false) {
    currentIndex = (index + tracks.length) % tracks.length;
    const track = tracks[currentIndex];

    audio.src = track.src;
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    vinylLabel.textContent = initials(track.title);
    seek.value = 0;
    seek.style.setProperty("--pct", "0%");
    currentTimeEl.textContent = "0:00";
    durationEl.textContent = "0:00";

    renderPlaylist();
    if (hasInitialized) showToast(`Now playing: ${track.title}`);
    if (autoPlay) playAudio();
  }
  let hasInitialized = false;

  function playAudio() {
    audio.play().then(() => {
      isPlaying = true;
      updatePlayState();
    }).catch(() => { /* autoplay may be blocked until user gesture */ });
  }

  function pauseAudio() {
    audio.pause();
    isPlaying = false;
    updatePlayState();
  }

  function updatePlayState() {
    playBtn.classList.toggle("is-playing", isPlaying);
    platter.classList.toggle("spinning", isPlaying);
    tonearm.classList.toggle("playing", isPlaying);
    liveDot.classList.toggle("live", isPlaying);
    renderPlaylist();
  }

  // ---- Transport controls ---------------------------------------------
  playBtn.addEventListener("click", () => {
    if (!audio.src) loadTrack(0);
    isPlaying ? pauseAudio() : playAudio();
  });

  prevBtn.addEventListener("click", () => {
    const nextIdx = isShuffle ? randomIndex() : currentIndex - 1;
    loadTrack(nextIdx, true);
  });

  nextBtn.addEventListener("click", () => {
    const nextIdx = isShuffle ? randomIndex() : currentIndex + 1;
    loadTrack(nextIdx, true);
  });

  function randomIndex() {
    if (tracks.length <= 1) return 0;
    let i;
    do { i = Math.floor(Math.random() * tracks.length); } while (i === currentIndex);
    return i;
  }

  // ---- Progress / seek ---------------------------------------------------
  audio.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audio.duration);
    seek.max = audio.duration || 0;
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    seek.value = audio.currentTime;
    seek.max = audio.duration;
    const pct = (audio.currentTime / audio.duration) * 100;
    seek.style.setProperty("--pct", pct + "%");
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  seek.addEventListener("input", () => {
    audio.currentTime = Number(seek.value);
    const pct = audio.duration ? (seek.value / audio.duration) * 100 : 0;
    seek.style.setProperty("--pct", pct + "%");
  });

  audio.addEventListener("ended", () => {
    if (isRepeat) { loadTrack(currentIndex, true); return; }
    if (isAutoplay) {
      const nextIdx = isShuffle ? randomIndex() : currentIndex + 1;
      loadTrack(nextIdx, true);
    } else {
      isPlaying = false;
      updatePlayState();
    }
  });

  // ---- Volume -------------------------------------------------------------
  volume.addEventListener("input", () => {
    const v = Number(volume.value) / 100;
    audio.volume = v;
    lastVolume = v || lastVolume;
    volume.style.setProperty("--vpct", volume.value + "%");
    updateVolIcon(v);
  });

  muteBtn.addEventListener("click", () => {
    if (audio.volume > 0) {
      lastVolume = audio.volume;
      audio.volume = 0;
      volume.value = 0;
    } else {
      audio.volume = lastVolume || 0.8;
      volume.value = Math.round(audio.volume * 100);
    }
    volume.style.setProperty("--vpct", volume.value + "%");
    updateVolIcon(audio.volume);
  });

  function updateVolIcon(v) {
    muteBtn.classList.toggle("toggled", v === 0);
    volIcon.innerHTML = v === 0
      ? '<path d="M16.5 12A4.5 4.5 0 0014 7.97v2.02l2.45 2.45c.03-.15.05-.3.05-.44zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>'
      : '<path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
  }

  // ---- Mode chips (shuffle / repeat / autoplay) --------------------------
  shuffleBtn.addEventListener("click", () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle("active", isShuffle);
  });
  repeatBtn.addEventListener("click", () => {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle("active", isRepeat);
  });
  autoplayBtn.addEventListener("click", () => {
    isAutoplay = !isAutoplay;
    autoplayBtn.classList.toggle("active", isAutoplay);
  });

  // ---- Theme toggle (dark / light) ---------------------------------------
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeIcon.innerHTML = theme === "dark" ? SUN_ICON : MOON_ICON;
  }
  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    showToast(next === "dark" ? "Dark mode on" : "Light mode on");
  });
  applyTheme("light");

  // ---- Playback speed -------------------------------------------------------
  speedBtn.addEventListener("click", () => {
    speedIdx = (speedIdx + 1) % speeds.length;
    audio.playbackRate = speeds[speedIdx];
    speedLabel.textContent = speeds[speedIdx] + "x";
    speedBtn.classList.toggle("active", speeds[speedIdx] !== 1);
    showToast(`Speed: ${speeds[speedIdx]}x`);
  });

  // ---- Sleep timer (auto-pause after N minutes) ------------------------------
  const sleepOptions = [15, 30, 45, 60];
  let sleepOptIdx = -1; // -1 = off
  timerBtn.addEventListener("click", () => {
    sleepOptIdx = (sleepOptIdx + 1) % (sleepOptions.length + 1);
    clearTimeout(sleepTimeoutId);

    if (sleepOptIdx === sleepOptions.length) {
      sleepOptIdx = -1;
      timerLabel.textContent = "Sleep";
      timerBtn.classList.remove("active");
      showToast("Sleep timer cancelled");
      return;
    }

    const mins = sleepOptions[sleepOptIdx];
    timerLabel.textContent = `${mins}m`;
    timerBtn.classList.add("active");
    showToast(`Sleep timer: ${mins} min`);
    sleepTimeoutId = setTimeout(() => {
      pauseAudio();
      timerLabel.textContent = "Sleep";
      timerBtn.classList.remove("active");
      sleepOptIdx = -1;
      showToast("Playback paused — sleep timer ended");
    }, mins * 60 * 1000);
  });

  // ---- Search + liked-only filter --------------------------------------------
  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value;
    renderPlaylist();
  });
  likedFilterBtn.addEventListener("click", () => {
    showLikedOnly = !showLikedOnly;
    likedFilterBtn.classList.toggle("active", showLikedOnly);
    renderPlaylist();
  });

  // ---- Add your own tracks (local file upload) -------------------------------
  uploadInput.addEventListener("change", () => {
    const files = Array.from(uploadInput.files || []);
    if (!files.length) return;
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^/.]+$/, "");
      tracks.push({ title: name, artist: "Your upload", src: url });
    });
    renderPlaylist();
    showToast(files.length > 1 ? `Added ${files.length} songs` : `Added "${files[0].name.replace(/\.[^/.]+$/, "")}"`);
    uploadInput.value = "";
  });

  // ---- Keyboard shortcuts (space = play/pause, arrows = seek) ------------
  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
    if (e.code === "Space") { e.preventDefault(); playBtn.click(); }
    if (e.code === "ArrowRight") audio.currentTime = Math.min(audio.currentTime + 5, audio.duration || 0);
    if (e.code === "ArrowLeft") audio.currentTime = Math.max(audio.currentTime - 5, 0);
  });

  // ---- Init -----------------------------------------------------------------
  autoplayBtn.classList.add("active");
  volume.style.setProperty("--vpct", "80%");
  audio.volume = 0.8;
  loadTrack(0, false);
  hasInitialized = true;
})();
