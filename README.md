# T30 — Devotion Without Distraction

A high-fidelity, clickable **mobile app prototype** for **T30**, a faith app built around a focused daily 30-minute devotion rhythm: Scripture, prayer, live devotions and reflection, without the noise.

> **Status:** Design prototype · Light mode · v1.0
> **Live preview:** https://sazzy97.github.io/T30-Mobile-App/ *(enable GitHub Pages — see below)*

---

## ✨ Overview

T30 helps believers build a consistent devotional habit. This repository contains an interactive HTML/CSS/JS prototype that simulates the full app experience inside a phone frame, so stakeholders and test users can click through every flow on desktop or mobile.

### Key features
- **Guided onboarding:** sign-in, goals, preferred time, Bible translation and preferences
- **Home dashboard:** today's devotion, streak, progress and quick actions
- **Live devotion on YouTube:** a thumbnail screen that opens the live stream on YouTube; on return, a "Devotion complete" modal sends the user to today's Bible reading
- **Past devotions:** catch-up library of past devotion videos (Missed / Watched filters, weekly progress)
- **Bible reader:** chapter reading, verse highlighting (multiple colours), notes and a verse action sheet
- **Audio player:** persistent mini-player with play/pause and progress
- **Discover:** browse devotionals, topics and reading plans
- **Reading plans:** plan detail with day-by-day progress
- **Word of the Day:** shareable verse cards with multiple templates
- **Profile & rhythm:** stats, streaks and a devotion heatmap

---

## 📱 Screens

| # | Screen | ID |
|---|--------|----|
| 1 | Splash | `splash` |
| 2 | Sign in | `signin` |
| 3 | Goals | `goals` |
| 4 | Devotion time | `time` |
| 5 | Bible translation | `translation` |
| 6 | Preferences | `prefs` |
| 7 | Home | `home` |
| 8 | Live devotion (YouTube launch) | `live` |
| 8b | Past devotions | `past-devotions` |
| 9 | Bible reader | `bible` |
| 10 | Discover | `discover` |
| 11 | Reading plan | `plan` |
| 12 | Word of the Day | `wotd` |
| 13 | Profile / Rhythm | `profile` |

Plus overlays: tab bar, mini audio player, verse sheet and toast notifications.

### Discover hub sub-feature flows
| Flow | Screens | Highlights |
|------|---------|-----------|
| Devotionals | `dev-list` → `dev-read` → `complete` | Themes, continue reading, scripture callout, reflection journal, prayer, **inline comments under every devotional** (post, reply, like, sort, delete) |
| Confessions | `conf-list` → `conf-session` → `complete` | Topic sets, step progress, "spoken aloud" mic, prev/next |
| Declarations | `decl-list` → `decl-session` → `complete` | Daily declaration, decks, tap-3× progress ring, share |
| Bible Plans | `plans-list` → `plan` → `bible` | Active plans with progress, recommendations, filter by length |
| Prayer Companion | `pray-list` → `pray-session` → `complete` | Pick a need and length, ACTS steps (Adore, Confess, Thank, Ask), timer, pause |

### Profile extensions
| Screen | ID | Highlights |
|--------|----|-----------|
| Yearly streak | `streak` | 12-month calendar, stats, streak history, milestones, share sheet |
| Settings | `settings` | Library of Notes, Journals, Testimonies & Confessions (add/delete); preferences; data export; account deletion with type-to-confirm |

---

## 🎨 Design System

### Colours
| Token | Hex | Use |
|-------|-----|-----|
| Background | `#F6F6F6` | App background |
| White | `#FFFFFF` | Cards, surfaces |
| Black | `#141414` | Primary text |
| Primary (Dark Red) | `#8B1E1E` | Brand, CTAs, active states |
| Secondary (Dark Yellow) | `#C9961A` | Highlights, accents, streaks |

Tints and shades (e.g. `--primary-50 … --primary-700`) are defined in [`css/tokens.css`](css/tokens.css).

### Typography
- **Fraunces:** display headings and scripture
- **Inter:** UI and body text

---

## 🗂 Project Structure

```
t30-app-design/
├── index.html        # All screens, overlays and the phone frame
├── css/
│   ├── tokens.css    # Design tokens (colours, type, radii, shadows)
│   └── styles.css    # Component and screen styles
├── js/
│   └── app.js        # Navigation, onboarding state, highlights, audio, chat, share
└── assets/           # Generated imagery (hero, devotion covers, avatar)
```

---

## 🚀 Running Locally

No build step or dependencies are needed.

```bash
git clone https://github.com/sazzy97/T30-Mobile-App.git
cd T30-Mobile-App
python3 -m http.server 5173
```
Then open **http://localhost:5173**.

### Navigation tips
- Click through using the on-screen buttons and the bottom tab bar
- Tap verses in the Bible reader to highlight them or add notes
- Use the screen list beside the phone (desktop) to jump straight to any screen

---

## 🌐 Sharing a Preview (GitHub Pages)

1. Go to **Settings → Pages**
2. Source: **Deploy from a branch** → `main` / `(root)` → **Save**
3. After about a minute, the prototype is live at
   **https://sazzy97.github.io/T30-Mobile-App/**

It works on both mobile and desktop browsers.

---

## 🔗 YouTube links
Replace the placeholder URLs in the `YT` constant at the top of the "Live devotion on YouTube" block in [`js/app.js`](js/app.js) with the real live-stream and channel links.

---

## 🛣 Roadmap
- [x] Light mode prototype
- [ ] Dark mode
- [ ] Settings, notifications and search screens
- [ ] Figma handoff / production build

---

## 🛠 Tech
HTML5 · Vanilla CSS (custom properties) · Vanilla JavaScript · Google Fonts

---

© 2026 T30. All rights reserved. Design prototype, not a production application.
