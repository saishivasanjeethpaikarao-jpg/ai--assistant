import { useState, useEffect, useRef } from 'react';
import {
  FiCpu, FiMic, FiGlobe, FiRadio, FiUsers, FiFileText,
  FiBell, FiMonitor, FiKey, FiSave, FiRefreshCw,
  FiCheckCircle, FiXCircle, FiEye, FiEyeOff,
  FiAlertTriangle, FiExternalLink, FiSliders,
} from 'react-icons/fi';
import { api } from '../services/api';

// ── Shared helpers ────────────────────────────────────────────────────────

const T = ({ ok }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    padding: '1px 7px', borderRadius: '10px', fontSize: '10px', fontWeight: '600',
    backgroundColor: ok ? '#0a2a1a' : '#1a0a0a',
    color: ok ? '#10b981' : '#ef4444',
    border: `1px solid ${ok ? '#10b98133' : '#ef444433'}`,
  }}>
    {ok ? <FiCheckCircle size={9} /> : <FiXCircle size={9} />}
    {ok ? 'Set' : 'Missing'}
  </span>
);

const SecHdr = ({ label, desc }) => (
  <div style={{ marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid #1a1a1a' }}>
    <div style={{ fontSize: '13px', fontWeight: '600', color: '#e8e8e8', marginBottom: '3px' }}>{label}</div>
    {desc && <div style={{ fontSize: '11px', color: '#4a4a4a' }}>{desc}</div>}
  </div>
);

const Field = ({ label, badge, hint, children }) => (
  <div style={{ marginBottom: '14px' }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8b8b8b', marginBottom: '6px', fontWeight: '500' }}>
      {label} {badge}
    </label>
    {children}
    {hint && <div style={{ fontSize: '11px', color: '#3a3a3a', marginTop: '4px', lineHeight: '1.5' }}>{hint}</div>}
  </div>
);

const TextInput = ({ value, onChange, placeholder, type = 'text', mono }) => {
  const [show, setShow] = useState(false);
  const isPwd = type === 'password';
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={isPwd && !show ? 'password' : 'text'}
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: isPwd ? '7px 32px 7px 10px' : '7px 10px',
          backgroundColor: '#080808', border: '1px solid #222', borderRadius: '4px',
          color: '#e8e8e8', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
          fontFamily: mono ? 'Geist Mono, monospace' : 'inherit',
        }}
        onFocus={e => e.target.style.borderColor = '#3b82f6'}
        onBlur={e => e.target.style.borderColor = '#222'}
      />
      {isPwd && (
        <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#5a5a5a', cursor: 'pointer' }}>
          {show ? <FiEyeOff size={13} /> : <FiEye size={13} />}
        </button>
      )}
    </div>
  );
};

const Select = ({ value, onChange, options }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '7px 10px', backgroundColor: '#080808', border: '1px solid #222', borderRadius: '4px', color: '#e8e8e8', fontSize: '13px', outline: 'none', cursor: 'pointer', fontFamily: 'Geist Mono, monospace' }}>
    {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
  </select>
);

const Toggle = ({ value, onChange, label, sublabel }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
    <div>
      <div style={{ fontSize: '13px', color: '#c8c8c8' }}>{label}</div>
      {sublabel && <div style={{ fontSize: '11px', color: '#4a4a4a', marginTop: '2px' }}>{sublabel}</div>}
    </div>
    <div onClick={() => onChange(!value)} style={{
      width: '38px', height: '22px', borderRadius: '11px', cursor: 'pointer',
      backgroundColor: value ? '#3b82f6' : '#222', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: '3px', left: value ? '19px' : '3px',
        width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s',
      }} />
    </div>
  </div>
);

const Slider = ({ label, value, onChange, min, max, step = 0.1, format }) => (
  <Field label={label}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: '#3b82f6' }} />
      <span style={{ fontSize: '12px', color: '#3b82f6', fontFamily: 'Geist Mono, monospace', minWidth: '36px', textAlign: 'right' }}>
        {format ? format(value) : value}
      </span>
    </div>
  </Field>
);

const Divider = () => <div style={{ height: '1px', backgroundColor: '#111', margin: '20px 0' }} />;

const Link = ({ href, children }) => (
  <a href={href} target="_blank" rel="noreferrer"
    style={{ color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
    {children} <FiExternalLink size={10} />
  </a>
);

// ── Tabs ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'ai',       icon: FiCpu,      label: 'AI Engine' },
  { id: 'voice',    icon: FiMic,      label: 'Voice & Speech' },
  { id: 'language', icon: FiGlobe,    label: 'Language' },
  { id: 'wakeword', icon: FiRadio,    label: 'Wake Word' },
  { id: 'clone',    icon: FiUsers,    label: 'Voice Clone' },
  { id: 'prompt',   icon: FiFileText, label: 'System Prompt' },
  { id: 'notifs',   icon: FiBell,     label: 'Notifications' },
  { id: 'appearance',icon: FiMonitor, label: 'Appearance' },
  { id: 'keys',     icon: FiKey,      label: 'All API Keys' },
];

// ── Section renderers ────────────────────────────────────────────────────

const AiTab = ({ s, set, status, providers }) => {
  const hasProvider = providers.some(p => p.enabled);
  return (
    <div>
      <div style={{
        padding: '10px 14px', borderRadius: '5px', marginBottom: '20px',
        backgroundColor: hasProvider ? '#0a1a0a' : '#1a0a0a',
        border: `1px solid ${hasProvider ? '#10b98122' : '#ef444422'}`,
        display: 'flex', alignItems: 'flex-start', gap: '10px',
      }}>
        {hasProvider ? <FiCheckCircle size={14} style={{ color: '#10b981', marginTop: '1px', flexShrink: 0 }} />
                     : <FiAlertTriangle size={14} style={{ color: '#ef4444', marginTop: '1px', flexShrink: 0 }} />}
        <div>
          <div style={{ fontSize: '12px', color: hasProvider ? '#10b981' : '#ef4444', fontWeight: '600' }}>
            {hasProvider ? 'AI provider active — Airis is ready' : 'No AI provider configured'}
          </div>
          <div style={{ fontSize: '11px', color: '#4a4a4a', marginTop: '3px' }}>
            {hasProvider
              ? providers.filter(p => p.enabled).map(p => `${p.name} (${p.model})`).join(', ')
              : 'Add a Groq API key below. Free tier at console.groq.com — takes 30 seconds.'}
          </div>
        </div>
      </div>

      <SecHdr label="Groq API (Cloud AI)" desc="Fast inference via Groq Cloud — recommended. Free tier included." />
      <Field label="Groq API Key" badge={<T ok={status.groq_api_key_set} />}
        hint={<>Get a free key at <Link href="https://console.groq.com">console.groq.com</Link></>}>
        <TextInput type="password" value={s.groq_api_key} onChange={v => set('groq_api_key', v)}
          placeholder={status.groq_api_key_set ? '••••••••••••••••••• (saved)' : 'gsk_...'} mono />
      </Field>
      <Field label="Groq Model">
        <Select value={s.groq_model} onChange={v => set('groq_model', v)} options={[
          'llama-3.3-70b-versatile', 'llama-3.1-8b-instant',
          'llama3-groq-70b-8192-tool-use-preview', 'mixtral-8x7b-32768', 'gemma2-9b-it',
        ]} />
      </Field>

      <Divider />
      <SecHdr label="Ollama (Local AI)" desc="Run AI models on your own machine — no API key, no internet needed." />
      <Field label="Ollama Server URL" hint="Usually http://localhost:11434 when running Ollama on this PC">
        <TextInput value={s.ollama_url} onChange={v => set('ollama_url', v)} placeholder="http://localhost:11434" mono />
      </Field>
      <Field label="Ollama Model">
        <TextInput value={s.ollama_model} onChange={v => set('ollama_model', v)} placeholder="llama3.2" mono />
      </Field>
      <Toggle value={s.ollama_enabled} onChange={v => set('ollama_enabled', v)} label="Enable Ollama" sublabel="Use as fallback when Groq is unavailable" />
    </div>
  );
};

const VoiceTab = ({ s, set, status }) => (
  <div>
    <SecHdr label="Voice Output Provider" desc="Choose how Airis speaks back to you." />
    <Field label="Preferred TTS Provider">
      <Select value={s.preferred_voice_provider} onChange={v => set('preferred_voice_provider', v)} options={[
        { value: 'fish',    label: '🎭 Fish Audio (premium AI voice clone)' },
        { value: 'eleven',  label: '🔊 ElevenLabs (premium neural TTS)' },
        { value: 'browser', label: '🌐 Browser built-in (free, works everywhere)' },
      ]} />
    </Field>
    <Field label="Voice Personality">
      <Select value={s.voice_personality} onChange={v => set('voice_personality', v)} options={[
        { value: 'airis',    label: 'Airis — Professional, British-style AI (Iron Man)' },
        { value: 'siri',     label: 'Siri — Friendly, American-style assistant' },
        { value: 'assistant',label: 'Assistant — Neutral, clear, efficient' },
        { value: 'custom',   label: 'Custom — Use your cloned voice (Fish Audio)' },
      ]} />
    </Field>
    <Field label="Voice Priority Order" hint="Comma-separated. Airis tries each in order until one works.">
      <TextInput value={s.voice_priority} onChange={v => set('voice_priority', v)} placeholder="fish,eleven,browser" mono />
    </Field>

    <Divider />
    <SecHdr label="Fish Audio" desc={<>Premium voice cloning & synthesis. <Link href="https://fish.audio">fish.audio</Link></>} />
    <Field label="Fish Audio API Key" badge={<T ok={status.fish_audio_api_key_set} />}>
      <TextInput type="password" value={s.fish_audio_api_key} onChange={v => set('fish_audio_api_key', v)}
        placeholder={status.fish_audio_api_key_set ? '••••••••••••••••••• (saved)' : 'Fish Audio API key'} mono />
    </Field>
    <Field label="Voice Reference ID" hint="The ID of your cloned voice model on Fish Audio dashboard">
      <TextInput value={s.fish_audio_reference_id} onChange={v => set('fish_audio_reference_id', v)} placeholder="Voice reference ID" mono />
    </Field>
    <Field label="Fish Model">
      <Select value={s.fish_audio_model} onChange={v => set('fish_audio_model', v)} options={['s2-pro', 's2', 'speech-01-turbo']} />
    </Field>

    <Divider />
    <SecHdr label="ElevenLabs" desc={<>Neural text-to-speech. <Link href="https://elevenlabs.io">elevenlabs.io</Link></>} />
    <Field label="ElevenLabs API Key" badge={<T ok={status.elevenlabs_api_key_set} />}>
      <TextInput type="password" value={s.elevenlabs_api_key} onChange={v => set('elevenlabs_api_key', v)}
        placeholder={status.elevenlabs_api_key_set ? '••••••••••••••••••• (saved)' : 'ElevenLabs API key'} mono />
    </Field>
    <Field label="ElevenLabs Voice ID" hint="Voice ID from your ElevenLabs dashboard">
      <TextInput value={s.elevenlabs_voice_id} onChange={v => set('elevenlabs_voice_id', v)} placeholder="Voice ID or name" mono />
    </Field>

    <Divider />
    <SecHdr label="Voice Tuning" desc="Fine-tune how Airis speaks." />
    <Slider label="Speech Rate" value={parseFloat(s.voice_rate || 150)} onChange={v => set('voice_rate', String(v))} min={80} max={250} step={10} format={v => `${v} wpm`} />
    <Slider label="Volume" value={parseFloat(s.voice_volume || 0.9)} onChange={v => set('voice_volume', String(v))} min={0} max={1} step={0.05} format={v => `${Math.round(v * 100)}%`} />
    <Slider label="Pitch" value={parseFloat(s.voice_pitch || 1.0)} onChange={v => set('voice_pitch', String(v))} min={0.5} max={2.0} step={0.05} format={v => `${v}×`} />
  </div>
);

const LanguageTab = ({ s, set, prefs, setPref }) => (
  <div>
    <SecHdr label="Response Language" desc="What language should Airis respond in?" />
    <Field label="Response Language">
      <Select value={s.response_language} onChange={v => set('response_language', v)} options={[
        { value: 'auto',  label: '🌐 Auto-detect (matches your input language)' },
        { value: 'en',    label: '🇬🇧 English' },
        { value: 'te',    label: '🇮🇳 Telugu (తెలుగు)' },
        { value: 'hi',    label: '🇮🇳 Hindi (हिन्दी)' },
        { value: 'ta',    label: '🇮🇳 Tamil (தமிழ்)' },
        { value: 'kn',    label: '🇮🇳 Kannada (ಕನ್ನಡ)' },
        { value: 'ml',    label: '🇮🇳 Malayalam (മലയാളം)' },
      ]} />
    </Field>
    <div style={{ padding: '10px 12px', backgroundColor: '#0a1a0a', border: '1px solid #10b98122', borderRadius: '4px', marginBottom: '14px' }}>
      <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '500', marginBottom: '4px' }}>Bilingual by default</div>
      <div style={{ fontSize: '11px', color: '#4a4a4a', lineHeight: '1.6' }}>
        Airis automatically detects whether you speak English or Telugu and replies in the same language.
        Select "Auto-detect" to keep this behaviour, or force a specific language above.
      </div>
    </div>

    <Divider />
    <SecHdr label="Voice Input Language" desc="Language Airis listens for via microphone." />
    <Field label="Speech Recognition Language">
      <Select value={s.voice_language} onChange={v => set('voice_language', v)} options={[
        { value: 'en',    label: '🇬🇧 English (en-US)' },
        { value: 'te',    label: '🇮🇳 Telugu (te-IN)' },
        { value: 'hi',    label: '🇮🇳 Hindi (hi-IN)' },
        { value: 'ta',    label: '🇮🇳 Tamil (ta-IN)' },
        { value: 'kn',    label: '🇮🇳 Kannada (kn-IN)' },
        { value: 'ml',    label: '🇮🇳 Malayalam (ml-IN)' },
        { value: 'en-IN', label: '🇮🇳 Indian English (en-IN)' },
      ]} />
    </Field>

    <Divider />
    <SecHdr label="TTS Language" desc="Language for text-to-speech voice output." />
    <Field label="Telugu TTS Method" hint="Browser TTS uses Google's Telugu voice. Fish Audio uses your cloned voice.">
      <Select value={prefs?.tts_telugu_method || 'gtts'} onChange={v => setPref('tts_telugu_method', v)} options={[
        { value: 'gtts',  label: 'gTTS — Google Text-to-Speech (online, natural)' },
        { value: 'pyttsx3', label: 'pyttsx3 — Local engine (offline)' },
        { value: 'fish',  label: 'Fish Audio — Your cloned voice' },
      ]} />
    </Field>
  </div>
);

const WakeWordTab = ({ s, set }) => (
  <div>
    <SecHdr label="Wake Word" desc="Say the wake word to activate Airis hands-free — no clicking needed." />
    <Field label="Wake Word / Keyword" hint='Default is "Airis". You can change it to any word.'>
      <TextInput value={s.wake_word} onChange={v => set('wake_word', v)} placeholder="airis" mono />
    </Field>
    <Field label="Sensitivity" hint="Higher = detects from farther away but more false positives.">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input type="range" min="0.1" max="1.0" step="0.1" value={parseFloat(s.wake_word_sensitivity || 1.0)}
          onChange={e => set('wake_word_sensitivity', e.target.value)}
          style={{ flex: 1, accentColor: '#3b82f6' }} />
        <span style={{ fontSize: '12px', color: '#3b82f6', fontFamily: 'Geist Mono, monospace', minWidth: '32px' }}>
          {parseFloat(s.wake_word_sensitivity || 1.0).toFixed(1)}
        </span>
      </div>
    </Field>

    <Divider />
    <SecHdr label="Double Clap" desc='Clap twice to activate Airis — no need to say the wake word.' />
    <Toggle value={s.double_clap_enabled} onChange={v => set('double_clap_enabled', v)}
      label="Enable double-clap detection"
      sublabel="Works via microphone — detects two sharp claps within 0.8 seconds" />

    <Divider />
    <div style={{ padding: '12px', backgroundColor: '#0a0d1a', border: '1px solid #1e3a5a', borderRadius: '5px' }}>
      <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', marginBottom: '6px' }}>Desktop-only feature</div>
      <div style={{ fontSize: '11px', color: '#4a4a4a', lineHeight: '1.6' }}>
        Wake word and double-clap activation require the desktop Python app to be running in the background.
        The web interface uses the browser microphone button instead.
        Start <code style={{ fontFamily: 'Geist Mono, monospace', color: '#8b8b8b' }}>python backend/airis_mode.py</code> for always-on background mode.
      </div>
    </div>
  </div>
);

const CloneTab = ({ status, currentRefId, onCloneSuccess }) => {
  const [file, setFile]       = useState(null);
  const [name, setName]       = useState('My Airis Voice');
  const [drag, setDrag]       = useState(false);
  const [phase, setPhase]     = useState('idle'); // idle | reading | uploading | done | error
  const [modelId, setModelId] = useState('');
  const [errMsg, setErrMsg]   = useState('');
  const fileRef               = useRef(null);

  const fmt = (bytes) => bytes < 1024*1024 ? `${(bytes/1024).toFixed(0)} KB` : `${(bytes/1024/1024).toFixed(1)} MB`;
  const dur = (f) => {
    if (!f) return '';
    const url = URL.createObjectURL(f);
    return new Promise(res => {
      const a = new Audio(url);
      a.onloadedmetadata = () => { URL.revokeObjectURL(url); res(`${Math.round(a.duration)}s`); };
      a.onerror = () => { URL.revokeObjectURL(url); res(''); };
    });
  };
  const [durStr, setDurStr] = useState('');
  useEffect(() => {
    if (file) dur(file).then(setDurStr);
    else setDurStr('');
  }, [file]);

  const pickFile = (f) => {
    if (!f || !f.type.startsWith('audio/')) return;
    setFile(f); setPhase('idle'); setModelId(''); setErrMsg('');
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const handleClone = async () => {
    if (!file || !name.trim()) return;
    setPhase('reading'); setErrMsg('');
    try {
      const b64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = e => resolve(e.target.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setPhase('uploading');
      const res = await api.cloneVoice(name.trim(), b64, file.type);
      setModelId(res.model_id);
      setPhase('done');
      onCloneSuccess?.(res.model_id);
    } catch (e) {
      setErrMsg(e?.response?.data?.error || e.message || 'Clone failed');
      setPhase('error');
    }
  };

  const phaseLabel = { idle: null, reading: 'Reading audio file…', uploading: 'Uploading to Fish Audio & training model…', done: null, error: null };
  const canClone   = file && name.trim() && status.fish_audio_api_key_set && phase !== 'uploading' && phase !== 'reading';

  return (
    <div>
      <SecHdr label="Voice Cloning" desc="Upload a 30–60 second voice recording — Airis will clone it and speak in your voice." />

      {!status.fish_audio_api_key_set && (
        <div style={{ padding: '10px 14px', backgroundColor: '#1a0808', border: '1px solid #ef444433', borderRadius: '5px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <FiAlertTriangle size={14} style={{ color: '#ef4444', marginTop: '1px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600', marginBottom: '2px' }}>Fish Audio API key required</div>
            <div style={{ fontSize: '11px', color: '#5a5a5a' }}>Go to <strong style={{ color: '#8b8b8b' }}>Voice & Speech</strong> tab → add your Fish Audio key, then come back here.</div>
          </div>
        </div>
      )}

      {currentRefId && phase !== 'done' && (
        <div style={{ padding: '10px 14px', backgroundColor: '#0a1a0a', border: '1px solid #10b98133', borderRadius: '5px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <FiCheckCircle size={14} style={{ color: '#10b981', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>Voice clone active</div>
            <div style={{ fontSize: '11px', color: '#4a4a4a', fontFamily: 'Geist Mono, monospace', marginTop: '2px' }}>{currentRefId}</div>
          </div>
          <div style={{ fontSize: '10px', color: '#10b981', backgroundColor: '#0a2a1a', padding: '2px 8px', borderRadius: '10px', border: '1px solid #10b98133' }}>LIVE</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '14px 16px', backgroundColor: '#0a1a0a', border: '1px solid #10b981', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FiCheckCircle size={16} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '700' }}>Voice clone created successfully!</span>
          </div>
          <div style={{ fontSize: '11px', color: '#4a4a4a', marginBottom: '8px' }}>Airis will now speak in your cloned voice for all responses.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: '#5a5a5a' }}>Model ID:</div>
            <code style={{ fontSize: '11px', color: '#3b82f6', fontFamily: 'Geist Mono, monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{modelId}</code>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: '#10b981', backgroundColor: '#0a2a1a', padding: '3px 10px', borderRadius: '10px', border: '1px solid #10b98133' }}>Voice active</div>
            <div style={{ fontSize: '11px', color: '#3b82f6', backgroundColor: '#0a0d1a', padding: '3px 10px', borderRadius: '10px', border: '1px solid #3b82f633' }}>Fish Audio</div>
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div style={{ padding: '10px 14px', backgroundColor: '#1a0808', border: '1px solid #ef444433', borderRadius: '5px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600', marginBottom: '3px' }}>Clone failed</div>
          <div style={{ fontSize: '11px', color: '#5a5a5a', fontFamily: 'Geist Mono, monospace' }}>{errMsg}</div>
        </div>
      )}

      <Field label="Voice Model Name">
        <TextInput value={name} onChange={setName} placeholder="My Airis Voice" />
      </Field>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ fontSize: '12px', color: '#8b8b8b', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
          Audio Sample
        </label>
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${drag ? '#3b82f6' : file ? '#10b981' : '#222'}`,
            borderRadius: '8px', padding: '24px 16px', textAlign: 'center',
            backgroundColor: drag ? '#0a0d1a' : file ? '#0a1a0a' : '#080808',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          {file ? (
            <div>
              <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '600', marginBottom: '4px' }}>
                {file.name}
              </div>
              <div style={{ fontSize: '11px', color: '#5a5a5a' }}>
                {fmt(file.size)}{durStr ? ` · ${durStr}` : ''} · {file.type.replace('audio/', '').toUpperCase()}
              </div>
              <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '8px' }}>Click to change file</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎙️</div>
              <div style={{ fontSize: '13px', color: '#5a5a5a', marginBottom: '4px' }}>Drop your voice recording here</div>
              <div style={{ fontSize: '11px', color: '#3a3a3a' }}>or click to browse — MP3, WAV, OGG, M4A</div>
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#2a2a2a' }}>Recommended: 30–60 seconds, clear speech, quiet room</div>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }}
          onChange={e => pickFile(e.target.files?.[0])} />
      </div>

      {file && (
        <div style={{ marginBottom: '14px' }}>
          <audio controls src={URL.createObjectURL(file)}
            style={{ width: '100%', height: '36px', accentColor: '#3b82f6' }} />
        </div>
      )}

      {phaseLabel[phase] && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '12px', color: '#3b82f6' }}>
          <FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
          {phaseLabel[phase]}
        </div>
      )}

      <button
        onClick={handleClone}
        disabled={!canClone}
        style={{
          width: '100%', padding: '10px', borderRadius: '6px', border: 'none',
          backgroundColor: canClone ? '#3b82f6' : '#1a1a1a',
          color: canClone ? '#fff' : '#3a3a3a',
          fontSize: '13px', fontWeight: '600', cursor: canClone ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'all 0.2s',
        }}
      >
        {phase === 'uploading' || phase === 'reading'
          ? <><FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Creating voice clone…</>
          : '🎭 Create Voice Clone'}
      </button>

      <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '5px' }}>
        <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '600', marginBottom: '6px' }}>Tips for best results</div>
        {[
          'Record 30–60 seconds of natural, continuous speech',
          'Speak clearly in a quiet room with no background music',
          'Use the same microphone you normally speak into',
          'Read aloud from a book or article — varied sentence lengths work best',
          'Avoid long pauses, coughing, or filler sounds',
        ].map((t, i) => (
          <div key={i} style={{ fontSize: '11px', color: '#3a3a3a', marginBottom: '3px', paddingLeft: '10px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: '#3b82f6' }}>·</span>{t}
          </div>
        ))}
      </div>
    </div>
  );
};

const PromptTab = ({ prompt, setPrompt, saving, onSave }) => (
  <div>
    <SecHdr label="System Prompt" desc="Customize Airis's core personality, rules and capabilities." />
    <div style={{ padding: '10px 12px', backgroundColor: '#0a0d1a', border: '1px solid #1e3a5a', borderRadius: '4px', marginBottom: '14px', fontSize: '11px', color: '#4a4a4a', lineHeight: '1.6' }}>
      The system prompt defines how Airis thinks and behaves. The default includes the 12-layer brain rules, bilingual support, safety filters, and Airis personality. Only change this if you know what you're doing.
    </div>
    <textarea
      value={prompt}
      onChange={e => setPrompt(e.target.value)}
      rows={18}
      style={{
        width: '100%', backgroundColor: '#080808', border: '1px solid #222',
        borderRadius: '4px', color: '#d4d4d4', fontSize: '12px',
        fontFamily: 'Geist Mono, monospace', lineHeight: '1.6', resize: 'vertical',
        outline: 'none', padding: '10px', boxSizing: 'border-box',
      }}
      onFocus={e => e.target.style.borderColor = '#3b82f6'}
      onBlur={e => e.target.style.borderColor = '#222'}
    />
    <button onClick={onSave} disabled={saving}
      style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
      {saving ? <><FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><FiSave size={12} /> Save System Prompt</>}
    </button>
  </div>
);

const NotifsTab = ({ prefs, setPref }) => (
  <div>
    <SecHdr label="Notifications" desc="Control how and when Airis notifies you." />
    <Toggle value={prefs.notifications_reminders} onChange={v => setPref('notifications_reminders', v)}
      label="Reminder notifications" sublabel="Show desktop notifications when reminders are due" />
    <Toggle value={prefs.notifications_sound} onChange={v => setPref('notifications_sound', v)}
      label="Sound notifications" sublabel="Play a chime when Airis completes a task" />
    <Divider />
    <SecHdr label="Airis Background Mode" desc="Keep Airis running silently in the background." />
    <div style={{ padding: '10px 12px', backgroundColor: '#0a0d1a', border: '1px solid #1e3a5a', borderRadius: '4px', fontSize: '11px', color: '#4a4a4a', lineHeight: '1.6' }}>
      Background mode requires running the desktop Python script.<br />
      <code style={{ fontFamily: 'Geist Mono, monospace', color: '#8b8b8b' }}>python backend/airis_mode.py</code><br /><br />
      This enables: wake word detection, double-clap, background reminders, and live voice responses without the browser being open.
    </div>
  </div>
);

const AppearanceTab = ({ prefs, setPref }) => (
  <div>
    <SecHdr label="Theme" desc="Visual style of the Airis interface." />
    <Field label="Color Theme">
      <Select value={prefs.appearance || 'dark'} onChange={v => setPref('appearance', v)} options={[
        { value: 'dark',  label: '⬛ Dark (default — like VS Code)' },
        { value: 'darker',label: '🖤 Darker (pure black, OLED-friendly)' },
        { value: 'light', label: '⬜ Light (coming soon)' },
      ]} />
    </Field>
    <Field label="Density">
      <Select value={prefs.density || 'comfortable'} onChange={v => setPref('density', v)} options={[
        { value: 'comfortable', label: 'Comfortable (default)' },
        { value: 'compact',     label: 'Compact (more content, less padding)' },
      ]} />
    </Field>
    <Divider />
    <SecHdr label="Chat" />
    <Toggle value={prefs.show_thinking ?? false} onChange={v => setPref('show_thinking', v)}
      label="Show AI thinking steps" sublabel="Display each layer's reasoning in the chat" />
    <Toggle value={prefs.show_mode ?? true} onChange={v => setPref('show_mode', v)}
      label="Show mode badge (COMMAND / GOAL / CHAT)" sublabel="Shows intent classification on each message" />
  </div>
);

const AllKeysTab = ({ s, set, status }) => {
  const keys = [
    { field: 'groq_api_key',         label: 'Groq API Key',              set: status.groq_api_key_set,         link: 'https://console.groq.com' },
    { field: 'fish_audio_api_key',   label: 'Fish Audio API Key',        set: status.fish_audio_api_key_set,   link: 'https://fish.audio' },
    { field: 'elevenlabs_api_key',   label: 'ElevenLabs API Key',        set: status.elevenlabs_api_key_set,   link: 'https://elevenlabs.io' },
    { field: 'firebase_api_key',     label: 'Firebase API Key',          set: status.firebase_api_key_set,     link: 'https://console.firebase.google.com' },
  ];
  return (
    <div>
      <SecHdr label="All API Keys" desc="View and update all API keys in one place." />
      {keys.map(k => (
        <Field key={k.field} label={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{k.label} <T ok={k.set} /></span>}
          hint={<>Get your key at <Link href={k.link}>{k.link.replace('https://', '')}</Link></>}>
          <TextInput type="password" value={s[k.field] || ''} onChange={v => set(k.field, v)}
            placeholder={k.set ? '••••••••••••••••••• (saved)' : 'Paste key here'} mono />
        </Field>
      ))}
    </div>
  );
};

// ── Main Settings Component ──────────────────────────────────────────────

const Settings = () => {
  const [tab, setTab] = useState('ai');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [providers, setProviders] = useState([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);

  const [status, setStatus] = useState({
    groq_api_key_set: false, fish_audio_api_key_set: false,
    elevenlabs_api_key_set: false, firebase_api_key_set: false,
  });

  const [s, setS] = useState({
    groq_api_key: '', groq_model: 'llama-3.3-70b-versatile',
    ollama_url: '', ollama_model: 'llama3.2',
    fish_audio_api_key: '', fish_audio_reference_id: '', fish_audio_model: 's2-pro',
    elevenlabs_api_key: '', elevenlabs_voice_id: '',
    firebase_api_key: '',
    voice_personality: 'airis', preferred_voice_provider: 'fish',
    voice_language: 'en', response_language: 'auto',
    wake_word: 'airis', wake_word_sensitivity: '1.0', double_clap_enabled: true,
    voice_rate: '150', voice_volume: '0.9', voice_pitch: '1.0',
    voice_priority: 'fish,eleven,browser',
    ollama_enabled: true,
  });

  const [prefs, setPrefs] = useState({
    notifications_reminders: true, notifications_sound: true,
    appearance: 'dark', density: 'comfortable',
    show_thinking: false, show_mode: true,
    tts_telugu_method: 'gtts',
  });

  const set = (k, v) => setS(p => ({ ...p, [k]: v }));
  const setPref = (k, v) => setPrefs(p => ({ ...p, [k]: v }));

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getSettings();
      if (res.settings) {
        setStatus({
          groq_api_key_set: res.settings.groq_api_key_set,
          fish_audio_api_key_set: res.settings.fish_audio_api_key_set,
          elevenlabs_api_key_set: res.settings.elevenlabs_api_key_set,
          firebase_api_key_set: res.settings.firebase_api_key_set,
        });
        setS(p => ({ ...p, ...Object.fromEntries(Object.entries(res.settings).filter(([, v]) => typeof v !== 'boolean' || true)) }));
      }
      if (res.preferences) setPrefs(p => ({ ...p, ...res.preferences }));
      if (res.providers) setProviders(res.providers);
    } catch { setError('Could not load settings — is the backend running?'); }
    finally { setLoading(false); }

    try {
      const pr = await api.getSystemPrompt();
      if (pr.prompt) setSystemPrompt(pr.prompt);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.saveSettings(s, prefs);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
      await load();
    } catch (e) { setError(e?.response?.data?.error || e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleSavePrompt = async () => {
    setSavingPrompt(true);
    try { await api.saveSystemPrompt(systemPrompt); }
    catch (e) { setError(e.message); }
    finally { setSavingPrompt(false); }
  };

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a4a4a', gap: '8px' }}>
      <FiRefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading settings...
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0a0a0a', overflow: 'hidden' }}>
      {/* Tab bar */}
      <div style={{ height: '36px', backgroundColor: '#111111', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'stretch', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRight: '1px solid #1e1e1e', borderBottom: '1px solid #3b82f6', backgroundColor: '#0a0a0a', fontSize: '13px', color: '#e8e8e8', gap: '6px' }}>
          <FiSliders size={13} style={{ color: '#3b82f6' }} />
          <span>settings</span>
        </div>
      </div>

      {/* Body: left nav + content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left nav */}
        <div style={{ width: '170px', flexShrink: 0, backgroundColor: '#0d0d0d', borderRight: '1px solid #1a1a1a', overflowY: 'auto', padding: '8px 0' }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  width: '100%', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: active ? '#1e2a3a' : 'transparent', border: 'none',
                  borderLeft: `2px solid ${active ? '#3b82f6' : 'transparent'}`,
                  color: active ? '#e8e8e8' : '#6a6a6a', fontSize: '12px',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = '#141414'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Icon size={13} style={{ flexShrink: 0 }} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ maxWidth: '520px' }}>
            {tab === 'ai'        && <AiTab s={s} set={set} status={status} providers={providers} />}
            {tab === 'voice'     && <VoiceTab s={s} set={set} status={status} />}
            {tab === 'language'  && <LanguageTab s={s} set={set} prefs={prefs} setPref={setPref} />}
            {tab === 'wakeword'  && <WakeWordTab s={s} set={set} />}
            {tab === 'clone'     && <CloneTab status={status} currentRefId={s.fish_audio_reference_id} onCloneSuccess={id => set('fish_audio_reference_id', id)} />}
            {tab === 'prompt'    && <PromptTab prompt={systemPrompt} setPrompt={setSystemPrompt} saving={savingPrompt} onSave={handleSavePrompt} />}
            {tab === 'notifs'    && <NotifsTab prefs={prefs} setPref={setPref} />}
            {tab === 'appearance'&& <AppearanceTab prefs={prefs} setPref={setPref} />}
            {tab === 'keys'      && <AllKeysTab s={s} set={set} status={status} />}

            {tab !== 'prompt' && tab !== 'clone' && (
              <>
                {error && <div style={{ padding: '10px 14px', backgroundColor: '#1a0a0a', border: '1px solid #ef444433', borderRadius: '4px', color: '#ef4444', fontSize: '12px', marginTop: '16px' }}>{error}</div>}
                {saved && <div style={{ padding: '10px 14px', backgroundColor: '#0a1a0a', border: '1px solid #10b98133', borderRadius: '4px', color: '#10b981', fontSize: '12px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><FiCheckCircle size={13} /> Saved successfully</div>}
                <button onClick={handleSave} disabled={saving}
                  style={{ marginTop: '16px', width: '100%', padding: '9px', backgroundColor: saving ? '#1a2a3a' : '#3b82f6', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
                  {saving ? <><FiRefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><FiSave size={14} /> Save Settings</>}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
