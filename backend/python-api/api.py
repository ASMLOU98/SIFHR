from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import uuid
import time
import re
import threading
import json
from datetime import datetime
from dotenv import load_dotenv
from gtts import gTTS
import io

# Chargement des variables d'environnement
load_dotenv()

# ====================
# CONFIGURATION
# ====================
app = Flask(__name__)
CORS(app)

# Configuration simple pour éviter les erreurs Langchain
try:
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
    from langchain_community.chat_message_histories import ChatMessageHistory
    from langchain_core.runnables.history import RunnableWithMessageHistory
    
    # Configuration du modèle
    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model="llama-3.1-8b-instant",
        temperature=0.8,
        max_tokens=300,
        timeout=8,
        max_retries=1,
    )
    
    SYSTEM_PROMPT = """Tu es Sifhr, Gardien du monde SIFHR. 
    Réponds toujours avec 1-2 phrases.
    Réponds toujours dans la langue de l'utilisateur.
    Style : dramatique, mystérieux, voix masculine grave."""
    
    EXPLORER_PROMPT = """Tu es une explorateur adolescent curieux et enthousiaste.
    Pose des questions simples et directes sur l'histoire.
    Tonalité : jeune, vive, curieux."""
    
    # GESTION DE LA MÉMOIRE
    store = {}
    
    def get_session_memory(session_id):
        """Retourne l'historique de la session"""
        if session_id not in store:
            store[session_id] = ChatMessageHistory()
        return store[session_id]
    
    # Chaînes de conversation
    guardian_prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="history"),
        ("user", "{input}")
    ])
    
    guardian_chain = guardian_prompt | llm
    
    guardian_with_history = RunnableWithMessageHistory(
        guardian_chain,
        get_session_memory,
        input_messages_key="input",
        history_messages_key="history",
    )
    
    explorer_prompt = ChatPromptTemplate.from_messages([
        ("system", EXPLORER_PROMPT),
        ("user", "{input}")
    ])
    
    explorer_chain = explorer_prompt | llm
    
    def get_ai_response(user_message, session_id="default"):
        """Obtient une réponse de l'IA (toujours du gardien)"""
        try:
            response = guardian_with_history.invoke(
                {"input": user_message},
                config={"configurable": {"session_id": session_id}}
            )
            
            reply = response.content if hasattr(response, 'content') else str(response)
            return reply
            
        except Exception as e:
            print(f"Erreur IA: {e}")
            return "Les échos des anciens résonnent faiblement..."
    
    LANGCHAIN_AVAILABLE = True
    
except ImportError as e:
    print(f"⚠️ Langchain non disponible: {e}")
    print("⚠️ Utilisation du mode simple (réponses prédéfinies)")
    LANGCHAIN_AVAILABLE = False
    
    def get_ai_response(user_message, session_id="default"):
        """Réponses simples quand Langchain n'est pas disponible"""
        responses = [
            "Je suis Sifhr, gardien des anciens savoirs.",
            "La civilisation arabo-musulmane était un phare de connaissances.",
            "Les étoiles murmurent les secrets des anciens.",
            "Le temps a usé les pierres mais pas la mémoire.",
            "Les bibliothèques de Bagdad brillaient comme des diamants.",
            "L'eau et le savoir sont les sources de la vie.",
            "Les érudits arabes ont préservé la science grecque.",
            "Les étoiles guident les voyageurs et les sages.",
            "Le désert cache plus qu'il ne révèle.",
            "Les manuscrits sont les gardiens de la mémoire."
        ]
        import random
        return random.choice(responses)

# ====================
# CACHE ET FICHIERS
# ====================
response_cache = {}
audio_files = {}
CACHE_DURATION = 30

# ====================
# SAUVEGARDE DES SCÉNARIOS
# ====================
SENARIO_DIR = "senario"
session_scenarios = {}  # {session_id: [{"parlent": "...", "text": "..."}]}

def ensure_senario_dir():
    """Crée le répertoire scénario si nécessaire"""
    if not os.path.exists(SENARIO_DIR):
        os.makedirs(SENARIO_DIR)
        print(f"📁 Dossier créé: {SENARIO_DIR}")
    else:
        print(f"📁 Dossier existe: {SENARIO_DIR}")
        files = os.listdir(SENARIO_DIR)
        print(f"   Contient {len(files)} fichiers")

def save_session_scenario(session_id, scenario):
    """Sauvegarde le scénario d'une session dans un fichier JSON"""
    ensure_senario_dir()
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{SENARIO_DIR}/Sénario_SIFHR_{session_id}_{timestamp}.json"
    
    scenario_data = {
        "titre": f"Sénario SIFHR - Session {session_id}",
        "date_creation": timestamp,
        "session_id": session_id,
        "personnages": {
            "explorateur": "EXPLORATEUR",
            "gardien": "GARDIEN SIFHR"
        },
        "scenario": scenario,
        "metadata": {
            "total_repliques": len(scenario),
            "langchain_available": LANGCHAIN_AVAILABLE,
            "format": "parlent/text"
        }
    }
    
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(scenario_data, f, ensure_ascii=False, indent=2)
        print(f"✅ Scénario sauvegardé: {filename}")
        return filename
    except Exception as e:
        print(f"❌ Erreur sauvegarde: {e}")
        return None

def split_text_for_tts(text, max_chars=900):
    if len(text) <= max_chars:
        return [text]
    
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        if len(sentence) > max_chars:
            for i in range(0, len(sentence), max_chars):
                chunks.append(sentence[i:i+max_chars])
        elif len(current_chunk) + len(sentence) + 1 <= max_chars:
            current_chunk += sentence + " "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + " "
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks

def generate_long_mp3(text, avatar, file_id):
    try:
        slow_speech = (avatar == "guardian")
        chunks = split_text_for_tts(text, max_chars=900)
        
        if not chunks:
            return False
        
        if len(chunks) == 1:
            tts = gTTS(
                text=chunks[0], 
                lang='fr', 
                slow=slow_speech,
                tld='com'
            )
            mp3_path = os.path.join(tempfile.gettempdir(), f"{file_id}.mp3")
            tts.save(mp3_path)
        else:
            audio_segments = []
            
            for i, chunk in enumerate(chunks):
                print(f"Génération chunk {i+1}/{len(chunks)} pour {avatar}")
                
                tts = gTTS(
                    text=chunk, 
                    lang='fr', 
                    slow=slow_speech,
                    tld='com'
                )
                
                buffer = io.BytesIO()
                tts.write_to_fp(buffer)
                buffer.seek(0)
                audio_segments.append(buffer)
            
            mp3_path = os.path.join(tempfile.gettempdir(), f"{file_id}.mp3")
            
            with open(mp3_path, 'wb') as final_file:
                for segment in audio_segments:
                    final_file.write(segment.read())
                    segment.close()
        
        if os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 0:
            audio_files[file_id] = {
                "path": mp3_path,
                "ready": True,
                "timestamp": time.time(),
                "avatar": avatar,
                "text_length": len(text),
                "chunks": len(chunks) if 'chunks' in locals() else 1
            }
            print(f"✅ MP3 généré ({len(chunks)} chunks, {len(text)} caractères)")
            return True
        else:
            audio_files[file_id] = {"ready": False, "error": "Fichier vide"}
            return False
            
    except Exception as e:
        print(f"❌ Erreur génération MP3 long: {e}")
        audio_files[file_id] = {"ready": False, "error": str(e), "avatar": avatar}
        return False

# ====================
# ENDPOINTS API
# ====================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "OK",
        "langchain": LANGCHAIN_AVAILABLE,
        "audio": "MP3 support",
        "scenario_save": "JSON format parlent/text",
        "scenario_dir": SENARIO_DIR
    })

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Données JSON manquantes"}), 400
            
        message = data.get('message', '').strip()
        session_id = data.get('session_id', 'default')
        
        if not message:
            return jsonify({"error": "Message requis"}), 400
        
        # Initialiser le scénario pour cette session
        if session_id not in session_scenarios:
            session_scenarios[session_id] = []
        
        # Ajouter la question de l'explorateur au scénario
        session_scenarios[session_id].append({
            "parlent": "EXPLORATEUR",
            "text": message,
            "timestamp": time.time()
        })
        
        # Générer la réponse du gardien
        reply = get_ai_response(message, session_id)
        
        if len(reply) > 6000:
            reply = reply[:6000] + "... [texte tronqué]"
        
        # Ajouter la réponse du gardien au scénario
        session_scenarios[session_id].append({
            "parlent": "GARDIEN SIFHR",
            "text": reply,
            "timestamp": time.time()
        })
        
        # Générer l'audio
        audio_id = str(uuid.uuid4())[:8]
        thread = threading.Thread(
            target=generate_long_mp3,
            args=(reply, "guardian", audio_id)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            "reply": reply,
            "session_id": session_id,
            "audio_id": audio_id,
            "audio_url": f"/audio/{audio_id}",
            "avatar": "guardian",
            "text_length": len(reply),
            "scenario_length": len(session_scenarios[session_id])
        })
        
    except Exception as e:
        print(f"❌ Erreur /chat: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/tts', methods=['POST'])
def tts():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Données JSON manquantes"}), 400
            
        texte = data.get('text', '').strip()
        avatar = data.get('avatar', 'guardian').lower()
        
        if avatar not in ['explorer', 'guardian']:
            avatar = 'guardian'
        
        if not texte:
            return jsonify({"error": "Texte requis"}), 400
        
        # Limite à 6000 caractères
        if len(texte) > 6000:
            texte = texte[:6000] + "..."
            print(f"⚠️ Texte tronqué à 6000 caractères")
        
        audio_id = str(uuid.uuid4())[:8]
        
        # Lancement en thread
        thread = threading.Thread(
            target=generate_long_mp3,
            args=(texte, avatar, audio_id)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            "success": True,
            "audio_id": audio_id,
            "audio_url": f"/audio/{audio_id}",
            "avatar": avatar,
            "text_length": len(texte),
            "processing": "en cours",
            "check_status_url": f"/audio_status/{audio_id}"
        })
        
    except Exception as e:
        print(f"❌ Erreur endpoint TTS: {e}")
        return jsonify({
            "success": False, 
            "error": str(e)
        }), 500

@app.route('/audio_status/<audio_id>', methods=['GET'])
def audio_status(audio_id):
    if audio_id in audio_files:
        status = audio_files[audio_id]
        return jsonify({
            "audio_id": audio_id,
            "ready": status.get("ready", False),
            "error": status.get("error"),
            "timestamp": status.get("timestamp"),
            "avatar": status.get("avatar"),
            "text_length": status.get("text_length", 0)
        })
    return jsonify({"ready": False, "error": "ID audio non trouvé"}), 404

@app.route('/audio/<audio_id>', methods=['GET'])
def get_audio(audio_id):
    max_wait = 20
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        if audio_id in audio_files:
            status = audio_files[audio_id]
            
            if status.get("ready"):
                path = status["path"]
                if os.path.exists(path):
                    return send_file(
                        path, 
                        mimetype='audio/mpeg',
                        as_attachment=False,
                        download_name=f"{audio_id}.mp3"
                    )
            
            elif status.get("error"):
                return jsonify({"error": status["error"]}), 500
        
        time.sleep(0.5)
    
    return jsonify({"error": "Audio non disponible après attente"}), 408

@app.route('/save_scenario', methods=['POST'])
def save_scenario_endpoint():
    """Sauvegarde le scénario d'une session"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Données JSON manquantes"}), 400
            
        session_id = data.get('session_id', 'default')
        
        if session_id not in session_scenarios:
            return jsonify({
                "success": False,
                "error": "Session non trouvée",
                "saved": False
            }), 404
        
        # Sauvegarder le scénario
        scenario = session_scenarios[session_id]
        filename = save_session_scenario(session_id, scenario)
        
        if filename:
            return jsonify({
                "success": True,
                "message": "Scénario sauvegardé",
                "filename": filename,
                "scenario_repliques": len(scenario),
                "session_cleaned": False
            })
        else:
            return jsonify({
                "success": False,
                "error": "Erreur lors de la sauvegarde",
                "saved": False
            }), 500
            
    except Exception as e:
        print(f"❌ Erreur /save_scenario: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/get_scenario/<session_id>', methods=['GET'])
def get_scenario(session_id):
    """Récupère le scénario d'une session"""
    if session_id in session_scenarios:
        return jsonify({
            "session_id": session_id,
            "total_repliques": len(session_scenarios[session_id]),
            "scenario": session_scenarios[session_id]
        })
    else:
        return jsonify({
            "error": "Session non trouvée",
            "session_id": session_id
        }), 404

@app.route('/list_scenarios', methods=['GET'])
def list_scenarios():
    """Liste toutes les sessions actives et fichiers scénarios"""
    sessions = list(session_scenarios.keys())
    scenario_files = []
    
    if os.path.exists(SENARIO_DIR):
        scenario_files = [f for f in os.listdir(SENARIO_DIR) if f.startswith('Sénario_SIFHR') and f.endswith('.json')]
    
    return jsonify({
        "active_sessions": sessions,
        "active_count": len(sessions),
        "scenario_files": scenario_files,
        "scenario_count": len(scenario_files)
    })
@app.route('/get_scenario_file/<filename>', methods=['GET'])
def get_scenario_file(filename):
    """Récupère le contenu d'un fichier scénario"""
    try:
        filepath = os.path.join(SENARIO_DIR, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return jsonify(data)
        else:
            return jsonify({"error": "Fichier non trouvé"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download_scenario/<filename>', methods=['GET'])
def download_scenario(filename):
    """Télécharge un fichier scénario"""
    try:
        filepath = os.path.join(SENARIO_DIR, filename)
        if os.path.exists(filepath):
            return send_file(
                filepath,
                mimetype='application/json',
                as_attachment=True,
                download_name=filename
            )
        else:
            return jsonify({"error": "Fichier non trouvé"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/test_tts', methods=['GET'])
def test_tts():
    """Test simple TTS"""
    try:
        text = "Ceci est un test de synthèse vocale."
        audio_id = str(uuid.uuid4())[:8]
        
        thread = threading.Thread(
            target=generate_long_mp3,
            args=(text, "guardian", audio_id)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            "success": True,
            "message": "Test TTS démarré",
            "audio_id": audio_id,
            "text": text
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("=" * 70)
    print("🚀 API SIFHR - SERVEUR DE TEST")
    print(f"📝 Langchain disponible: {LANGCHAIN_AVAILABLE}")
    print("💾 Sauvegarde: /senario/Sénario_SIFHR_*.json")
    print("🎭 Personnages: EXPLORATEUR / GARDIEN SIFHR")
    print("🔧 Endpoints testés:")
    print("   GET  /health - Vérification")
    print("   GET  /test_tts - Test TTS simple")
    print("   POST /tts - Génération audio")
    print("   POST /save_scenario - Sauvegarde")
    print("=" * 70)
    
    temp_dir = tempfile.gettempdir()
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    
    ensure_senario_dir()
    
    # Démarrer sur tous les ports
    app.run(port=5000, debug=True, host='0.0.0.0', threaded=True)