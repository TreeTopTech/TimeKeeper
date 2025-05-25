# TimeKeeper App (Expo + TypeScript)

A minimalist, offline-first time-management app for solo users. Built with Expo, React Native, and TypeScript.

## Features
- Manual time entry: start, finish, lunch-break, notes/tags
- Weekly/fortnightly work pattern selection
- Target hours and overtime/shortfall calculation
- Accessible, light/dark mode, UK-optimized UI
- Offline-first (AsyncStorage abstraction)
- Modular for future cloud sync/auth
- Linting (ESLint + Prettier) and type checking

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- Expo CLI

### Setup
```sh
npm install
```

### Run the App
```sh
npx expo start
```

### Lint & Type Check
```sh
npx eslint . --ext .js,.jsx,.ts,.tsx
npx tsc --noEmit
```

### Run Tests
```sh
npm test
```
