using UnityEngine;

public class Money : MonoBehaviour
{
    private void OnTriggerEnter(Collider other)
    {
        // Check if the player hit the money
        if (other.CompareTag("Player"))
        {
            Destroy(gameObject); // destroy the money
        }
    }
}
