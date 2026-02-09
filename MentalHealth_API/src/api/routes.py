from fastapi import APIRouter, HTTPException, Form, UploadFile, File, BackgroundTasks, Request
from langchain_core.messages import HumanMessage, ToolMessage
from langchain_core.tools import tool
import logging
import uuid
import shutil
import os
import re

from ..alerts.dispatcher import AlertDispatcher

router = APIRouter()
logger = logging.getLogger(__name__)

dispatcher = AlertDispatcher()

# --- TOOL CALLING ---
@tool
def trigger_crisis_alert(reason: str):
    """
    Call this tool IMMEDIATELY if the user expresses intent of self-harm, suicide, or is in a severe crisis situation.
    This will alert a human support team.
    
    Args:
        reason: A short description of the crisis (e.g., "User is threatening suicide").
    """

    return "Crisis alert triggered."


# --- AUTH ENDPOINTS ---

@router.post("/auth/google")
async def google_auth(request: Request):
    """Verify Google ID token and return user info"""
    try:
        body = await request.json()
        token = body.get("token")
        
        if not token:
            raise HTTPException(status_code=400, detail="Token required")
        
        verify_token = request.app.state.verify_google_token
        get_or_create = request.app.state.get_or_create_user
        
        google_user = verify_token(token)
        if not google_user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = get_or_create(google_user)
        
        return {
            "success": True,
            "user": {
                "id": user.get("_id") or user.get("google_id"),
                "google_id": user["google_id"],
                "name": user["name"],
                "email": user["email"],
                "avatar": user.get("avatar")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/register")
async def register(request: Request):
    """Register a new user with email/password"""
    try:
        body = await request.json()
        email = body.get("email", "").strip()
        password = body.get("password", "")
        name = body.get("name", "").strip()
        
        # Validation
        if not email or "@" not in email:
            raise HTTPException(status_code=400, detail="Valid email required")
        if len(password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        if not name:
            raise HTTPException(status_code=400, detail="Name required")
        
        register_user = request.app.state.register_user
        create_token = request.app.state.create_jwt_token
        
        try:
            user = register_user(email, password, name)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Create JWT token
        token = create_token(user["_id"], user["email"])
        
        return {
            "success": True,
            "user": {
                "id": user["_id"],
                "name": user["name"],
                "email": user["email"],
                "avatar": user.get("avatar")
            },
            "token": token
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/auth/login")
async def login(request: Request):
    """Login with email/password"""
    try:
        body = await request.json()
        email = body.get("email", "").strip()
        password = body.get("password", "")
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")
        
        login_user = request.app.state.login_user
        create_token = request.app.state.create_jwt_token
        
        user = login_user(email, password)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create JWT token
        token = create_token(user["_id"], user["email"])
        
        return {
            "success": True,
            "user": {
                "id": user["_id"],
                "name": user["name"],
                "email": user["email"],
                "avatar": user.get("avatar")
            },
            "token": token
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


# --- SESSION ENDPOINTS ---

@router.get("/sessions")
async def list_sessions(request: Request, user_id: str):
    """List all chat sessions for a user"""
    try:
        chat_collection = request.app.state.chat_collection
        
        sessions = list(chat_collection.find(
            {"user_id": user_id},
            {"session_id": 1, "title": 1, "updated_at": 1, "created_at": 1, "_id": 0}
        ).sort("updated_at", -1).limit(50))
        
        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}")
async def get_session(request: Request, session_id: str, user_id: str):
    """Get a specific chat session with messages"""
    try:
        chat_collection = request.app.state.chat_collection
        
        session = chat_collection.find_one({
            "session_id": session_id,
            "user_id": user_id
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "session_id": session["session_id"],
            "user_id": session["user_id"],
            "title": session.get("title", "Conversation"),
            "messages": session.get("messages", []),
            "created_at": session.get("created_at"),
            "updated_at": session.get("updated_at")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}")
async def delete_session(request: Request, session_id: str, user_id: str):
    """Delete a chat session"""
    try:
        chat_collection = request.app.state.chat_collection
        
        result = chat_collection.delete_one({
            "session_id": session_id,
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"success": True, "message": "Session deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    query: str = Form(...),
    session_id: str = Form(...),
    user_id: str = Form(None),
    user_name: str = Form("Anonymous"),
    user_location: str = Form("Unknown"),
    title: str = Form(None),
    file: UploadFile = File(None)
):
    """
    Main Chat Endpoint with LLM Tool Calling for Crisis Detection.
    """
    try:
        llm = request.app.state.llm
        vector_store = request.app.state.vector_store
        save_message = request.app.state.save_message
        get_history = request.app.state.get_history
        system_prompt = request.app.state.system_prompt
       

        if not llm:
            raise HTTPException(status_code=503, detail="AI service not available.")

        # --- FAST CRISIS CHECK (Local Detector) ---
        # This runs locally using Regex + Embeddings (Cached) and catches obvious cases without needing the LLM, saving tokens and time.
         
        detector = request.app.state.detector
        if detector:
            is_crisis, reason = detector.detect(query)
            if is_crisis:
                logger.warning(f"🚨 Fast Crisis/Alert Triggered: {reason}")
                
                 # Execute Logic (Dispatcher)
                background_tasks.add_task(
                    dispatcher.trigger_alert,
                    user_name=user_name,
                    reason=reason,
                    location=user_location,
                    short_message=query
                )
                
                crisis_response = (
                    "I'm concerned about what you're sharing. You are not alone. "
                    "Please contact emergency services at 911. "
                    "I have also notified a support team to check on you."
                )
                
                save_message(session_id, "user", query, user_id=user_id, title=title)
                save_message(session_id, "ai", crisis_response, user_id=user_id)
                
                return {
                    "reply": crisis_response,
                    "reasoning": reason,
                    "citations": []
                }

        # Bind Tools to LLM
        llm_with_tools = llm.bind_tools([trigger_crisis_alert])

        # PREPARE CONTEXT (File, RAG, History) for the LLM before it decides
        
        # File Processing
        file_context = ""
        if file:
            logger.info(f"Processing file: {file.filename}")
            temp_filename = f"temp_{uuid.uuid4()}_{file.filename}"
            try:
                with open(temp_filename, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                from langchain_community.document_loaders import PyPDFLoader
                loader = PyPDFLoader(temp_filename)
                pages = loader.load()
                full_text = "\n".join([p.page_content for p in pages])
                file_context = f"\n\n[USER UPLOADED FILE CONTENT]:\n{full_text[:50000]}\n"
                save_message(session_id, "system", f"User uploaded file: {file.filename}")
            except Exception as e:
                logger.error(f"File parsing error: {e}")
                file_context = "\n[System: Error reading uploaded file]\n"
            finally:
                if os.path.exists(temp_filename):
                    os.remove(temp_filename)

        # RAG Search
        rag_context = ""
        docs = []
        if vector_store:
            try:
                docs = vector_store.similarity_search(query, k=3)
                rag_context = "\n".join([f"PROTOCOL: {d.page_content} (Source: {d.metadata.get('source', 'Unknown')})" for d in docs])
            except Exception as e:
                logger.error(f"RAG Error: {e}")
        
        # History
        history_msgs = get_history(session_id, limit=10)
        history_text = ""
        for msg in history_msgs:
            role_name = "User" if isinstance(msg, HumanMessage) else "AI"
            history_text += f"{role_name}: {msg.content}\n"

        # Construct Prompt
        # We instruct the LLM on its tools in the system prompt implicitly by binding
        final_prompt = f"""{system_prompt}

IMPORTANT: You verify if the user is in a crisis. 
CRITICAL RULE: Evaluate ONLY the 'CURRENT USER QUESTION' for crisis intent. Do NOT trigger a crisis alert based on the 'CONVERSATION HISTORY' if the current message is harmless (e.g. "I am anxious" or "I am fine"). Only trigger if the CURRENT message implies immediate harm.

CURRENT USER QUESTION: {query}
{file_context}

CONVERSATION HISTORY (Use for context, but NOT for crisis triggering):
{history_text}

KNOWLEDGE BASE CONTEXT:
{rag_context}
"""
        
        # INVOKE LLM
        response = llm_with_tools.invoke([HumanMessage(content=final_prompt)])
        
        # CHECK FOR TOOL CALLS
        if response.tool_calls:
            # The LLM decided to call a tool (Crisis Detected!)
            tool_call = response.tool_calls[0] 
            if tool_call["name"] == "trigger_crisis_alert":
                reason = tool_call["args"].get("reason", "Crisis detected by LLM")
                logger.warning(f"🚨 LLM Triggered Crisis Alert: {reason}")
                
                # Execute Logic (Dispatcher)
                background_tasks.add_task(
                    dispatcher.trigger_alert,
                    user_name=user_name,
                    reason=reason,
                    location=user_location,
                    short_message=query
                )
                
                crisis_response = (
                    "I'm concerned about what you're sharing. You are not alone. "
                    "Please contact the Helpline at 911. "
                    "I have also notified a support team to check on you."
                )
                
                save_message(session_id, "user", query, user_id=user_id, title=title)
                save_message(session_id, "ai", crisis_response, user_id=user_id)
                
                return {
                    "reply": crisis_response,
                    "reasoning": reason,
                    "citations": []
                }
        
        # 4. STANDARD RESPONSE (No crisis detected)
        raw_content = response.content
        full_content = ""

        try:
            
            if isinstance(raw_content, dict):
                full_content = raw_content.get("text", str(raw_content))
            
        
            else:
                text_content = str(raw_content)
                # Try to parse if it looks like a dict structure
                if text_content.strip().startswith("{"):
                    import ast
                    try:
                        parsed = ast.literal_eval(text_content)
                        if isinstance(parsed, dict) and "text" in parsed:
                            full_content = parsed["text"]
                        else:
                            full_content = text_content
                    except:
                        full_content = text_content
                else:
                    full_content = text_content

            
            if isinstance(full_content, str):
                 full_content = full_content.replace("\\n", "\n").replace("\\", "")
            else:
                 full_content = str(full_content)

        except Exception as e:
            logger.error(f"Response Parsing Error: {e}")
            full_content = str(response.content)

        # Parse thinking tags if present
        final_reply = full_content
        ai_thinking = "Processed"
        thinking_match = re.search(r'<thinking>(.*?)</thinking>', full_content, re.DOTALL)
        response_match = re.search(r'<response>(.*?)</response>', full_content, re.DOTALL)
        
        if thinking_match:
            ai_thinking = thinking_match.group(1).strip()
        if response_match:
            final_reply = response_match.group(1).strip()
            
        save_message(session_id, "user", query, user_id=user_id, title=title)
        save_message(session_id, "ai", final_reply, user_id=user_id)
        
        return {
            "reply": final_reply,
            "reasoning": ai_thinking,
            "citations": [d.metadata.get('source') for d in docs]
        }
        
    except Exception as e:
        logger.error(f"Router Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
