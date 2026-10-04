using UnityEngine;

public enum CardState { FaceDown, Flipping, FaceUp, Matched }

[RequireComponent(typeof(MeshRenderer))]
public class Card3D : MonoBehaviour
{
    public int SymbolId { get; private set; }
    public int Index { get; private set; }
    public CardState State { get; private set; } = CardState.FaceDown;

    [Header("Feel")]
    [SerializeField] float flipDuration = 0.42f;
    [SerializeField] float liftHeight = 0.35f;
    [SerializeField] float overshootDeg = 6f;
    [SerializeField] float shakeAmp = 4f, shakeFreq = 28f, shakeDamping = 7f;

    static readonly int GlowId = Shader.PropertyToID("_GlowIntensity");
    static readonly int SymbolIdProp = Shader.PropertyToID("_SymbolIndex");

    MaterialPropertyBlock mpb;
    MeshRenderer rend;
    Vector3 basePos;
    Quaternion downRot, upRot;
    float t, shakeT = -1f, glow, glowTarget;
    bool toUp;
    System.Action<Card3D> onLanded;

    void Awake() { rend = GetComponent<MeshRenderer>(); mpb = new MaterialPropertyBlock(); }

    public void Init(int index, int symbol, Vector3 pos)
    {
        Index = index; SymbolId = symbol; basePos = pos;
        transform.localPosition = pos;
        downRot = Quaternion.identity;
        upRot = Quaternion.Euler(0f, 0f, 180f);
        transform.localRotation = downRot;
        State = CardState.FaceDown;
        rend.GetPropertyBlock(mpb); mpb.SetFloat(SymbolIdProp, symbol); mpb.SetFloat(GlowId, 0f); rend.SetPropertyBlock(mpb);
    }

    public bool Flip(bool faceUp, System.Action<Card3D> landed = null)
    {
        if (State == CardState.Flipping || State == CardState.Matched) return false;
        toUp = faceUp; t = 0f; onLanded = landed; State = CardState.Flipping;
        TactileHapticsManager.Tick();
        return true;
    }

    public void Shudder() { shakeT = 0f; }
    public void SetMatched() { State = CardState.Matched; glowTarget = 1f; TactileHapticsManager.DoublePulse(); }

    void Update()
    {
        float dt = Mathf.Min(Time.deltaTime, 0.05f);
        if (State == CardState.Flipping)
        {
            t += dt / flipDuration;
            float e = EaseOutBack(Mathf.Clamp01(t));
            Quaternion from = toUp ? downRot : upRot, to = toUp ? upRot : downRot;
            Quaternion over = to * Quaternion.Euler(0, 0, (toUp ? 1 : -1) * overshootDeg * (1 - Mathf.Clamp01(t)));
            transform.localRotation = Quaternion.SlerpUnclamped(from, over, e);
            float lift = Mathf.Sin(Mathf.Clamp01(t) * Mathf.PI) * liftHeight;
            transform.localPosition = basePos + Vector3.up * lift;
            if (t >= 1f)
            {
                transform.localRotation = to; transform.localPosition = basePos;
                State = toUp ? CardState.FaceUp : CardState.FaceDown;
                TactileHapticsManager.Click();
                onLanded?.Invoke(this);
            }
        }
        if (shakeT >= 0f)
        {
            shakeT += dt;
            float a = Mathf.Sin(shakeT * shakeFreq) * shakeAmp * Mathf.Exp(-shakeT * shakeDamping);
            transform.localRotation = (State == CardState.FaceUp ? upRot : downRot) * Quaternion.Euler(0, a, 0);
            if (shakeT > 0.6f) shakeT = -1f;
        }
        if (State == CardState.Matched)
        {
            transform.localPosition = Vector3.Lerp(transform.localPosition, basePos + Vector3.up * 0.12f, 1 - Mathf.Exp(-4 * dt));
        }
        if (!Mathf.Approximately(glow, glowTarget))
        {
            glow = Mathf.MoveTowards(glow, glowTarget, dt * 2f);
            rend.GetPropertyBlock(mpb); mpb.SetFloat(GlowId, glow); rend.SetPropertyBlock(mpb);
        }
    }

    static float EaseOutBack(float x) { const float c1 = 1.70158f, c3 = c1 + 1f; return 1 + c3 * Mathf.Pow(x - 1, 3) + c1 * Mathf.Pow(x - 1, 2); }
}
