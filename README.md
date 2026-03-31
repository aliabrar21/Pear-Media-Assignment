# AI Image & Text Generator

A full-stack web application that allows users to generate high-quality images from text prompts (with an AI prompt enhancer) and perform image analysis & variations (Image-to-Image).

Built with **React (Vite), Node.js, Express, and OpenAI**.

## 🌟 Features

- **Text to Image Workflow**
  - **Prompt Enhancer**: Uses GPT-4o-mini to turn a simple prompt into a highly detailed description.
  - **Image Generation**: Uses DALL-E 3 to generate breathtaking images.
  - **Direct Download**: Directly download Generated images to your device.
- **Image to Image Workflow**
  - **Image Analysis**: Upload an image using Drag & Drop, and GPT-4o Vision will analyze it, caption it, and list detected objects.
  - **Image Variations**: Uses DALL-E to generate creative variations of your uploaded image.
- **Premium UI/UX**
  - Custom Vanilla CSS styling featuring a sleek Dark Mode & Glassmorphism design.
  - Fully responsive grid layout and animated loading states.

---

## 📁 Project Structure

```
├── client/         # React Frontend (Vite)
└── server/         # Node.js + Express Backend
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- An active [OpenAI API Key](https://platform.openai.com/api-keys)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd AI-Image-Text-Generator
```

### 2. Backend Setup (`/server`)

```bash
cd server
npm install

# Create environment variables file
cp .env.example .env
```

Open `server/.env` and add your OpenAI API Key:
```env
PORT=5000
OPENAI_API_KEY=sk-your-real-api-key-here
```

Start the backend server:
```bash
npm run dev
# or: npm start
```

### 3. Frontend Setup (`/client`)

Open a new terminal window:
```bash
cd client
npm install
```

Ensure `client/.env` has the correct API URL (default is usually correct for local dev):
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```

The application will be running at [http://localhost:5173](http://localhost:5173).

---

## 🌐 Deployment Instructions

### Frontend (Vercel)
1. Push the repository to GitHub.
2. Go to Vercel and import your repository.
3. Set the **Framework Preset** to `Vite`.
4. Set the **Root Directory** to `client`.
5. Add the Environment Variable `VITE_API_URL` pointing to your deployed Backend URL (e.g., `https://your-backend.onrender.com/api`).
6. Deploy!

### Backend (Render / Railway)
1. On Render, create a New Web Service connected to your repo.
2. Set the **Root Directory** to `server`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add the Environment Variable `OPENAI_API_KEY` with your real key.
6. Deploy!

---

## 🛠️ Built With

- **Frontend**: React.js, Vite, Axios, Lucide React (Icons), Vanilla CSS
- **Backend**: Node.js, Express, Multer (Memory Storage)
- **AI Integration**: `openai` Node SDK

## 📝 Important Notes on Image Variations
OpenAI's Image Variation API strictly requires **Square PNG** files less than **4MB**. If an upload fails, the backend will return a helpful error indicating formatting constraints. Standard Vision (Analysis) accepts general JPEGs and PNGs.
