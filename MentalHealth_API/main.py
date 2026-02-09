import os
import logging
import warnings
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient
from qdrant_client import QdrantClient
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore 
from langchain_community.docstore.document import Document
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from dotenv import load_dotenv
from typing import List, Optional
import datetime
import threading
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


load_dotenv()

# routers
from src.api.routes import router as api_router
from src.crisis.detector import CrisisDetector 

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


warnings.filterwarnings("ignore", category=DeprecationWarning, module="langchain_community")

# Security for Bearer token
security = HTTPBearer(auto_error=False)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

app = FastAPI(title="Mental Health RAG API", version="1.0")

# CORS - Allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE SETUP ---

# MongoDB
try:
    MONGO_URI = os.getenv("MONGO_URI")
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    mongo_client.server_info()
    db = mongo_client["mental_health_db"]
    chat_collection = db["chat_sessions"]
    users_collection = db["users"]
    logger.info("✅ Connected to MongoDB Atlas")
except Exception as e:
    logger.error(f"❌ MongoDB Connection Failed: {e}")
    raise e

# --- PASSWORD AUTH IMPORTS ---
from passlib.context import CryptContext
from jose import jwt, JWTError
import secrets

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Settings
JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 1 week

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(user_id: str, email: str) -> str:
    """Create a JWT token for the user"""
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> Optional[dict]:
    """Verify a JWT token and return the payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        return None

def register_user(email: str, password: str, name: str) -> dict:
    """Register a new user with email/password"""
    # Check if email already exists
    existing = users_collection.find_one({"email": email.lower()})
    if existing:
        raise ValueError("Email already registered")
    
    new_user = {
        "email": email.lower(),
        "password_hash": hash_password(password),
        "name": name,
        "avatar": f"https://api.dicebear.com/9.x/avataaars/svg?seed={name}",
        "auth_type": "email",
        "created_at": datetime.datetime.utcnow(),
        "last_login": datetime.datetime.utcnow()
    }
    result = users_collection.insert_one(new_user)
    new_user["_id"] = str(result.inserted_id)
    del new_user["password_hash"]  # Don't return password hash
    return new_user

def login_user(email: str, password: str) -> Optional[dict]:
    """Login a user with email/password"""
    user = users_collection.find_one({"email": email.lower()})
    if not user:
        return None
    
    # Check if this is an email auth user
    if user.get("auth_type") != "email" or "password_hash" not in user:
        return None
    
    if not verify_password(password, user["password_hash"]):
        return None
    
    # Update last login
    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.datetime.utcnow()}}
    )
    
    user["_id"] = str(user["_id"])
    del user["password_hash"]  # Don't return password hash
    return user

# --- GOOGLE AUTH HELPERS ---

def verify_google_token(token: str) -> Optional[dict]:
    """Verify Google ID token and return user info"""
    try:
        idinfo = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        return {
            "google_id": idinfo["sub"],
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
            "picture": idinfo.get("picture")
        }
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None

def get_or_create_user(google_user: dict) -> dict:
    """Get existing user or create new one from Google user info"""
    existing = users_collection.find_one({"google_id": google_user["google_id"]})
    if existing:
        # Update last login
        users_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {"last_login": datetime.datetime.utcnow()}}
        )
        existing["_id"] = str(existing["_id"])
        return existing
    
    # Create new user
    new_user = {
        "google_id": google_user["google_id"],
        "email": google_user["email"],
        "name": google_user["name"],
        "avatar": google_user["picture"],
        "created_at": datetime.datetime.utcnow(),
        "last_login": datetime.datetime.utcnow()
    }
    result = users_collection.insert_one(new_user)
    new_user["_id"] = str(result.inserted_id)
    return new_user

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    """Dependency to get current user from token"""
    if not credentials:
        return None
    google_user = verify_google_token(credentials.credentials)
    if not google_user:
        return None
    return get_or_create_user(google_user)

# Helpers for MongoDB (Chat Sessions)
def get_mongo_history(session_id: str, limit: int = 10) -> List:
    record = chat_collection.find_one({"session_id": session_id})
    if not record:
        return []
    messages = []
    for msg in record.get("messages", [])[-limit:]:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "ai":
            messages.append(AIMessage(content=msg["content"]))
        elif msg["role"] == "system":
            messages.append(SystemMessage(content=msg["content"]))
    return messages

def save_message_to_mongo(session_id: str, role: str, content: str, user_id: str = None, title: str = None):
    message_doc = {
        "role": role,
        "content": content,
        "timestamp": datetime.datetime.utcnow()
    }
    
    update_data = {
        "$push": {"messages": message_doc},
        "$set": {"updated_at": datetime.datetime.utcnow()}
    }
    
    # Set user_id only on insert to avoid conflict
    if user_id:
        update_data["$setOnInsert"] = {
            "user_id": user_id,
            "created_at": datetime.datetime.utcnow()
        }
    
    if title:
        update_data["$set"]["title"] = title
    
    chat_collection.update_one(
        {"session_id": session_id},
        update_data,
        upsert=True
    )

# Qdrant
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "mental_health_rag_local"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.warning("⚠️ GEMINI_API_KEY not found in environment variables.")

# Initialize Embeddings Services
try:
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    logger.info("✅ HuggingFace Local Embeddings initialized (all-MiniLM-L6-v2)")
except Exception as e:
    logger.error(f"❌ Failed to initialize embeddings: {e}")
    embeddings = None

try:
    qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    logger.info("✅ Qdrant client initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize Qdrant client: {e}")
    qdrant_client = None

try:
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7, google_api_key=GEMINI_API_KEY)
    logger.info("✅ ChatGoogleGenerativeAI initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize LLM: {e}")
    llm = None

def init_knowledge_base():
    if not qdrant_client or not embeddings:
        logger.error("❌ Qdrant client or embeddings not initialized. Cannot initialize knowledge base.")
        return None
    try:
        qdrant_client.get_collection(COLLECTION_NAME)
        logger.info(f"✅ Connected to Qdrant Collection: {COLLECTION_NAME}")
    
        return QdrantVectorStore(client=qdrant_client, collection_name=COLLECTION_NAME, embedding=embeddings)
    except Exception:
        logger.warning("⚠️ Collection not found. Creating new Qdrant collection...")
        seed_docs = [
            Document(page_content="EMERGENCY PROTOCOL: If a user expresses intent of suicide, self-harm, or harm to others, IMMEDIATELY stop therapy and provide: Helpline: 911.", metadata={"source": "Safety Protocol v1"}),
            Document(page_content="Technique: Box Breathing. Inhale 4s, Hold 4s, Exhale 4s, Hold 4s. Useful for panic attacks.", metadata={"source": "Clinical Handbook"})
        ]
        try:
            from qdrant_client.http import models as qdrant_models
            
            # Explicitly create collection appropriately for Local Embeddings 
            qdrant_client.recreate_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=qdrant_models.VectorParams(size=384, distance=qdrant_models.Distance.COSINE)
            )
            
            # Initialize wrapper and add docs 
            qdrant_store = QdrantVectorStore(client=qdrant_client, collection_name=COLLECTION_NAME, embedding=embeddings)
            qdrant_store.add_documents(seed_docs)
            return qdrant_store
            
        except Exception as seed_error:
            logger.error(f"❌ Failed to seed collection: {seed_error}")
            return None

try:
    vector_store = init_knowledge_base()
except Exception as e:
    logger.error(f"❌ Failed to initialize Vector Store: {e}")
    vector_store = None

SYSTEM_PROMPT = """You are a Mental Health Support Assistant. Your goal is to listen carefully to the user's specific concern and provide personalized, actionable guidance.

**Important Guidelines:**
1. Focus ONLY on what the user is asking about RIGHT NOW - don't give generic advice
2. Be warm, empathetic, and conversational
3. If they mention crisis/self-harm: Provide 911 (Helpline)
4. Provide practical, specific advice relevant to their situation
5. Each response should be unique based on their actual question

Respond directly and naturally - no need for special formatting. Just have a helpful conversation."""


detector_instance = CrisisDetector(embeddings_model=embeddings)

app.state.llm = llm
app.state.vector_store = vector_store
app.state.save_message = save_message_to_mongo
app.state.get_history = get_mongo_history
app.state.system_prompt = SYSTEM_PROMPT
app.state.detector = detector_instance

# Auth-related state
app.state.verify_google_token = verify_google_token
app.state.get_or_create_user = get_or_create_user
app.state.chat_collection = chat_collection
app.state.users_collection = users_collection
app.state.get_current_user = get_current_user

# Email auth state
app.state.register_user = register_user
app.state.login_user = login_user
app.state.create_jwt_token = create_jwt_token
app.state.verify_jwt_token = verify_jwt_token

app.include_router(api_router)