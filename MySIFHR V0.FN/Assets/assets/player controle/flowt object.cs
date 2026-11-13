using UnityEngine;

public class FloatingObject : MonoBehaviour
{
    public float floatSpeed = 2f;     // Speed of the up/down motion
    public float floatAmount = 0.2f;  // How high it floats

    private Vector3 startPos;

    void Start()
    {
        startPos = transform.position;
    }

    void Update()
    {
        // Sine wave movement
        float newY = Mathf.Sin(Time.time * floatSpeed) * floatAmount;

        transform.position = new Vector3(
            startPos.x,
            startPos.y + newY,
            startPos.z
        );
    }
}
