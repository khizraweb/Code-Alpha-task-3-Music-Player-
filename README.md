<div align="center">

# 🎵 Vinyl — A Vinyl-Inspired Music Player

A responsive, feature-rich music player built with plain **HTML, CSS & JavaScript** — no frameworks, no dependencies.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

[**🔴 Live Demo**](#) · [Report a Bug](#) · [Request a Feature](#)

</div>

---

<!--
  📸 Add a screenshot or GIF of the app here once it's live, e.g.:
  ![Vinyl music player screenshot](assets/images/screenshot.png)
-->

## ✨ Overview

**Vinyl** is a turntable-themed music player concept — a spinning vinyl record and tonearm animate in sync with playback, wrapped around a fully working audio player: play/pause/skip, a seekable progress bar, volume control, a searchable playlist, and a handful of bonus features like sleep timer and dark mode.

Built for **Task 4: Music Player using JavaScript**.

## 🚀 Features

| Category | Feature |
|---|---|
| 🎛️ Core controls | Play, pause, next, previous |
| 📊 Now playing | Song title, artist, live duration |
| 📶 Progress | Seekable progress bar with current time / total time |
| 🔊 Volume | Slider + mute toggle |
| 📃 Playlist | Click-to-play list, active track highlighted |
| 🔁 Playback modes | Shuffle, Repeat, Autoplay |
| 🔍 Search | Filter playlist by song or artist |
| ❤️ Favourites | Like/unlike tracks, filter to liked-only |
| ⏩ Speed control | 0.75x – 1.75x playback speed |
| 😴 Sleep timer | Auto-pause after 15 / 30 / 45 / 60 minutes |
| 📁 Add your own | Upload local audio files into the playlist |
| 🌗 Theming | Dark / light mode toggle |
| 🔔 Feedback | Toast notifications for key actions |
| 📱 Responsive | Optimized for mobile, tablet, and desktop |
| ⌨️ Accessibility | Keyboard shortcuts, visible focus states |

## 📂 Project structure

```
vinyl-music-player/
├── index.html              # Main page markup
├── css/
│   └── style.css           # All styling & animations
├── js/
│   └── script.js           # Player logic & interactivity
├── assets/
│   ├── icons/
│   │   ├── play_button.svg
│   │   ├── Pause_circle.png
│   │   ├── backward-icon.png
│   │   ├── forward-icon.png
│   │   └── playing.gif
│   └── images/
│       ├── logo.png
│       └── bg.jpg
├── README.md
├── LICENSE
└── .gitignore
```

## 🧑‍💻 Getting started

No installation needed — it's a static site.

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

Then just open `index.html` in your browser, or use the **Live Server** extension in VS Code for auto-reload while editing.

## 🌐 Deploying with GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Source**, select the `main` branch and `/ (root)` folder.
4. Save — your live URL will be `https://<your-username>.github.io/<repo-name>/`.

## 🎧 Using your own music

The playlist ships with a few free demo tracks so it works out of the box. To use your own songs:

- Click **Add song** in the app and upload local audio files, **or**
- Edit the `tracks` array at the top of `js/script.js` and replace the `src` values with your own mp3 file paths / URLs.

## ⌨️ Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Play / pause |
| `→` | Seek forward 5s |
| `←` | Seek backward 5s |

## 🛠️ Built with

- Semantic HTML5
- CSS custom properties, Flexbox/Grid, keyframe animations
- Vanilla JavaScript (`HTMLAudioElement` API — no libraries)

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

<div align="center">
Made with 🎶 as part of a JavaScript learning task.
</div>
