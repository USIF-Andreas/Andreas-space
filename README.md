# Andreas-space

Personal website and portfolio showcasing projects, skills, and ideas.

## 🌐 Live Link
[https://andreas-space-production.up.railway.app/](https://andreas-space-production.up.railway.app/)

## 🛠️ Tools, Technologies & Specs

Here are the specific technologies and technical specifications used in this project:

### Frontend
- **Core:** HTML5, CSS3, Vanilla JavaScript
- **Static Delivery:** Served via `@nestjs/serve-static`

### Backend (Chatbot System)
- **Framework:** [NestJS](https://nestjs.com/) (v10.4) with TypeScript
- **AI Integration:** Powered by OpenRouter API (via `axios` & `@nestjs/axios`)
- **Features:** RAG (Retrieval-Augmented Generation) mapping user data from CV
- **Validation:** `class-validator` and `class-transformer` for DTO validation, environment configured with `dotenv` & `@nestjs/config`

### Deployment & Infrastructure
- **Platform:** [Railway](https://railway.app/)
- **Build System:** Custom Nixpacks (`nixpacks.toml`) pulling Node.js dependencies
- **Configuration:** Managed via `railway.json` defining build/start paths (`cd portfolio/chatbot`) and auto-restart policies.

## 📂 Project Structure

- `portfolio/` - Contains the static portfolio website (`index.html`, `style.css`, `script.js`).
- `portfolio/chatbot/` - Contains the backend logic and API using NestJS for the embedded chatbot widget.
