import { useState, useEffect } from 'react';
import {
  FiKey, FiMic, FiCpu, FiSave, FiRefreshCw,
  FiCheckCircle, FiXCircle, FiEye, FiEyeOff,
  FiAlertTriangle, FiExternalLink, FiDatabase
} from 'react-icons/fi';
import { api } from '../services/api';

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama3-groq-70b-8192-tool-use-preview',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
];

const FISH_MODELS = ['s2-pro', 's2', 'speech-01-turbo'];

const Badge = ({ ok, label }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '500',
    backgroundColor: ok ? '#0a2a1a' : '#2a0a0a',
    color: ok ? '#10b981' : '#ef4444',
    border: `1px solid ${ok ? '#10b98133' : '#ef444433'}`,
  }}>
    {ok ? <FiCheckCircle size={10} /> : <FiXCircle size={10} />}
    {label}
  </span>
);

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
      <Icon size={15} style={{ color: '#3b82f6' }} />
      <span style={{ fontSize: '13px', fontWeight: '600', color: '#e8e8e8' }}>{title}</span>
    </div>
    {subtitle && <p style={{ fontSize: '12px', color: '#5a5a5a', marginLeft: '23px' }}>{subtitle}</p>}
  </div>
);

const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: '14px' }}>
    <label style={{ display: 'block', fontSize: '12px', color: '#8b8b8b', marginBottom: '6px', fontWeight: '500' }}>
      {label}
    </label>
    {children}
    {hint && <p style={{ fontSize: '11px', color: '#4a4a4a', marginTop: '4px' }}>{hint}</p>}
  </div>
);

const TextInput = ({ value, onChange, placeholder, type = 'text', mono }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={isPassword && !show ? 'password' : 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: isPassword ? '8px 36px 8px 10px' : '8px 10px',
          backgroundColor: '#0a0a0a',
          border: '1px solid #2a2a2a',
          borderRadius: '4px',
          color: '#e8e8e8',
          fontSize: '13px',
          fontFamily: mono ? 'Geist Mono, monospace' : 'inherit',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = '#3b82f6'}
        onBlur={e => e.target.style.borderColor = '#2a2a2a'}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#5a5a5a',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
          }}
        >
          {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
        </button>
      )}
    </div>
  );
};

const SelectInput = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      width: '100%',
      padding: '8px 10px',
      backgroundColor: '#0a0a0a',
      border: '1px solid #2a2a2a',
      borderRadius: '4px',
      color: '#e8e8e8',
      fontSize: '13px',
      fontFamily: 'Geist Mono, monospace',
      outline: 'none',
      cursor: 'pointer',
    }}
  >
    {options.map(o => (
      <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
    ))}
  </select>
);

const Divider = () => (
  <div style={{ height: '1px', backgroundColor: '#1a1a1a', margin: '24px 0' }} />
);

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [providers, setProviders] = useState([]);

  const [s, setS] = useState({
    groq_api_key: '',
    groq_model: 'llama-3.3-70b-versatile',
    ollama_url: '',
    ollama_model: 'llama3.2',
    fish_audio_api_key: '',
    fish_audio_reference_id: '',
    fish_audio_model: 's2-pro',
    elevenlabs_api_key: '',
    elevenlabs_voice_id: '',
  });

  const [prefs, setPrefs] = useState({
    voice_priority: 'fish,eleven,self',
    ollama_enabled: true,
    notifications_reminders: true,
    notifications_sound: true,
  });

  const [status, setStatus] = useState({
    groq_api_key_set: false,
    fish_audio_api_key_set: false,
    elevenlabs_api_key_set: false,
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getSettings();
      if (res.settings) {
        setStatus({
          groq_api_key_set: res.settings.groq_api_key_set,
          fish_audio_api_key_set: res.settings.fish_audio_api_key_set,
          elevenlabs_api_key_set: res.settings.elevenlabs_api_key_set,
        });
        setS(prev => ({
          ...prev,
          groq_model: res.settings.groq_model || prev.groq_model,
          ollama_url: res.settings.ollama_url || '',
          ollama_model: res.settings.ollama_model || prev.ollama_model,
          fish_audio_reference_id: res.settings.fish_audio_reference_id || '',
          fish_audio_model: res.settings.fish_audio_model || prev.fish_audio_model,
          elevenlabs_voice_id: res.settings.elevenlabs_voice_id || '',
        }));
      }
      if (res.preferences) {
        setPrefs(prev => ({ ...prev, ...res.preferences }));
      }
      if (res.providers) {
        setProviders(res.providers);
      }
    } catch (e) {
      setError('Could not load settings. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.saveSettings(s, prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => setS(prev => ({ ...prev, [key]: val }));
  const setPref = (key, val) => setPrefs(prev => ({ ...prev, [key]: val }));

  const hasAnyProvider = providers.some(p => p.enabled);

  if (loading) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#4a4a4a', fontSize: '13px', gap: '8px',
      }}>
        <FiRefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
        Loading settings...
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0a',
      overflow: 'hidden',
    }}>
      {/* Tab bar */}
      <div style={{
        height: '36px',
        backgroundColor: '#111111',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex',
        alignItems: 'stretch',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderRight: '1px solid #1e1e1e',
          borderBottom: '1px solid #3b82f6',
          backgroundColor: '#0a0a0a',
          fontSize: '13px',
          color: '#e8e8e8',
          gap: '6px',
        }}>
          <FiKey size={13} style={{ color: '#3b82f6' }} />
          <span>settings</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>

          {/* Provider status banner */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: hasAnyProvider ? '#0a1a0a' : '#1a0a0a',
            border: `1px solid ${hasAnyProvider ? '#10b98133' : '#ef444433'}`,
            borderRadius: '6px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            {hasAnyProvider
              ? <FiCheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
              : <FiAlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
            }
            <div>
              <div style={{ fontSize: '13px', color: hasAnyProvider ? '#10b981' : '#ef4444', fontWeight: '500' }}>
                {hasAnyProvider ? 'AI provider configured — Jarvis is ready' : 'No AI provider configured'}
              </div>
              <div style={{ fontSize: '11px', color: '#5a5a5a', marginTop: '2px' }}>
                {hasAnyProvider
                  ? providers.filter(p => p.enabled).map(p => `${p.name} (${p.model})`).join(', ')
                  : 'Add a Groq API key below to enable responses. Get a free key at console.groq.com'}
              </div>
            </div>
          </div>

          {/* ── AI Provider ── */}
          <SectionHeader icon={FiCpu} title="AI Provider" subtitle="Jarvis needs at least one AI backend to generate responses." />

          <Field label={<span>Groq API Key <Badge ok={status.groq_api_key_set} label={status.groq_api_key_set ? 'Connected' : 'Not set'} /></span>}
            hint={<>Free tier available at <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>console.groq.com <FiExternalLink size={10} /></a></>}
          >
            <TextInput
              type="password"
              value={s.groq_api_key}
              onChange={v => set('groq_api_key', v)}
              placeholder={status.groq_api_key_set ? '••••••••••••••••••••• (saved)' : 'gsk_...'}
              mono
            />
          </Field>

          <Field label="Groq Model">
            <SelectInput value={s.groq_model} onChange={v => set('groq_model', v)} options={GROQ_MODELS} />
          </Field>

          <Divider />

          {/* ── Ollama ── */}
          <SectionHeader icon={FiDatabase} title="Ollama (Local AI)" subtitle="Run AI locally on your machine — no API key needed." />

          <Field label="Ollama URL" hint="Usually http://localhost:11434">
            <TextInput value={s.ollama_url} onChange={v => set('ollama_url', v)} placeholder="http://localhost:11434" mono />
          </Field>

          <Field label="Ollama Model">
            <TextInput value={s.ollama_model} onChange={v => set('ollama_model', v)} placeholder="llama3.2" mono />
          </Field>

          <Field label="Enable Ollama">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <div
                onClick={() => setPref('ollama_enabled', !prefs.ollama_enabled)}
                style={{
                  width: '36px', height: '20px', borderRadius: '10px',
                  backgroundColor: prefs.ollama_enabled ? '#3b82f6' : '#2a2a2a',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px',
                  left: prefs.ollama_enabled ? '18px' : '2px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  backgroundColor: '#fff', transition: 'left 0.2s',
                }} />
              </div>
              <span style={{ fontSize: '12px', color: '#8b8b8b' }}>
                {prefs.ollama_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </Field>

          <Divider />

          {/* ── Voice ── */}
          <SectionHeader icon={FiMic} title="Voice Output" subtitle="Premium AI voices make Jarvis sound natural and human-like." />

          <Field label={<span>Fish Audio API Key <Badge ok={status.fish_audio_api_key_set} label={status.fish_audio_api_key_set ? 'Connected' : 'Not set'} /></span>}
            hint={<>High-quality AI voice cloning at <a href="https://fish.audio" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>fish.audio <FiExternalLink size={10} /></a></>}
          >
            <TextInput
              type="password"
              value={s.fish_audio_api_key}
              onChange={v => set('fish_audio_api_key', v)}
              placeholder={status.fish_audio_api_key_set ? '••••••••••••••••••••• (saved)' : 'Fish Audio API key'}
              mono
            />
          </Field>

          <Field label="Fish Audio Reference ID" hint="Voice clone ID from your Fish Audio dashboard">
            <TextInput value={s.fish_audio_reference_id} onChange={v => set('fish_audio_reference_id', v)} placeholder="Reference voice ID" mono />
          </Field>

          <Field label="Fish Audio Model">
            <SelectInput value={s.fish_audio_model} onChange={v => set('fish_audio_model', v)} options={FISH_MODELS} />
          </Field>

          <Field label={<span>ElevenLabs API Key <Badge ok={status.elevenlabs_api_key_set} label={status.elevenlabs_api_key_set ? 'Connected' : 'Not set'} /></span>}
            hint={<>Premium voice synthesis at <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>elevenlabs.io <FiExternalLink size={10} /></a></>}
          >
            <TextInput
              type="password"
              value={s.elevenlabs_api_key}
              onChange={v => set('elevenlabs_api_key', v)}
              placeholder={status.elevenlabs_api_key_set ? '••••••••••••••••••••• (saved)' : 'ElevenLabs API key'}
              mono
            />
          </Field>

          <Field label="ElevenLabs Voice ID" hint="Voice ID from your ElevenLabs dashboard">
            <TextInput value={s.elevenlabs_voice_id} onChange={v => set('elevenlabs_voice_id', v)} placeholder="Voice ID" mono />
          </Field>

          <Field label="Voice Priority" hint="Comma-separated order: fish, eleven, self (browser TTS)">
            <TextInput value={prefs.voice_priority} onChange={v => setPref('voice_priority', v)} placeholder="fish,eleven,self" mono />
          </Field>

          <Divider />

          {/* Save button */}
          {error && (
            <div style={{
              padding: '10px 14px', backgroundColor: '#1a0a0a',
              border: '1px solid #ef444433', borderRadius: '4px',
              color: '#ef4444', fontSize: '12px', marginBottom: '12px',
            }}>
              {error}
            </div>
          )}

          {saved && (
            <div style={{
              padding: '10px 14px', backgroundColor: '#0a1a0a',
              border: '1px solid #10b98133', borderRadius: '4px',
              color: '#10b981', fontSize: '12px', marginBottom: '12px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <FiCheckCircle size={13} /> Settings saved successfully
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: saving ? '#1a2a3a' : '#3b82f6',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.15s',
              marginBottom: '32px',
            }}
          >
            {saving
              ? <><FiRefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
              : <><FiSave size={14} /> Save Settings</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
