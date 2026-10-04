// URP mobile PBR: etched brass border, clear-coat lacquer, atlas-sampled face, normal detail.
Shader "Atelier/LuxuryCard"
{
    Properties
    {
        _FaceAtlas ("Face Atlas (6x3)", 2D) = "white" {}
        _BackTex ("Back Guilloche", 2D) = "white" {}
        _NormalMap ("Etch Normal", 2D) = "bump" {}
        _BorderMask ("Border Mask (R)", 2D) = "black" {}
        _SymbolIndex ("Symbol Index", Float) = 0
        _BrassColor ("Brass", Color) = (0.86,0.66,0.32,1)
        _Roughness ("Base Roughness", Range(0,1)) = 0.35
        _MicroRough ("Micro Roughness Var", Range(0,1)) = 0.2
        _ClearCoat ("Clear Coat", Range(0,1)) = 1
        _GlowIntensity ("Glow", Float) = 0
        _GlowColor ("Glow Color", Color) = (1,0.7,0.3,1)
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "RenderPipeline"="UniversalPipeline" }
        Pass
        {
            Tags { "LightMode"="UniversalForward" }
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE
            #pragma multi_compile_instancing
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            TEXTURE2D(_FaceAtlas); SAMPLER(sampler_FaceAtlas);
            TEXTURE2D(_BackTex); TEXTURE2D(_NormalMap); TEXTURE2D(_BorderMask);
            CBUFFER_START(UnityPerMaterial)
                half4 _BrassColor, _GlowColor; half _Roughness, _MicroRough, _ClearCoat;
            CBUFFER_END
            UNITY_INSTANCING_BUFFER_START(Props)
                UNITY_DEFINE_INSTANCED_PROP(float, _SymbolIndex)
                UNITY_DEFINE_INSTANCED_PROP(float, _GlowIntensity)
            UNITY_INSTANCING_BUFFER_END(Props)

            struct A { float4 pos:POSITION; float3 n:NORMAL; float4 t:TANGENT; float2 uv:TEXCOORD0; UNITY_VERTEX_INPUT_INSTANCE_ID };
            struct V { float4 cs:SV_POSITION; float2 uv:TEXCOORD0; float3 ws:TEXCOORD1; half3 n:TEXCOORD2; half4 t:TEXCOORD3; half side:TEXCOORD4; UNITY_VERTEX_INPUT_INSTANCE_ID };

            V vert(A i)
            {
                V o; UNITY_SETUP_INSTANCE_ID(i); UNITY_TRANSFER_INSTANCE_ID(i, o);
                o.ws = TransformObjectToWorld(i.pos.xyz); o.cs = TransformWorldToHClip(o.ws);
                o.n = TransformObjectToWorldNormal(i.n); o.t = half4(TransformObjectToWorldDir(i.t.xyz), i.t.w);
                o.uv = i.uv; o.side = i.n.y < 0 ? 1 : 0; // bottom = face
                return o;
            }

            half4 frag(V i) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(i);
                float idx = UNITY_ACCESS_INSTANCED_PROP(Props, _SymbolIndex);
                half glow = UNITY_ACCESS_INSTANCED_PROP(Props, _GlowIntensity);
                float2 cell = float2(fmod(idx, 6), floor(idx / 6));
                float2 auv = (i.uv + cell) / float2(6, 3);
                half3 face = SAMPLE_TEXTURE2D(_FaceAtlas, sampler_FaceAtlas, auv).rgb;
                half3 back = SAMPLE_TEXTURE2D(_BackTex, sampler_FaceAtlas, i.uv).rgb;
                half border = SAMPLE_TEXTURE2D(_BorderMask, sampler_FaceAtlas, i.uv).r;
                half3 nTS = UnpackNormal(SAMPLE_TEXTURE2D(_NormalMap, sampler_FaceAtlas, i.uv * 4));
                half3 b = cross(i.n, i.t.xyz) * i.t.w;
                half3 N = normalize(nTS.x * i.t.xyz + nTS.y * b + nTS.z * i.n);

                half3 albedo = lerp(lerp(back, face, i.side), _BrassColor.rgb, border);
                half metal = lerp(0.2h, 1h, border);
                half rough = saturate(_Roughness + (nTS.x * nTS.y) * _MicroRough);

                Light L = GetMainLight(TransformWorldToShadowCoord(i.ws));
                half3 Vd = normalize(GetWorldSpaceViewDir(i.ws));
                half3 H = normalize(L.direction + Vd);
                half NdL = saturate(dot(N, L.direction)), NdH = saturate(dot(N, H));
                half3 F0 = lerp(half3(0.04h,0.04h,0.04h), albedo, metal);
                half a2 = max(rough * rough, 0.002h); a2 *= a2;
                half d = NdH * NdH * (a2 - 1) + 1; half D = a2 / (PI * d * d);
                half3 spec = F0 * D * 0.25h;
                half3 diff = albedo * (1 - metal);
                half3 col = (diff + spec) * L.color * NdL * L.shadowAttenuation;
                // clear coat lobe on lacquer only
                half dc = NdH * NdH * (0.0016h - 1) + 1; half cc = 0.0016h / (PI * dc * dc);
                col += cc * 0.04h * _ClearCoat * (1 - border) * NdL * L.color;
                col += SampleSH(N) * albedo * 0.4h;
                col += _GlowColor.rgb * glow * (0.6h + 0.4h * sin(_Time.y * 3));
                return half4(col, 1);
            }
            ENDHLSL
        }
        UsePass "Universal Render Pipeline/Lit/ShadowCaster"
    }
}
