using UnityEngine;

[CreateAssetMenu(fileName = "NewDialogue", menuName = "Dialogue/New Dialogue")]
public class DialogueData : ScriptableObject
{
    [TextArea(3, 10)]
    public string[] lines;
}
