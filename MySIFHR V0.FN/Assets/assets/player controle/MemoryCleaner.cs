using UnityEngine;
using System.Collections;

public class SafeMemoryOptimizer : MonoBehaviour
{
    [Header("Settings")]
    [SerializeField] private float cleanupInterval = 30f; // Toutes les 30 secondes
    [SerializeField] private bool unloadUnusedAssets = false;
    [SerializeField] private float memoryThresholdMB = 500f;

    private float lastCleanupTime;
    private float initialMemory;

    void Start()
    {
        initialMemory = GetCurrentMemoryMB();
        StartCoroutine(AutoCleanup());
    }

    IEnumerator AutoCleanup()
    {
        while (true)
        {
            yield return new WaitForSeconds(cleanupInterval);
            
            float currentMemory = GetCurrentMemoryMB();
            if (currentMemory > initialMemory * 1.5f || currentMemory > memoryThresholdMB)
            {
                PerformSafeCleanup();
            }
        }
    }

    void PerformSafeCleanup()
    {
        // 1. Nettoyer le cache de ressources si demandé
        if (unloadUnusedAssets)
        {
            Resources.UnloadUnusedAssets();
        }

        // 2. Collecter le garbage manuellement SEULEMENT si nécessaire
        if (System.GC.GetTotalMemory(false) > 300 * 1024 * 1024) // >300MB
        {
            System.GC.Collect();
        }

        Debug.Log($"🧹 Mémoire: {GetCurrentMemoryMB():F1} MB (était: {initialMemory:F1} MB)");
    }

    float GetCurrentMemoryMB()
    {
        return System.GC.GetTotalMemory(false) / 1024f / 1024f;
    }

    void OnDestroy()
    {
        StopAllCoroutines();
    }
}