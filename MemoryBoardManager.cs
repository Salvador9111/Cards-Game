using System.Collections.Generic;
using UnityEngine;

public enum GameMode { ZenSolitaire, AIDuel }

public class MemoryBoardManager : MonoBehaviour
{
    [SerializeField] Card3D cardPrefab;
    [SerializeField] Vector2 cardSize = new Vector2(1f, 1.4f);
    [SerializeField] float gap = 0.18f;
    [SerializeField] GameMode mode = GameMode.ZenSolitaire;
    [SerializeField] Vector2Int grid = new Vector2Int(4, 4);
    [SerializeField, Range(0, 1)] float aiRetention = 0.8f, aiDecay = 0.15f;

    readonly List<Card3D> cards = new List<Card3D>(36);
    readonly Card3D[] picks = new Card3D[2];
    readonly Dictionary<int, int> aiMemory = new Dictionary<int, int>(36); // index -> symbol
    readonly List<int> scratch = new List<int>(36);
    int pickCount, moves, streak, matchedPairs;
    readonly int[] score = new int[2];
    int turn; bool locked;
    float aiTimer;

    public int Moves => moves; public int Streak => streak;
    public int Stars => moves <= Pairs * 1.4f ? 3 : moves <= Pairs * 2.1f ? 2 : 1;
    int Pairs => grid.x * grid.y / 2;

    void Start() => Build();

    public void Build()
    {
        bool portrait = Screen.height > Screen.width;
        int cols = portrait ? Mathf.Min(grid.x, grid.y) : Mathf.Max(grid.x, grid.y);
        int rows = grid.x * grid.y / cols;
        int n = cols * rows;
        int[] deck = new int[n];
        for (int i = 0; i < n; i++) deck[i] = i / 2;
        for (int i = n - 1; i > 0; i--) { int j = Random.Range(0, i + 1); (deck[i], deck[j]) = (deck[j], deck[i]); } // Fisher-Yates

        while (cards.Count < n) cards.Add(Instantiate(cardPrefab, transform));
        for (int i = 0; i < cards.Count; i++) cards[i].gameObject.SetActive(i < n);
        for (int i = 0; i < n; i++)
        {
            int c = i % cols, r = i / cols;
            var p = new Vector3((c - (cols - 1) * 0.5f) * (cardSize.x + gap), 0f, (r - (rows - 1) * 0.5f) * (cardSize.y + gap));
            cards[i].Init(i, deck[i], p);
        }
        pickCount = moves = streak = matchedPairs = turn = 0; score[0] = score[1] = 0; locked = false; aiMemory.Clear();
    }

    public void OnCardTapped(Card3D c) { if (turn == 0) TryPick(c); }

    bool TryPick(Card3D c)
    {
        if (locked || c.State != CardState.FaceDown) return false; // multi-touch rejection
        if (!c.Flip(true, Landed)) return false;
        picks[pickCount++] = c;
        if (Random.value < aiRetention) aiMemory[c.Index] = c.SymbolId;
        if (pickCount == 2) locked = true;
        return true;
    }

    void Landed(Card3D c)
    {
        if (pickCount < 2 || c != picks[1]) return;
        moves++;
        if (picks[0].SymbolId == picks[1].SymbolId)
        {
            picks[0].SetMatched(); picks[1].SetMatched();
            aiMemory.Remove(picks[0].Index); aiMemory.Remove(picks[1].Index);
            streak++; score[turn]++; matchedPairs++;
            pickCount = 0; locked = false;
        }
        else
        {
            streak = 0; picks[0].Shudder(); picks[1].Shudder();
            Invoke(nameof(Unflip), 0.65f);
        }
    }

    void Unflip()
    {
        picks[0].Flip(false); picks[1].Flip(false);
        pickCount = 0; locked = false;
        if (mode == GameMode.AIDuel) turn = 1 - turn;
    }

    void Update()
    {
        if (mode != GameMode.AIDuel || turn != 1 || locked || matchedPairs == Pairs) return;
        aiTimer += Time.deltaTime;
        if (aiTimer < 0.9f) return;
        aiTimer = 0f;
        Decay();
        if (pickCount == 0)
        {
            if (FindKnownPair(out int a, out _)) TryPick(cards[a]); else TryPick(cards[RandomUnknown(-1)]);
        }
        else
        {
            int first = picks[0].Index, sym = picks[0].SymbolId, target = -1;
            foreach (var kv in aiMemory) if (kv.Key != first && kv.Value == sym && cards[kv.Key].State == CardState.FaceDown) { target = kv.Key; break; }
            TryPick(cards[target >= 0 ? target : RandomUnknown(first)]);
        }
    }

    void Decay()
    {
        scratch.Clear();
        foreach (var kv in aiMemory) if (Random.value < aiDecay) scratch.Add(kv.Key);
        for (int i = 0; i < scratch.Count; i++) aiMemory.Remove(scratch[i]);
    }

    bool FindKnownPair(out int a, out int b)
    {
        foreach (var x in aiMemory) foreach (var y in aiMemory)
            if (x.Key != y.Key && x.Value == y.Value && cards[x.Key].State == CardState.FaceDown && cards[y.Key].State == CardState.FaceDown) { a = x.Key; b = y.Key; return true; }
        a = b = -1; return false;
    }

    int RandomUnknown(int exclude)
    {
        scratch.Clear();
        int n = grid.x * grid.y;
        for (int i = 0; i < n; i++) if (i != exclude && cards[i].State == CardState.FaceDown && !aiMemory.ContainsKey(i)) scratch.Add(i);
        if (scratch.Count == 0) for (int i = 0; i < n; i++) if (i != exclude && cards[i].State == CardState.FaceDown) scratch.Add(i);
        return scratch[Random.Range(0, scratch.Count)];
    }
}
