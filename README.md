# Palmingo 🦩

An ASL (American Sign Language) learning app with a dictionary, quiz system, and translation features.

## Prerequisites

Make sure you have the following installed:

- Python 3.8+
- Node.js 18+
- npm

---

## Getting Started

### Backend

1. Navigate to the backend folder:
```bash
   cd backend
```

2. Create and activate a virtual environment:
```bash
   python -m venv venv

   # Windows
   venv\Scripts\activate

   # Mac/Linux
   source venv/bin/activate
```

3. Install dependencies:
```bash
   pip install -r requirements.txt
```

4. Run the server:
```bash
   python main.py
```

The backend will start running at `http://localhost:8000`

---

### Frontend

1. Open a new terminal and navigate to the frontend folder:
```bash
   cd frontend
```

2. Install dependencies:
```bash
   npm install
```

3. Start the development server:
```bash
   npm run dev
```

The app will be available at `http://localhost:5173`

---

## Environment Variables

Create a `.env` file inside the `frontend/` folder with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Project Structure

```
palmingo/
├── backend/
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── main.jsx
    ├── public/
    └── package.json
```

---

## Features

- 📖 ASL Dictionary — browse alphabet, digits, and word categories
- 🎯 Quiz System — ASL to text and text to ASL drills with XP rewards
- 🔓 Progression — unlock word categories as you earn XP
- 🏆 Mastery Tracking — track which signs you've mastered
- 📷 Translate — use your camera to translate signs
