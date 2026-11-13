using UnityEngine;

public class scr_ThirdPersonCamera_NoHierarchy : MonoBehaviour
{
    public Transform player;   // Only reference needed

    [Header("Camera Settings")]
    public float distance = 4f;
    public float minDistance = 2f;
    public float maxDistance = 8f;
    public float zoomSpeed = 2f;

    [Header("Rotation Settings")]
    public float rotationSpeed = 150f;
    public float minVerticalAngle = -40f;
    public float maxVerticalAngle = 70f;

    [Header("Smoothing")]
    public float rotationSmooth = 0.05f;
    public float positionSmooth = 0.05f;

    [Header("Collision")]
    public float collisionRadius = 0.3f;

    [Header("Camera Offset")]
    public float heightOffset = 1.6f;  // AAA best setting

    private Vector2 targetRotation;
    private Vector2 smoothRotation;
    private Vector2 rotationVelocity;

    float currentDistance;
    float collisionDistance;

    void Start()
    {
        currentDistance = distance;

        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }

    void LateUpdate()
    {
        RotateCamera();
        ZoomCamera();
        HandleCollision();
        ApplyCameraPosition();
    }

    void RotateCamera()
    {
        float mouseX = Input.GetAxis("Mouse X");
        float mouseY = Input.GetAxis("Mouse Y");

        targetRotation.y += mouseX * rotationSpeed * Time.deltaTime;
        targetRotation.x -= mouseY * rotationSpeed * Time.deltaTime;

        targetRotation.x = Mathf.Clamp(targetRotation.x, minVerticalAngle, maxVerticalAngle);

        smoothRotation = Vector2.SmoothDamp(
            smoothRotation,
            targetRotation,
            ref rotationVelocity,
            rotationSmooth
        );
    }

    void ZoomCamera()
    {
        float scroll = Input.GetAxis("Mouse ScrollWheel");
        currentDistance -= scroll * zoomSpeed;
        currentDistance = Mathf.Clamp(currentDistance, minDistance, maxDistance);
    }

    void HandleCollision()
    {
        // Offset target (this fixes camera being too low)
        Vector3 target = player.position + Vector3.up * heightOffset;

        Vector3 desiredPos = target -
            (Quaternion.Euler(smoothRotation.x, smoothRotation.y, 0f) * Vector3.forward * currentDistance);

        if (Physics.SphereCast(target, collisionRadius,
            (desiredPos - target).normalized,
            out RaycastHit hit,
            currentDistance))
        {
            collisionDistance = hit.distance;
        }
        else
        {
            collisionDistance = currentDistance;
        }
    }

    void ApplyCameraPosition()
    {
        Vector3 target = player.position + Vector3.up * heightOffset;

        Vector3 targetPos = target -
            (Quaternion.Euler(smoothRotation.x, smoothRotation.y, 0f) * Vector3.forward * collisionDistance);

        transform.position = Vector3.Lerp(transform.position, targetPos, positionSmooth);
        transform.rotation = Quaternion.Euler(smoothRotation.x, smoothRotation.y, 0f);
    }
}
