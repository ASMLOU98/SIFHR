using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;

public class scr_PlayerController : MonoBehaviour
{
    [SerializeField] float movement_speed = 5f;
    [SerializeField] float rotation_speed = 500f;
    [SerializeField] float gravity_multiplier = 2f;
    [SerializeField] float jump_force = 12f;

    private CharacterController character_controller;
    private Animator anim;
    private float downward_velocity = 0f;

    // --- FOOTSTEPS ---
    [Header("Footstep Settings")]
    public AudioSource footstepAudio;
    
    // --- SPAWN SYSTEM ---
    [Header("Spawn Settings")]
    public GameObject[] objectsToSpawn;
    public float walkDistanceToSpawn = 5f;
    public float forwardOffset = 2f;
    public LayerMask groundMask;

    private Vector3 lastPos;
    private float walkedDistance = 0f;
    
    // --- QUESTION SYSTEM (OPTIONNEL) ---
    [Header("Question System (Optionnel)")]
    public GameObject questionPanel;
    public Button[] questionButtons;
    public TextMeshProUGUI questionTitle;
    public GameObject interactionPrompt;
    public float interactionRange = 4f;
    
    [Header("Audio")]
    public AudioSource questionAudio;
    
    private NPCInteract currentNPC;
    private bool isInDialogue = false;
    private bool questionSystemEnabled = false; // Désactivé par défaut

    void Start()
    {
        character_controller = GetComponent<CharacterController>();
        anim = GetComponent<Animator>();

        Camera.main.GetComponent<scr_ThirdPersonCamera_FollowBack>().player = transform;
        lastPos = transform.position;
        
        // Initialiser le système de questions (si activé)
        InitializeQuestionSystem();
    }

    void InitializeQuestionSystem()
    {
        // Vérifier si le système de questions est configuré
        questionSystemEnabled = (questionPanel != null && questionButtons != null && questionButtons.Length > 0);
        
        if (questionSystemEnabled)
        {
            // Cacher les UI au démarrage
            questionPanel.SetActive(false);
            
            // Configurer les boutons
            for (int i = 0; i < questionButtons.Length; i++)
            {
                int index = i;
                questionButtons[i].onClick.AddListener(() => OnQuestionSelected(index));
            }
        }
        else
        {
            Debug.Log("Système de questions désactivé (références manquantes)");
        }
        
        if (interactionPrompt != null)
            interactionPrompt.SetActive(false);
    }

    void Update()
    {
        HandleMovement();
        HandleNPCInteraction();
        
        // Gérer les inputs de questions seulement si le système est activé
        if (questionSystemEnabled)
        {
            HandleQuestionInput();
        }
    }

    void HandleMovement()
    {
        float horizontal = Input.GetAxis("Horizontal");
        float vertical = Input.GetAxis("Vertical");

        Vector3 input = new Vector3(horizontal, 0f, vertical).normalized;

        // Camera-based movement
        Vector3 camForward = Camera.main.transform.forward;
        camForward.y = 0;
        camForward.Normalize();

        Vector3 camRight = Camera.main.transform.right;
        camRight.y = 0;
        camRight.Normalize();

        Vector3 moveDirection = camForward * input.z + camRight * input.x;
        moveDirection *= movement_speed;

        // Gravity & Jump
        if (character_controller.isGrounded)
        {
            downward_velocity = -2f;
            if (Input.GetButtonDown("Jump"))
                downward_velocity = jump_force;
        }
        else
        {
            downward_velocity += Physics.gravity.y * gravity_multiplier * Time.deltaTime;

            if (Input.GetButtonUp("Jump") && downward_velocity > 0)
                downward_velocity *= 0.5f;
        }

        moveDirection.y = downward_velocity;
        character_controller.Move(moveDirection * Time.deltaTime);

        // Rotation
        Vector3 lookDir = new Vector3(moveDirection.x, 0, moveDirection.z);
        if (lookDir.magnitude > 0.1f)
        {
            Quaternion targetRot = Quaternion.LookRotation(lookDir);
            transform.rotation = Quaternion.RotateTowards(
                transform.rotation, targetRot,
                rotation_speed * Time.deltaTime
            );
        }

        // Animation
        float speedPercent = new Vector3(moveDirection.x, 0, moveDirection.z).magnitude;
        anim.SetFloat("Speed", speedPercent);

        // Footsteps
        bool isMoving = speedPercent > 0.1f;
        bool grounded = character_controller.isGrounded;

        if (isMoving && grounded)
        {
            if (!footstepAudio.isPlaying)
                footstepAudio.Play();
        }
        else
        {
            if (footstepAudio.isPlaying)
                footstepAudio.Stop();
        }

        // Spawn System
        float dist = Vector3.Distance(transform.position, lastPos);
        walkedDistance += dist;
        lastPos = transform.position;

        if (walkedDistance >= walkDistanceToSpawn)
        {
            SpawnObject();
            walkedDistance = 0f;
        }
    }

    void HandleNPCInteraction()
    {
        // Détecter les NPCs proches
        NPCInteract[] npcs = FindObjectsOfType<NPCInteract>();
        NPCInteract closestNPC = null;
        float closestDistance = float.MaxValue;

        foreach (NPCInteract npc in npcs)
        {
            float distance = Vector3.Distance(transform.position, npc.transform.position);
            if (distance <= interactionRange && distance < closestDistance)
            {
                closestNPC = npc;
                closestDistance = distance;
            }
        }

        // Mettre à jour l'UI d'interaction
        if (interactionPrompt != null)
        {
            bool showPrompt = closestNPC != null && !isInDialogue;
            interactionPrompt.SetActive(showPrompt);
        }

        // Interaction avec E
        if (closestNPC != null && Input.GetKeyDown(KeyCode.E) && !isInDialogue)
        {
            currentNPC = closestNPC;
            
            // Si le système de questions est activé, l'utiliser
            if (questionSystemEnabled)
            {
                StartDialogue();
            }
            else
            {
                // Sinon, démarrer le dialogue normal du NPC
                // Note: Tu dois ajouter une méthode publique dans NPCInteract
                // pour démarrer le dialogue depuis l'extérieur
            }
        }
    }

    void HandleQuestionInput()
    {
        if (!questionSystemEnabled) return;
        
        // Échapper pour quitter le dialogue
        if (isInDialogue && Input.GetKeyDown(KeyCode.Escape))
        {
            EndDialogue();
        }
        
        // Chiffres 1-4 pour sélectionner des questions rapides
        if (isInDialogue && questionPanel != null && questionPanel.activeSelf)
        {
            if (Input.GetKeyDown(KeyCode.Alpha1)) OnQuestionSelected(0);
            else if (Input.GetKeyDown(KeyCode.Alpha2)) OnQuestionSelected(1);
            else if (Input.GetKeyDown(KeyCode.Alpha3)) OnQuestionSelected(2);
            else if (Input.GetKeyDown(KeyCode.Alpha4)) OnQuestionSelected(3);
        }
    }

    void StartDialogue()
    {
        if (!questionSystemEnabled || questionPanel == null) return;
        
        isInDialogue = true;
        
        // Désactiver le mouvement temporairement
        movement_speed *= 0.5f;
        
        // Afficher le panel de questions
        questionPanel.SetActive(true);
        LoadRandomQuestions();
        
        // Cacher le prompt d'interaction
        if (interactionPrompt != null)
            interactionPrompt.SetActive(false);
    }

    void LoadRandomQuestions()
    {
        if (questionTitle != null)
            questionTitle.text = "Choisis une question :";
        
        // Charger 4 questions aléatoires
        List<string> selectedQuestions = new List<string>();
        
        for (int i = 0; i < Mathf.Min(4, questionButtons.Length); i++)
        {
            string question = GetUniqueHistoricalQuestion(selectedQuestions);
            selectedQuestions.Add(question);
            
            if (questionButtons[i] != null)
            {
                TextMeshProUGUI buttonText = questionButtons[i].GetComponentInChildren<TextMeshProUGUI>();
                if (buttonText != null)
                {
                    buttonText.text = $"{i + 1}. {question}";
                }
                questionButtons[i].gameObject.SetActive(true);
            }
        }
        
        // Désactiver les boutons non utilisés
        for (int i = selectedQuestions.Count; i < questionButtons.Length; i++)
        {
            if (questionButtons[i] != null)
                questionButtons[i].gameObject.SetActive(false);
        }
    }

    string GetUniqueHistoricalQuestion(List<string> usedQuestions)
    {
        string question;
        int attempts = 0;
        
        do
        {
            int categoryCount = HistoricalDictionary.GetCategoryCount();
            if (categoryCount == 0) return "Parle-moi du savoir ancien";
            
            int randomCat = Random.Range(0, categoryCount);
            question = HistoricalDictionary.GetQuestionByCategory(randomCat);
            attempts++;
            
            if (attempts > 10)
                return "Parle-moi de la civilisation arabo-musulmane";
                
        } while (usedQuestions.Contains(question) || string.IsNullOrEmpty(question));
        
        return question;
    }

    void OnQuestionSelected(int index)
    {
        if (!questionSystemEnabled || index < 0 || index >= questionButtons.Length || 
            !questionButtons[index].gameObject.activeSelf)
            return;
        
        // Récupérer la question
        TextMeshProUGUI buttonText = questionButtons[index].GetComponentInChildren<TextMeshProUGUI>();
        if (buttonText == null) return;
        
        string questionText = buttonText.text;
        // Enlever le numéro "1. " du début
        if (questionText.Length > 3 && questionText[1] == '.')
            questionText = questionText.Substring(3).Trim();
        
        // Jouer un son de sélection
        if (questionAudio != null)
        {
            questionAudio.Play();
        }
        
        // Envoyer la question au NPC
        if (currentNPC != null)
        {
            // Utiliser la réflexion pour appeler la méthode
            var method = currentNPC.GetType().GetMethod("ReceivePlayerQuestion");
            if (method != null)
            {
                method.Invoke(currentNPC, new object[] { questionText });
            }
            else
            {
                Debug.Log($"Question envoyée à {currentNPC.name}: {questionText}");
            }
        }
        
        // Cacher le panel
        if (questionPanel != null)
            questionPanel.SetActive(false);
        
        // Réactiver le mouvement
        movement_speed = 5f; // Valeur par défaut
        isInDialogue = false;
    }

    void EndDialogue()
    {
        isInDialogue = false;
        
        // Cacher les UI
        if (questionPanel != null)
            questionPanel.SetActive(false);
            
        if (interactionPrompt != null)
            interactionPrompt.SetActive(false);
        
        // Réactiver le mouvement
        movement_speed = 5f;
        
        currentNPC = null;
    }

    private void SpawnObject()
    {
        Vector3 forwardPoint = transform.position + transform.forward * forwardOffset;

        if (Physics.Raycast(forwardPoint + Vector3.up * 3f, Vector3.down, out RaycastHit hit, 10f, groundMask))
        {
            Vector3 spawnPos = hit.point + Vector3.up * 0.5f;
            Quaternion spawnRot = Quaternion.Euler(-90, 0, 0);

            if (objectsToSpawn.Length == 0)
            {
                Debug.LogError("No objects assigned to objectsToSpawn!");
                return;
            }

            GameObject chosenObj = objectsToSpawn[Random.Range(0, objectsToSpawn.Length)];
            Instantiate(chosenObj, spawnPos, spawnRot);
        }
        else
        {
            Debug.Log("Spawn failed (no ground detected).");
        }
    }

    void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.blue;
        Gizmos.DrawWireSphere(transform.position, interactionRange);
    }
}