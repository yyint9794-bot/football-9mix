import { useEffect, useRef, useState } from 'react';
import type { Match } from '../types';
import {
  getChatDisplayName,
  getMatchChatRoomId,
  sendLiveChatMessage,
  subscribeLiveChat,
  type LiveChatMessage,
} from './liveChat';

type LiveMatchChatProps = {
  match: Match;
};

export function LiveMatchChat({ match }: LiveMatchChatProps) {
  const roomId = getMatchChatRoomId(match);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [name, setName] = useState(() => getChatDisplayName());
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setError('');
    const stop = subscribeLiveChat(
      roomId,
      (next) => setMessages(next),
      (msg) => setError(msg),
    );
    return stop;
  }, [roomId]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    setSending(true);
    setError('');
    try {
      await sendLiveChatMessage(roomId, trimmed, name || 'Guest');
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ပို့၍ မရပါ');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="m-watch-chat" aria-label="Live chat">
      <div className="m-watch-chat-head">
        <strong>Live Chat</strong>
        <span>{messages.length} စာ</span>
      </div>

      <div className="m-watch-chat-list" ref={listRef}>
        {!messages.length && !error ? (
          <p className="m-watch-chat-empty">ပထမဆုံး စာပို့ပါ — အားလုံး ချက်ချင်း မြင်ရမည်</p>
        ) : null}
        {messages.map((msg) => (
          <div className="m-watch-chat-msg" key={msg.id}>
            <span className="m-watch-chat-user">{msg.displayName}</span>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      {error ? <p className="m-watch-chat-error">{error}</p> : null}

      <form
        className="m-watch-chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <input
          type="text"
          className="m-watch-chat-name"
          placeholder="နာမည်"
          maxLength={24}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          className="m-watch-chat-input"
          placeholder="စာရေးပါ…"
          maxLength={400}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="m-watch-chat-send" disabled={sending || !text.trim()}>
          ပို့
        </button>
      </form>
    </section>
  );
}
