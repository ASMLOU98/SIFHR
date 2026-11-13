using UnityEngine;

public class scr_ThirdPersonCamera_FollowBack : MonoBehaviour
{
    public Transform player;

    [Header("Camera Settings")]
    public float distance = 4f;
    public float height = 1.8f;
    public float smoothSpeed = 0.15f;

    private void LateUpdate()
    {
        if (player == null) return;

        // Target position behind the player
        Vector3 targetPos =
            player.position
            - player.forward * distance
            + Vector3.up * height;

        // Smooth follow
        transform.position = Vector3.Lerp(transform.position, targetPos, smoothSpeed);

        // Look at the player
        transform.rotation = Quaternion.Lerp(
            transform.rotation,
            Quaternion.LookRotation(player.position + Vector3.up * 1.5f - transform.position),
            smoothSpeed
        );
    }
}
