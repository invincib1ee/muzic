# Music45 - Mobile Music Streaming App
All efforts made by [This Guy](https://t.me/HTLivesm3u) ,, i just edited little bit 🫶

A beautiful, modern music streaming application built with TypeScript, featuring a dark theme, smooth animations, and seamless playback experience.

![Music45](https://img.shields.io/badge/version-2.0.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

- 🎵 **High-Quality Music Streaming** - Stream music with adjustable quality settings (48kbps to 320kbps)
- 📱 **Mobile-First Design** - Optimized for mobile devices with touch-friendly controls
- 🌙 **Dark Theme** - Beautiful dark mode interface with smooth gradients
- 🎨 **Modern UI** - Clean, intuitive interface with smooth animations
- 🎤 **Synced Lyrics** - Real-time synchronized lyrics display (powered by LrcLib)
- 🔀 **Shuffle & Repeat** - Full playback control with shuffle and repeat modes
- 📊 **Recently Played** - Track your listening history
- 🔍 **Advanced Search** - Search for songs, albums, and artists
- 💾 **Local Storage** - Persist your preferences and recently played tracks
- 🎯 **Smart Suggestions** - Get song recommendations based on what you're listening to
- 📱 **PWA Ready** - Install as a Progressive Web App on mobile devices
- 🎛️ **Media Session API** - Control playback from system controls and notifications

## 🚀 Tech Stack

- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **JioSaavn API** - Music streaming and metadata
- **LrcLib API** - Synchronized lyrics
- **Lucide Icons** - Beautiful icon library
- **Font Awesome** - Additional icons
- **LocalStorage API** - Client-side data persistence
- **Media Session API** - System media controls integration

## 📦 Installation

### Prerequisites

- Node.js (version 18.0.0 or higher)
- npm (version 9.0.0 or higher)

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/music45.git
cd lagggggggggg
```

2. **Install dependencies**

```bash
npm install
```

3. **Start development server**

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🛠️ Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

## 📁 Project Structure

```
lagggggggggg/
├── src/
│   ├── main.ts              # Main application entry point
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   ├── services/
│   │   ├── api.ts           # API service for music data
│   │   ├── storage.ts       # LocalStorage service
│   │   └── lyrics.ts        # Lyrics service
│   └── utils/
│       └── helpers.ts       # Utility functions
├── public/
│   ├── styles.css           # Global styles
│   └── LOGO.jpg            # App logo
├── index.html              # HTML entry point
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
├── package.json            # Project dependencies
└── README.md               # This file
```

## ⚙️ Configuration

### Quality Settings

The app supports multiple quality settings for audio playback:

- **Less Low** - 48 kbps (minimal data usage)
- **Low** - 96 kbps (low data usage)
- **Medium** - 160 kbps (balanced quality)
- **High** - 320 kbps (high quality)
- **Auto** - Best available quality

Settings are persisted in LocalStorage and will be remembered across sessions.

### API Endpoints

The app uses the following APIs:

- **Music45 API**: `https://music45-api.vercel.app/api`
  - `/search/songs` - Search for songs
  - `/search/albums` - Search for albums
  - `/songs` - Get song details
  - `/albums` - Get album details
  - `/songs/{id}/suggestions` - Get song suggestions

- **LrcLib API**: `https://lrclib.net/api`
  - `/get` - Get lyrics by track name and artist
  - `/search` - Search for lyrics

## 🎯 Key Features Explained

### Music Player

- **Compact Footer Player** - Mini player at the bottom of the screen
- **Full-Screen Banner** - Expanded player with album art and controls
- **Progress Bar** - Seek to any position in the track
- **Time Display** - Current time and total duration

### Lyrics Display

- **Synced Lyrics** - Lyrics synchronized with playback
- **Flip Animation** - Smooth transition between album art and lyrics
- **Auto-Scroll** - Lyrics automatically scroll to current line
- **Fallback** - Plain text lyrics when synced lyrics aren't available

### Navigation

- **Home Tab** - Browse albums and recently played tracks
- **Search Tab** - Search for songs, artists, and albums
- **Library Tab** - Your personal library (coming soon)

### Playback Controls

- **Play/Pause** - Control playback
- **Next/Previous** - Navigate through queue
- **Shuffle** - Randomize playback order
- **Repeat** - Loop current track or queue
- **Volume** - System volume control

## 🎨 Customization

### Theme Colors

Edit the CSS variables in `public/styles.css` to customize the theme:

```css
:root {
    --background: hsl(220, 15%, 8%);
    --primary: hsl(210, 85%, 60%);
    --accent: hsl(280, 85%, 65%);
    /* ... more variables */
}
```

### Adding New Features

1. Define types in `src/types/index.ts`
2. Add utility functions in `src/utils/helpers.ts`
3. Create services in `src/services/`
4. Update main application logic in `src/main.ts`

## 🐛 Known Issues

- Lyrics may not be available for all songs
- Some albums may have incomplete metadata
- Mobile Safari may have audio playback restrictions

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## 🔒 Security

- Never commit API keys or sensitive data
- Use environment variables for configuration
- Validate all user inputs
- Sanitize data before displaying

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- **JioSaavn** - For providing the music streaming API
- **LrcLib** - For synchronized lyrics
- **Lucide** - For beautiful icons
- **Vite** - For blazing fast development experience

## 📞 Support

If you encounter any issues or have questions:

- Open an issue on GitHub
- Contact: your.email@example.com
- Documentation: [Wiki](https://github.com/yourusername/music45/wiki)

## 🗺️ Roadmap

- [ ] User authentication
- [ ] Playlist creation and management
- [ ] Social features (share songs)
- [ ] Offline mode
- [ ] Desktop app
- [ ] Integration with more music services
- [ ] Equalizer
- [ ] Sleep timer
- [ ] Crossfade between tracks

## 📊 Performance

- First Load: < 2s
- Time to Interactive: < 3s
- Bundle Size: ~500KB (gzipped)

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

---

Made with ❤️ by the Music45 Team
