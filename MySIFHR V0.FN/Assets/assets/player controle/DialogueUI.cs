using UnityEngine;
using TMPro;

public class DialogueUI : MonoBehaviour
{
    public GameObject dialoguePanel;
    public TextMeshProUGUI dialogueText;
    
    private DialogueData dialogueData;
    private int index = 0;
    private System.Action onFinish;
    private float displayTimer = 0f;
    private bool isDisplaying = false;

    void Update()
    {
        if (!dialoguePanel.activeSelf) return;

        // Petite animation pour le texte (optionnel)
        if (isDisplaying && displayTimer > 0f)
        {
            displayTimer -= Time.deltaTime;
            if (displayTimer <= 0f)
            {
                isDisplaying = false;
            }
        }
    }

    public void StartDialogue(DialogueData data, System.Action finishCallback = null)
    {
        dialogueData = data;
        index = 0;
        onFinish = finishCallback;

        dialoguePanel.SetActive(true);
        
        if (dialogueData.lines != null && dialogueData.lines.Length > 0)
        {
            // Affiche immédiatement le texte complet
            dialogueText.text = dialogueData.lines[0];
            isDisplaying = true;
            displayTimer = 0.1f; // Petit délai pour l'animation
        }
    }

    public void CloseDialogue()
    {
        dialoguePanel.SetActive(false);
        isDisplaying = false;
        onFinish?.Invoke();
    }
}