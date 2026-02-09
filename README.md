# CuraBot - AI Mental Health Support System

**CuraBot** is an advanced, empathy-driven AI mental health assistant designed to provide immediate support, crisis intervention, and therapeutic conversations. It utilizes a **Hybrid RAG (Retrieval-Augmented Generation)** architecture to deliver medically grounded advice while maintaining a conversational and supportive tone.

## 🚀 Key Features

-   **🧠 Hybrid RAG Architecture**:
    -   **Semantic Search**: Uses local embeddings (`all-MiniLM-L6-v2`) via Qdrant for privacy-focused, infinite-context retrieval.
    -   **Generative Intelligence**: Powered by **Google Gemini 2.5 Flash** for high-quality, empathetic reasoning.
-   **🚨 Real-Time Crisis Detection**:
    -   **Dual-Layer Analysis**: Combines instant Regex pattern matching with semantic sliding-window analysis to detect hidden distress signals.
    -   **Active Intervention**: Automatically triggers alerts to support teams via **Twilio SMS** and **Telegram** when a severe crisis is detected.
-   **🔐 Secure Authentication**:
    -   Support for **Google OAuth2** and **Email/Password** authentication.
    -   Stateless session management using JWT (JSON Web Tokens).
-   **💬 Persistent & Contextual Chat**:
    -   Full conversation history stored in **MongoDB Atlas**.
    -   Long-term memory ensures the bot remembers user context across sessions.
-   **⚡ Modern Frontend**:
    -   Built with **React 19**, **Vite**, and **TypeScript**.
    -   Responsive, high-performance UI with real-time streaming responses.

---

## 🛠️ Tech Stack

### **Frontend**
-   **Framework**: React (Vite)
-   **Language**: TypeScript
-   **Styling**: CSS Modules / Tailwind (implied)
-   **Icons**: Lucide React
-   **State Management**: React Hooks

### **Backend**
-   **Framework**: FastAPI (Python)
-   **Server**: Uvicorn
-   **Database**: MongoDB Atlas (User Data & Chat History)
-   **Vector Store**: Qdrant (Knowledge Base)
-   **AI Models**:
    -   LLM: Google Gemini 2.5 Flash
    -   Embeddings: HuggingFace `all-MiniLM-L6-v2` (Local execution)
-   **Authentication**: Google OAuthAdmin, PyJWT, Passlib (Bcrypt)

---

## 📦 Installation & Setup

### Prerequisites
-   **Node.js** (v18+)
-   **Python** (v3.10+)
-   **MongoDB Atlas** Cluster
-   **Google Cloud Console** Account (for Gemini & OAuth)
-   **Qdrant** Cluster (or local Docker instance)

### 1. Clone the Repository
```bash
git clone https://github.com/Rishabh23112/CuraBot.git
cd CuraBot
```

### 2. Backend Setup (`MentalHealth_API`)

Navigate to the backend directory:
```bash
cd MentalHealth_API
```

Create a virtual environment and install dependencies:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

**Configuration**:
Rename `.env.example` to `.env` and populate your API keys:
```ini
# API Keys -> .env
GEMINI_API_KEY=your_gemini_key
MONGO_URI=your_mongo_connection_string
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_key

# Auth
GOOGLE_CLIENT_ID=your_google_client_id
JWT_SECRET=your_secret_key

# Alerts (Optional)
TWILIO_ACCOUNT_SID=...
TELEGRAM_BOT_TOKEN=...
```

Run the backend server:
```bash
uvicorn main:app --reload
```
*The server will start at `http://localhost:8000`.*

### 3. Frontend Setup (`frontend`)

Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
*The app will be available at `http://localhost:5173`.*

---

## 🛡️ Security & Privacy

-   **Data Encryption**: Passwords are hashed using **Bcrypt**.
-   **Stateless Auth**: All API requests are authenticated via Bearer JWTs.
-   **Local Embeddings**: Sensitive semantic processing happens locally before sending data to the LLM.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/NewFeature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

---


