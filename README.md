<p align="center">
  <img src="https://img.shields.io/badge/StoryFlow-AI-blueviolet?style=for-the-badge&logo=bookstack&logoColor=white" alt="StoryFlow AI" />
</p>

<h1 align="center">📖 StoryFlow AI — AI-Powered Storytelling Platform</h1>

<p align="center">
  <strong>Craft compelling stories, build rich characters, and explore immersive worlds — powered by Google Gemini AI.</strong>
</p>

<p align="center">
  <a href="https://ai-powered-story-telling.vercel.app">🌐 Live Demo</a> •
  <a href="#features">✨ Features</a> •
  <a href="#tech-stack">🛠️ Tech Stack</a> •
  <a href="#getting-started">🚀 Getting Started</a> •
  <a href="#ai-features">🤖 AI Features</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white&style=flat-square" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white&style=flat-square" alt="Express.js" />
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black&style=flat-square" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white&style=flat-square" alt="Node.js" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black&style=flat-square" alt="Firebase" />
  <img src="https://img.shields.io/badge/Gemini%20AI-4285F4?logo=google&logoColor=white&style=flat-square" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white&style=flat-square" alt="Vercel" />
</p>

---

## 📖 About

**StoryFlow AI** is an AI-assisted creative writing platform that helps writers generate stories, develop characters, and build worlds. Built on the **MERN stack** (MongoDB, Express.js, React, Node.js) with **Google Gemini AI** integration for intelligent content generation.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Story Generation** | Generate plot outlines, story ideas, and narrative content using Google Gemini |
| 🧙 **LoreForge** | AI-powered character builder — personality, backstory, quirks, and more |
| 📚 **Story Management** | Create, organize, and manage multiple stories |
| 🔐 **Authentication** | Secure login/signup with Firebase Auth |
| ☁️ **Cloud Storage** | Stories and characters persisted in Firestore |
| ✍️ **Rich Text Editor** | Write and format stories with a full-featured editor |
| 👥 **Collaboration** | Invite others to view or contribute to your stories |
| 📱 **Responsive UI** | Works seamlessly on desktop and mobile |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **HTML5 / CSS3** | Structure & styling |
| **JavaScript (ES6+)** | Client-side logic |
| **Tailwind CSS** | Utility-first styling |
| **Vite** | Build tool & dev server |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | Server runtime |
| **Express.js** | API framework & routing |
| **MongoDB** | Primary database (via Mongoose) |
| **Firebase Auth** | User authentication |
| **Cloud Firestore** | Real-time data sync |

### AI & APIs
| Technology | Purpose |
|-----------|---------|
| **Google Gemini API** | AI-powered content generation |
| **Vercel AI SDK v6** | Streaming AI responses |

### Deployment
| Technology | Purpose |
|-----------|---------|
| **Vercel** | Frontend + serverless deployment |

---

## 🤖 AI Features

StoryFlow AI uses the **Vercel AI SDK v6** with structured output via **Zod schemas** for the following AI endpoints:

### 1. 🧙 Character Generation (`/api/ai/generate-character`)
- Auto-generate characters with **name, role, description, and quirks**
- Structured JSON output via `Output.object()` + Zod schema
- Genre-aware (fantasy, sci-fi, mystery, etc.)

### 2. 📖 Plot Suggestion (`/api/ai/generate-plot`)
- AI suggests plot branches and twists based on story context
- Returns structured `{ title, content }` objects

### 3. ✍️ Writing Assistance (`/api/ai/writing-suggest`)
- **Continue** — AI continues the story from where you left off
- **Improve** — Enhance and refine existing paragraphs
- **Dialogue** — Generate character-appropriate dialogue with action beats

### 4. 🎨 Portrait Description (`/api/ai/portrait-description`)
- Generate detailed visual descriptions for character portraits
- Returns `{ visualDescription, seedKeywords }` for image generation

### AI Architecture
```
Frontend (React) → aiService.ts → fetch('/api/ai/...') → Express server → Vercel AI SDK → LLM
```
All AI calls go through the Express backend (`server.ts`), keeping API keys secure on the server side.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Google Gemini API Key](https://aistudio.google.com/apikey)
- [Firebase Project](https://console.firebase.google.com/) with Auth & Firestore enabled

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Samrudh2006/ai.powered.story.telling.git
cd ai.powered.story.telling

# 2. Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# AI Configuration
GEMINI_API_KEY=your_gemini_api_key
VITE_AI_API_KEY=your_gemini_api_key

# MongoDB
MONGODB_URI=mongodb://localhost:27017/storyflow

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Run the App

```bash
# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser 🎉

---

## 📁 Project Structure

```
ai.powered.story.telling/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── explore/         # Story exploration & LoreForge
│   │   └── SplashScreen.tsx # Loading/splash screen
│   ├── pages/               # Route pages
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   └── Login.tsx        # Auth page
│   └── App.tsx              # Root component with routing
├── server.ts                # Express server with AI API routes
├── firestore.rules          # Firestore security rules
├── firebase-applet-config.json
├── firebase-blueprint.json
├── vite.config.ts           # Vite configuration
├── package.json
└── .env.example             # Environment variables template
```

---

## 🔧 Troubleshooting AI Features

### ⚠️ Known Issues (from code review)

After cloning and reviewing the repository, the following AI-related issues were identified:

1. **Missing AI Provider Package**
   - `server.ts` uses `model: 'openai/gpt-4o-mini'` via Vercel AI SDK v6, but **`@ai-sdk/openai` is not installed**.
   - **Fix:** Run `npm install @ai-sdk/openai` and configure the provider:
     ```ts
     // server.ts — add at the top
     import { openai } from '@ai-sdk/openai';

     // Then use:  model: openai('gpt-4o-mini')  instead of  model: 'openai/gpt-4o-mini'
     ```

2. **API Key Not Wired**
   - The server expects an `OPENAI_API_KEY` environment variable (required by `@ai-sdk/openai`), but `.env.example` only lists `GEMINI_API_KEY` / `VITE_AI_API_KEY`.
   - **Fix:** Add `OPENAI_API_KEY=your_key` to `.env.local`, **or** switch to Gemini:
     ```bash
     npm install @ai-sdk/google
     ```
     ```ts
     import { google } from '@ai-sdk/google';
     // Use:  model: google('gemini-2.0-flash')
     ```

3. **Dual Database Conflict**
   - Both `mongoose` (MongoDB) and `firebase` are in `package.json`. The app currently uses Firebase/Firestore. Mongoose is unused.
   - **Fix:** Remove `mongoose` if not needed: `npm uninstall mongoose`

### General Troubleshooting

| Issue | Solution |
|-------|---------|
| AI not responding | Ensure the correct API key (`OPENAI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`) is set in `.env.local` |
| "Model not found" error | Install the matching provider: `@ai-sdk/openai` or `@ai-sdk/google` |
| Structured output failing | Verify `Output.object()` schema matches the expected Zod schema |
| Rate limit errors | Add retry logic or reduce request frequency |
| CORS errors | Verify Express routes are handling CORS headers |

---

## 🌐 Live Demo

👉 **[ai-powered-story-telling.vercel.app](https://ai-powered-story-telling.vercel.app)**

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

## 📄 License

This project is open source. See the repository for license details.

---

## 👥 Team

| # | Name | Role | Responsibilities |
|---|------|------|-----------------|
| 1 | **Jahnavi** | Backend Logic Developer | Server-side logic, Express.js API routes, AI integration logic, Gemini API service layer |
| 2 | **Samrudh** | Frontend Developer (UI/UX) | React components, responsive design, HTML/CSS/JS, user interface & experience |
| 3 | **Sathwik** | Integration & Deployment Engineer | UI + Backend + Logic integration, Vercel deployment, CI/CD, environment configuration |
| 4 | **Revanth** | Documentation & Testing | README, project documentation, manual & automated testing, QA |
| 5 | **Raja Sekhar** | Database Designer | MongoDB schema design, Firestore data modeling, database architecture & optimization |

---

## 📄 License

This project is open source. See the repository for license details.

---

<p align="center">
  Made with ❤️ by <strong>Team StoryFlow</strong> — Jahnavi · Samrudh · Sathwik · Revanth · Raja Sekhar
  <br/>
  Powered by the MERN Stack & Google Gemini AI
</p>
