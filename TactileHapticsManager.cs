using UnityEngine;

public static class TactileHapticsManager
{
#if UNITY_ANDROID && !UNITY_EDITOR
    static AndroidJavaObject vibrator, effectClass;
    static int sdk;
    static void Ensure()
    {
        if (vibrator != null) return;
        using var player = new AndroidJavaClass("com.unity3d.player.UnityPlayer");
        var activity = player.GetStatic<AndroidJavaObject>("currentActivity");
        vibrator = activity.Call<AndroidJavaObject>("getSystemService", "vibrator");
        sdk = new AndroidJavaClass("android.os.Build$VERSION").GetStatic<int>("SDK_INT");
        if (sdk >= 26) effectClass = new AndroidJavaClass("android.os.VibrationEffect");
    }
    static void OneShot(long ms, int amp)
    {
        Ensure();
        if (sdk >= 26) vibrator.Call("vibrate", effectClass.CallStatic<AndroidJavaObject>("createOneShot", ms, amp));
        else vibrator.Call("vibrate", ms);
    }
    static void Predefined(int id, long fallbackMs)
    {
        Ensure();
        if (sdk >= 29) vibrator.Call("vibrate", effectClass.CallStatic<AndroidJavaObject>("createPredefined", id));
        else OneShot(fallbackMs, 200);
    }
    public static void Tick() => Predefined(2, 8);   // EFFECT_TICK
    public static void Click() => Predefined(0, 15); // EFFECT_CLICK
    public static void DoublePulse()
    {
        Ensure();
        if (sdk >= 26) vibrator.Call("vibrate", effectClass.CallStatic<AndroidJavaObject>("createWaveform", new long[] { 0, 25, 60, 35 }, new int[] { 0, 180, 0, 255 }, -1));
        else vibrator.Call("vibrate", new long[] { 0, 25, 60, 35 }, -1);
    }
#else
    public static void Tick() { }
    public static void Click() { }
    public static void DoublePulse() { }
#endif
}
