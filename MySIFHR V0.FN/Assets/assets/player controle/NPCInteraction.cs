using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Text;
using System.Collections.Generic;
using TMPro;

public class NPCInteract : MonoBehaviour
{
    [Header("=== CONFIGURATION ===")]
    public float interactionDistance = 3f;
    public Transform player;
    public string apiBaseUrl = "http://localhost:5000";

    [Header("=== UI REFERENCES ===")]
    public GameObject interactCanvas;
    public DialogueUI dialogueUI;
    public DialogueData dialogueData;

    [Header("=== AVATAR CONFIGURATION ===")]
    public string explorerName = "EXPLORATEUR";
    public Color explorerColor = Color.cyan;
    public string guardianName = "GARDIEN SIFHR";
    public Color guardianColor = new Color(1f, 0.2f, 0.2f);

    [Header("=== VOICE TIMING SETTINGS ===")]
    public AudioSource audioSource;
    public float audioVolume = 1f;
    
    [Header("Délais entre dialogues")]
    [Tooltip("Temps d'attente entre les personnages")]
    public float delayBetweenSpeakers = 0.8f;
    
    [Header("Vitesse de Parole (Pitch)")]
    [Tooltip("1.0 = vitesse normale, 1.5 = 50% plus rapide")]
    [Range(0.5f, 2.0f)]
    public float explorerSpeed = 0.9f;
    
    [Range(0.5f, 2.0f)]
    public float guardianSpeed = 0.95f;
    
    [Header("Timing du Dialogue")]
    [Tooltip("Délais pour dialogue naturel")]
    public float delayBeforeQuestion = 0.8f;
    public float delayBeforeAnswer = 0.6f;
    public float autoContinueDelay = 2.0f;
    
    [Header("Options Audio")]
    public bool playAudio = true;
    public bool skipAudioWait = false;
    public float minAudioTime = 1.5f;

    [Header("=== CONTROLS ===")]
    public KeyCode closeKey = KeyCode.X;
    public KeyCode skipAudioKey = KeyCode.Space;

    // Variables privées
    private bool isPlayerClose = false;
    private bool isTalking = false;
    private bool isProcessing = false;
    private string currentSessionId;
    private List<string> availableQuestions = new List<string>();
    private Coroutine currentDialogueRoutine;
    private Queue<string> dialogueQueue = new Queue<string>();
    private bool skipCurrentAudio = false;
    private bool isAudioPlaying = false;

    [System.Serializable]
    private class ChatRequest
    {
        public string message;
        public string session_id;
    }

    [System.Serializable]
    private class ChatResponse
    {
        public string reply;
        public string session_id;
        public string audio_id;
        public string audio_url;
    }

    [System.Serializable]
    private class TTSRequest
    {
        public string text;
        public string avatar;
    }

    [System.Serializable]
    private class TTSResponseWrapper
    {
        public bool success;
        public string audio_id;
        public string audio_url;
        public string avatar;
    }

    [System.Serializable]
    private class SaveScenarioRequest
    {
        public string session_id;
    }

    [System.Serializable]
    private class SaveScenarioResponse
    {
        public bool success;
        public string message;
        public string filename;
        public int scenario_repliques;
        public bool session_cleaned;
    }

    void Start()
    {
        InitializeNPC();
    }

    void InitializeNPC()
    {
        currentSessionId = System.Guid.NewGuid().ToString().Substring(0, 8);
        
        if (player == null)
        {
            GameObject playerObj = GameObject.FindGameObjectWithTag("Player");
            if (playerObj != null) player = playerObj.transform;
        }
        
        if (audioSource == null)
        {
            audioSource = GetComponent<AudioSource>();
            if (audioSource == null)
                audioSource = gameObject.AddComponent<AudioSource>();
        }
        audioSource.volume = audioVolume;
        
        if (dialogueUI == null)
            dialogueUI = FindObjectOfType<DialogueUI>();
        
        if (dialogueData == null)
        {
            dialogueData = ScriptableObject.CreateInstance<DialogueData>();
            dialogueData.lines = new string[0];
        }
        
        if (interactCanvas != null)
            interactCanvas.SetActive(false);
        
        LoadQuestions();
        
        Debug.Log($"🗣️ Session ID: {currentSessionId}");
        Debug.Log($"💾 Appuyez sur {closeKey} pour sauvegarder et quitter");
    }

    void LoadQuestions()
    {
        availableQuestions.Clear();
        
        for (int i = 0; i < 3; i++)
        {
            string question = GetRandomHistoricalQuestion();
            if (!string.IsNullOrEmpty(question) && !availableQuestions.Contains(question))
            {
                availableQuestions.Add(question);
            }
        }
        
        if (availableQuestions.Count == 0)
        {
            availableQuestions.Add("Qui es-tu ?");
            availableQuestions.Add("Parle-moi de la civilisation arabo-musulmane");
        }
    }

    string GetRandomHistoricalQuestion()
    {
        int totalCategories = HistoricalDictionary.GetCategoryCount();
        if (totalCategories == 0) return "Parle-moi du savoir ancien";
        
        int randomCategory = Random.Range(0, totalCategories);
        return HistoricalDictionary.GetQuestionByCategory(randomCategory);
    }

    void Update()
    {
        HandlePlayerDetection();
        HandleInput();
        
        isAudioPlaying = audioSource.isPlaying;
    }

    void HandlePlayerDetection()
    {
        if (player == null) return;
        
        float dist = Vector3.Distance(transform.position, player.position);
        isPlayerClose = dist <= interactionDistance;

        if (interactCanvas != null)
        {
            interactCanvas.SetActive(isPlayerClose && !isTalking && !isProcessing);
        }
    }

    void HandleInput()
    {
        if (!isPlayerClose) return;
        
        if (Input.GetKeyDown(KeyCode.E) && !isTalking && !isProcessing)
        {
            StartDialogue();
        }
        
        if (isTalking && Input.GetKeyDown(closeKey))
        {
            ForceCloseDialogue();
        }
        
        if (isTalking && audioSource.isPlaying && Input.GetKeyDown(skipAudioKey))
        {
            SkipCurrentAudio();
        }
    }

    void SkipCurrentAudio()
    {
        if (audioSource.isPlaying)
        {
            audioSource.Stop();
            skipCurrentAudio = true;
            isAudioPlaying = false;
            Debug.Log("⏭️ Audio sauté");
        }
    }

    public void StartDialogue()
    {
        if (dialogueUI == null) return;
        
        isTalking = true;
        isProcessing = true;
        skipCurrentAudio = false;
        isAudioPlaying = false;
        dialogueQueue.Clear();
        
        foreach (string question in availableQuestions)
        {
            dialogueQueue.Enqueue(question);
        }
        
        if (interactCanvas != null)
            interactCanvas.SetActive(false);
        
        currentDialogueRoutine = StartCoroutine(DialogueSequence());
    }

    IEnumerator DialogueSequence()
    {
        string introText = $"{guardianName}: Salamou Alikom,Mousafir";
        UpdateDialogue(introText);
        
        if (playAudio)
        {
            yield return StartCoroutine(PlayTTS("Salamou Alikom,Mousafir", "guardian"));
            yield return WaitForAudioToFinish();
        }
        else
        {
            yield return new WaitForSeconds(1.0f);
        }
        
        yield return new WaitForSeconds(delayBeforeQuestion);
        
        if (dialogueQueue.Count > 0 && isTalking)
        {
            string question = dialogueQueue.Dequeue();
            yield return StartCoroutine(AskQuestion(question));
        }
    }

    IEnumerator WaitForAudioToFinish()
    {
        if (!playAudio || skipCurrentAudio) yield break;
        
        float timeout = 30f;
        float timePassed = 0f;
        
        while (audioSource.isPlaying && timePassed < timeout && isTalking && !skipCurrentAudio)
        {
            yield return new WaitForSeconds(0.1f);
            timePassed += 0.1f;
        }
        
        if (timePassed >= timeout)
        {
            Debug.LogWarning("⏰ Timeout audio - continuation du dialogue");
        }
    }

IEnumerator AskQuestion(string question)
{
    if (!isTalking) yield break;
    
    // AJOUTER UN DÉLAI avant la question
    yield return new WaitForSeconds(1.0f); // ← Ajoutez cette ligne
    
    yield return WaitForAudioToFinish();
    
    yield return new WaitForSeconds(delayBetweenSpeakers);
    
    string questionText = $"{explorerName}: {question}";
    UpdateDialogue(questionText);
    
    if (playAudio)
    {
        yield return StartCoroutine(PlayTTS(question, "explorer"));
        yield return WaitForAudioToFinish();
    }
    
    if (!isTalking) yield break;
    
    // AJOUTER UN DÉLAI avant la réponse
    yield return new WaitForSeconds(1.0f); // ← Ajoutez cette ligne
    
    yield return new WaitForSeconds(delayBeforeAnswer);
    
    if (isTalking)
    {
        yield return StartCoroutine(GetAIResponse(question));
    }
        
        if (!isTalking) yield break;
        
        if (dialogueQueue.Count > 0)
        {
            yield return new WaitForSeconds(autoContinueDelay);
            
            if (!isTalking) yield break;
            
            string nextQuestion = dialogueQueue.Dequeue();
            yield return StartCoroutine(AskQuestion(nextQuestion));
        }
        else
        {
            yield return new WaitForSeconds(autoContinueDelay);
            
            if (isTalking)
            {
                yield return StartCoroutine(EndDialogueSequence());
            }
        }
    }

    IEnumerator GetAIResponse(string question)
    {
        ChatRequest requestData = new ChatRequest
        {
            message = question,
            session_id = currentSessionId
        };
        
        string jsonData = JsonUtility.ToJson(requestData);
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        
        UnityWebRequest request = new UnityWebRequest($"{apiBaseUrl}/chat", "POST");
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        
        yield return request.SendWebRequest();
        
        if (!isTalking)
        {
            request.Abort();
            yield break;
        }
        
        if (request.result != UnityWebRequest.Result.Success)
        {
            string errorText = $"{guardianName}: ...";
            UpdateDialogue(errorText);
            yield break;
        }
        
        ChatResponse response = JsonUtility.FromJson<ChatResponse>(request.downloadHandler.text);
        
        string responseText = $"{guardianName}: {CleanText(response.reply)}";
        UpdateDialogue(responseText);
        
        if (playAudio)
        {
            yield return StartCoroutine(PlayTTS(CleanText(response.reply), "guardian"));
            yield return WaitForAudioToFinish();
        }
    }

    IEnumerator PlayTTS(string text, string avatar)
    {
        if (!isTalking || string.IsNullOrEmpty(text) || !playAudio) yield break;
        
        float speed = avatar == "explorer" ? explorerSpeed : guardianSpeed;
        speed = Mathf.Clamp(speed, 0.7f, 1.3f);
        
        Debug.Log($"🗣️ {avatar} parle à {speed}x vitesse");
        
        if (text.Length > 150)
            text = text.Substring(0, 150) + "...";
        
        TTSRequest ttsRequest = new TTSRequest
        {
            text = text,
            avatar = avatar
        };
        
        string jsonData = JsonUtility.ToJson(ttsRequest);
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        
        UnityWebRequest request = new UnityWebRequest($"{apiBaseUrl}/tts", "POST");
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        
        yield return request.SendWebRequest();
        
        if (!isTalking)
        {
            request.Abort();
            yield break;
        }
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            yield return DownloadAndPlayTTSAudio(request.downloadHandler.text, speed);
        }
    }

    IEnumerator DownloadAndPlayTTSAudio(string responseJson, float speed)
    {
        if (!isTalking || !playAudio) yield break;
        
        TTSResponseWrapper response = null;
        
        try
        {
            response = JsonUtility.FromJson<TTSResponseWrapper>(responseJson);
        }
        catch (System.Exception e)
        {
            Debug.LogWarning($"Erreur parsing TTS: {e.Message}");
            yield break;
        }
        
        if (response == null || !response.success || string.IsNullOrEmpty(response.audio_url))
        {
            Debug.LogWarning("Réponse TTS invalide");
            yield break;
        }
        
        string audioUrl = response.audio_url;
        if (!audioUrl.StartsWith("http"))
            audioUrl = apiBaseUrl + audioUrl;
        
        using (UnityWebRequest audioRequest = UnityWebRequestMultimedia.GetAudioClip(audioUrl, AudioType.MPEG))
        {
            yield return audioRequest.SendWebRequest();
            
            if (!isTalking)
            {
                audioRequest.Abort();
                yield break;
            }
            
            if (audioRequest.result != UnityWebRequest.Result.Success)
            {
                Debug.LogWarning($"Erreur audio: {audioRequest.error}");
                yield break;
            }
            
            AudioClip clip = DownloadHandlerAudioClip.GetContent(audioRequest);
            if (clip == null)
            {
                Debug.LogWarning("Clip audio null");
                yield break;
            }
            
            audioSource.pitch = Mathf.Clamp(speed, 0.8f, 1.2f);
            audioSource.clip = clip;
            audioSource.Play();
            isAudioPlaying = true;
            
            float originalDuration = clip.length;
            float acceleratedDuration = originalDuration / speed;
            
            Debug.Log($"▶️ Audio: {originalDuration:F1}s → {acceleratedDuration:F1}s ({speed}x)");
            
            if (skipAudioWait)
            {
                yield return new WaitForSeconds(Mathf.Min(minAudioTime, acceleratedDuration));
            }
            else
            {
                float timePassed = 0f;
                skipCurrentAudio = false;
                
                while (audioSource.isPlaying && timePassed < acceleratedDuration + 2f && isTalking && !skipCurrentAudio)
                {
                    yield return new WaitForSeconds(0.1f);
                    timePassed += 0.1f;
                }
            }
            
            if (audioSource.isPlaying)
            {
                audioSource.Stop();
            }
            isAudioPlaying = false;
        }
    }

    void ForceCloseDialogue()
    {
        if (!isTalking) return;
        
        Debug.Log("💾 Appui sur X - Sauvegarde du scénario...");
        
        StartCoroutine(SaveBeforeClosing());
    }

    IEnumerator SaveBeforeClosing()
    {
        string savingMessage = $"{guardianName}: Conservation de notre échange...";
        UpdateDialogue(savingMessage);
        
        yield return new WaitForSeconds(0.3f);
        
        SaveScenarioRequest requestData = new SaveScenarioRequest
        {
            session_id = currentSessionId
        };
        
        string jsonData = JsonUtility.ToJson(requestData);
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        
        UnityWebRequest request = new UnityWebRequest($"{apiBaseUrl}/save_scenario", "POST");
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            SaveScenarioResponse response = JsonUtility.FromJson<SaveScenarioResponse>(request.downloadHandler.text);
            
            if (response.success)
            {
                Debug.Log($"✅ Scénario sauvegardé: {response.filename}");
                Debug.Log($"📝 {response.scenario_repliques} répliques enregistrées");
            }
            else
            {
                Debug.LogWarning($"⚠️ Sauvegarde échouée: {response.message}");
            }
        }
        else
        {
            Debug.LogError($"❌ Erreur sauvegarde: {request.error}");
        }
        
        CloseDialogue();
    }

    void CloseDialogue()
    {
        if (currentDialogueRoutine != null)
        {
            StopCoroutine(currentDialogueRoutine);
            currentDialogueRoutine = null;
        }
        
        if (audioSource.isPlaying)
        {
            audioSource.Stop();
            isAudioPlaying = false;
        }
        
        audioSource.pitch = 1.0f;
        
        isTalking = false;
        isProcessing = false;
        skipCurrentAudio = false;
        isAudioPlaying = false;
        
        if (dialogueUI != null)
        {
            dialogueUI.CloseDialogue();
        }
        
        if (isPlayerClose && interactCanvas != null)
        {
            interactCanvas.SetActive(true);
        }
        
        dialogueQueue.Clear();
        
        Debug.Log("✅ Dialogue fermé avec sauvegarde");
    }

    void UpdateDialogue(string message)
    {
        if (!isTalking) return;
        
        if (dialogueData != null)
        {
            dialogueData.lines = new string[] { message };
        }
        
        if (dialogueUI != null)
        {
            dialogueUI.StartDialogue(dialogueData, null);
        }
    }

    string CleanText(string text)
    {
        if (string.IsNullOrEmpty(text))
            return "...";
        
        text = text.Replace("\n", " ").Replace("\r", " ");
        
        while (text.Contains("  "))
            text = text.Replace("  ", " ");
        
        text = text.Trim();
        if (!text.EndsWith(".") && !text.EndsWith("!") && !text.EndsWith("?"))
            text += ".";
        
        return text;
    }

    IEnumerator EndDialogueSequence()
    {
        if (!isTalking) yield break;
        
        yield return WaitForAudioToFinish();
        
        yield return new WaitForSeconds(delayBetweenSpeakers);
        
        string farewell = $"{guardianName}: Adieu.";
        UpdateDialogue(farewell);
        
        if (playAudio)
        {
            yield return StartCoroutine(PlayTTS("Adieu.", "guardian"));
            yield return WaitForAudioToFinish();
        }
        
        yield return new WaitForSeconds(1f);
        
        CloseDialogue();
        LoadQuestions();
    }

    void ResetDialogue()
    {
        if (isTalking)
        {
            ForceCloseDialogue();
            return;
        }
        
        if (currentDialogueRoutine != null)
        {
            StopCoroutine(currentDialogueRoutine);
            currentDialogueRoutine = null;
        }
        
        audioSource.Stop();
        audioSource.pitch = 1.0f;
        
        isTalking = false;
        isProcessing = false;
        skipCurrentAudio = false;
        isAudioPlaying = false;
        
        if (dialogueData != null)
        {
            dialogueData.lines = new string[0];
        }
        
        if (dialogueUI != null)
        {
            dialogueUI.CloseDialogue();
        }
    }

    void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.yellow;
        Gizmos.DrawWireSphere(transform.position, interactionDistance);
    }
    
    [ContextMenu("⚙️ Configurer Dialogue Naturel")]
    void ConfigureNaturalDialogue()
    {
        explorerSpeed = 0.9f;
        guardianSpeed = 0.95f;
        delayBetweenSpeakers = 0.8f;
        delayBeforeQuestion = 0.8f;
        delayBeforeAnswer = 0.6f;
        autoContinueDelay = 2.0f;
        skipAudioWait = false;
        minAudioTime = 1.5f;
        
        Debug.Log("⚙️ Dialogue configuré en mode NATUREL");
    }
    
    [ContextMenu("⚙️ Configurer Dialogue Lent")]
    void ConfigureSlowDialogue()
    {
        explorerSpeed = 0.8f;
        guardianSpeed = 0.85f;
        delayBetweenSpeakers = 1.2f;
        delayBeforeQuestion = 1.0f;
        delayBeforeAnswer = 1.0f;
        autoContinueDelay = 2.5f;
        skipAudioWait = false;
        minAudioTime = 2.0f;
        
        Debug.Log("🐢 Dialogue configuré en mode LENT");
    }
    
    [ContextMenu("💾 Tester Sauvegarde")]
    void TestSaveScenario()
    {
        if (!isTalking)
        {
            StartCoroutine(SaveBeforeClosing());
        }
        else
        {
            Debug.Log("Impossible de tester pendant un dialogue");
        }
    }
}