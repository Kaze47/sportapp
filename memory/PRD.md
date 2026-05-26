# PlayPal — Product Requirements Document

## Overview
A social sports matchmaking mobile app (Expo / React Native) that connects locals to organize, join, and play sports together (football, basketball, tennis, padel, volleyball). Dark, energetic UI with vibrant neon green accents.

## MVP Scope (delivered)

### 1. Onboarding & Authentication
- Login screen with phone input and hero imagery
- 6-digit OTP verification (MOCKED — any 6-digit code accepted)
- Profile setup (name, age, location, avatar preset selection)
- Sports preferences grid (5 sports × 3 skill levels) with Skip option
- Find Friends with suggested contacts list, Invite all, Share via WhatsApp

### 2. Home / Map (Tab)
- Stylized dark interactive map with sport-coded pins for matches
- "You are here" pulsing dot
- Filter chips: time (All / Today / Tomorrow) and sport
- Bottom sheet with horizontally swipeable match cards (snap-to-card)
- Header greeting + notification bell

### 3. Matches (Tab)
- Upcoming feed (date, time, location, team size, skill, join count)
- Explore tab — "Try something new" horizontal carousel
- Competitions tab — local tournament cards with prize badges
- Match detail screen with player avatars stack, info card, Join button (Joined / Match full / Open states)

### 4. Teams (Tab)
- Teams list with cover image, logo, sport, skill, W-L-D record, reputation
- Create Team flow (name, sport pills, home location, skill level, crest placeholder)
- Team Dashboard: hero cover, logo, name, W-L-D pills, Schedule + Team Chat actions
- Tabs: Roster (members with Captain badge + Invite), Upcoming matches, Stats blocks, Admin (Captain only)

### 5. Social (Tab)
- Inbox segregated by All / Teams / Matches / Friends with unread badges
- Active chat screen: bubbles (sent neon green, received raised dark), Poll cards with vote counts, Location share quick action, polling-based refresh every 4s

### 6. Profile (Tab)
- Avatar, name, location, sign-out
- Stats card: Reputation (★), Attendance %, Matches played
- "Your sports" pills with skill levels
- Match history timeline with W/L/D result badges, score, sport icon

## Tech Stack
- **Frontend:** Expo SDK 54, expo-router, React Native, @expo/vector-icons (Ionicons + MaterialCommunityIcons), Outfit + Manrope fonts via @expo-google-fonts
- **Backend:** FastAPI + Motor (MongoDB async), auto-seeds 10 users / 3 teams / 20 matches / 5 chats on startup
- **Storage:** AsyncStorage via /src/utils/storage for session
- **Map:** Custom stylized canvas component (no Google Maps key needed — works in Expo Go + web)

## Out of Scope / Mocked
- Real SMS OTP (MOCKED — any 6-digit code works)
- Real device contacts sync (returns server-side seeded suggestions)
- Real geolocation (defaults to Brooklyn NY)
- Realtime sockets (chat uses 4s polling)
- Avatar upload (preset picker only)

## Business Enhancement Idea
**Reputation-gated tournaments** — competitions with prize pools restricted to users above a 4.5★ reputation threshold drive attendance, reduce no-shows, and create monetization via entry fees + sponsor placements on competition cards.
