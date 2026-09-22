import { useEffect, useRef, useState } from 'react';
import type { Me } from '../profile/api';
import { DefaultAvatar } from '../ui/DefaultAvatar';
import { type ChatMessage, fetchChatMessages, sendChatMessage } from './api';

interface ChatPanelProps {
  currentCityId: string;
  cityName: string;
  me: Me | null;
  onClose: () => void;
  onFlyToLocation?: (lat: number, lon: number) => void;
}

const QUICK_EMOJIS = ['🏃', '⚡', '🔥', '🏆', '⚔️', '📍', '👏', '😂'];

type ChatTab = 'global' | 'city' | 'clan';

export function ChatPanel({
  currentCityId,
  cityName,
  me,
  onClose,
  onFlyToLocation,
}: ChatPanelProps) {
  const [tab, setTab] = useState<ChatTab>('global');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeChannelType: 'global' | 'clan' = tab === 'clan' ? 'clan' : 'global';
  const activeChannelId = tab === 'global' ? 'global' : tab === 'city' ? currentCityId : me?.clan?.id ?? '';

  const loadMessages = async () => {
    if (!activeChannelId) {
      setMessages([]);
      return;
    }
    try {
      const list = await fetchChatMessages(activeChannelType, activeChannelId);
      setMessages(list);
    } catch {
      // API warming up or network glitch
    }
  };

  useEffect(() => {
    void loadMessages();
    const interval = window.setInterval(() => {
      void loadMessages();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [tab, activeChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending || !activeChannelId) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);
    setErrorMessage(null);

    try {
      const msg = await sendChatMessage({
        channel_type: activeChannelType,
        channel_id: activeChannelId,
        content: textToSend,
        msg_type: 'text',
      });
      setMessages((prev) => [...prev, msg]);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Xabar jiberiwde qátelik júz berdi');
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleSendLocation = () => {
    if (!('geolocation' in navigator) || sharingLocation || !activeChannelId) return;

    setSharingLocation(true);
    setErrorMessage(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const msg = await sendChatMessage({
            channel_type: activeChannelType,
            channel_id: activeChannelId,
            content: `📍 Jaylasıw: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            msg_type: 'location',
            payload: { lat: latitude, lon: longitude },
          });
          setMessages((prev) => [...prev, msg]);
        } catch (err: any) {
          setErrorMessage(err?.message || 'Jaylasıwdı jiberiwde qátelik júz berdi');
        } finally {
          setSharingLocation(false);
        }
      },
      () => {
        setErrorMessage('GPS arqalı jaylasıwdı anıqlap bolmadı');
        setSharingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="chat-panel-container">
      <div className="chat-header">
        <div className="chat-tabs">
          <button
            type="button"
            className={`chat-tab ${tab === 'global' ? 'active' : ''}`}
            onClick={() => {
              setTab('global');
              setErrorMessage(null);
            }}
            title="Barlıq qalalardan barlıq oyınshılar"
          >
            🌍 Global
          </button>
          <button
            type="button"
            className={`chat-tab ${tab === 'city' ? 'active' : ''}`}
            onClick={() => {
              setTab('city');
              setErrorMessage(null);
            }}
            title={`${cityName} aymaǵındaǵı oyınshılar`}
          >
            📍 {cityName}
          </button>
          <button
            type="button"
            className={`chat-tab ${tab === 'clan' ? 'active' : ''}`}
            onClick={() => {
              setTab('clan');
              setErrorMessage(null);
            }}
            disabled={!me?.clan}
            title={!me?.clan ? 'Klanǵa qosılıń' : undefined}
          >
            🛡️ {me?.clan ? me.clan.name : 'Klan'}
          </button>
        </div>
        <button type="button" className="chat-close-btn" onClick={onClose} aria-label="Jabıw">
          ✕
        </button>
      </div>

      {errorMessage && (
        <div className="chat-error-banner" onClick={() => setErrorMessage(null)}>
          <span>⚠️ {errorMessage}</span>
          <button type="button" className="error-close-btn">✕</button>
        </div>
      )}

      <div className="chat-messages-area">
        {tab === 'clan' && !me?.clan ? (
          <div className="chat-empty-notice">
            Klan chatında jazısıw ushın aldın klanǵa qosılıń yaki jańa klan dúziń! 🛡️
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty-notice">
            {tab === 'global'
              ? '🌍 Global chatta házirshe hesh qanday xabar joq. Birinshi bolıp barlıq qalalardaǵı oyınshılarǵa sálem jollań! 💬'
              : tab === 'city'
              ? `📍 ${cityName} chatında házirshe xabar joq. Usı qala juwırıwshılarına xabar jazıń! 💬`
              : '🛡️ Klan chatında házirshe xabar joq. Klanyorlarıńızǵa birinshi bolıp jazıń! 💬'}
          </div>
        ) : (
          messages.map((m) => {
            const isMine = (me && m.sender.user_id === me.user_id) || false;
            return (
              <div key={m.id} className={`chat-message-row ${isMine ? 'mine' : 'other'}`}>
                {!isMine && (
                  <div className="msg-avatar">
                    {m.sender.avatar_data ? (
                      <img src={m.sender.avatar_data} alt="" className="chat-avatar-img" />
                    ) : (
                      <DefaultAvatar size={28} />
                    )}
                  </div>
                )}
                <div className="msg-bubble">
                  <div
                    className="msg-sender"
                    style={{ color: isMine ? '#07130f' : (m.sender.color_hex || '#00ff88') }}
                  >
                    {isMine ? 'Siz' : m.sender.display_name}
                  </div>
                  {m.msg_type === 'location' ? (
                    <div className="msg-location-card">
                      <div className="location-text">{m.content}</div>
                      {m.payload.lat && m.payload.lon && onFlyToLocation && (
                        <button
                          type="button"
                          className="view-on-map-btn"
                          onClick={() => onFlyToLocation(Number(m.payload.lat), Number(m.payload.lon))}
                        >
                          Kartada kóriw 🗺️
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="msg-content">{m.content}</div>
                  )}
                  <div className="msg-time">{formatTime(m.created_at)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick emoji row */}
      <div className="quick-emojis-bar">
        {QUICK_EMOJIS.map((emoji) => (
          <button key={emoji} type="button" className="emoji-btn" onClick={() => addEmoji(emoji)}>
            {emoji}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form className="chat-input-bar" onSubmit={handleSend}>
        <button
          type="button"
          className="location-share-btn"
          onClick={handleSendLocation}
          disabled={sharingLocation || (tab === 'clan' && !me?.clan)}
          title="Meniń jaylasıwımdı jiberiw"
        >
          {sharingLocation ? '⏳' : '📍'}
        </button>

        <input
          type="text"
          placeholder={tab === 'clan' && !me?.clan ? 'Klanǵa qosılıń...' : 'Xabar jazıń...'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={tab === 'clan' && !me?.clan}
          className="chat-text-input"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || sending || (tab === 'clan' && !me?.clan)}
          className="chat-send-btn"
          title="Jiberiw"
        >
          {sending ? '···' : '➤'}
        </button>
      </form>
    </div>
  );
}

