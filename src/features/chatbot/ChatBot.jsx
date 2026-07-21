import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import "./ChatBot.css";

// ─── Profile definitions ──────────────────────────────────────────────────────
// Each profile's values come straight from the active .env file:
//   .env.development  →  npm run dev
//   .env.staging      →  vite --mode staging
//   .env.production   →  vite build
//
// When the user switches profiles at runtime the hardcoded fallbacks are used
// for the non-active environments (useful for testing cross-env from one build).

const PROFILES = {
  dev: {
    label: "Dev",
    badge: "DEV",
    color: "#16a34a",
    wsUrl:      import.meta.env.MODE === "development" ? import.meta.env.VITE_WS_URL      : "ws://localhost:8080/ws",
    wsApiKey:   import.meta.env.MODE === "development" ? import.meta.env.VITE_WS_API_KEY  : "dev-api-key-12345",
    apiBaseUrl: import.meta.env.MODE === "development" ? import.meta.env.VITE_API_BASE_URL : "http://localhost:8080",
  },
  stage: {
    label: "Stage",
    badge: "STG",
    color: "#d97706",
    wsUrl:      import.meta.env.MODE === "staging" ? import.meta.env.VITE_WS_URL      : "wss://stage.yourapp.com/ws",
    wsApiKey:   import.meta.env.MODE === "staging" ? import.meta.env.VITE_WS_API_KEY  : "stage-api-key-67890",
    apiBaseUrl: import.meta.env.MODE === "staging" ? import.meta.env.VITE_API_BASE_URL : "https://stage.yourapp.com",
  },
  live: {
    label: "Live",
    badge: "LIVE",
    color: "#dc2626",
    wsUrl:      import.meta.env.MODE === "production" ? import.meta.env.VITE_WS_URL      : "wss://api.yourapp.com/ws",
    wsApiKey:   import.meta.env.MODE === "production" ? import.meta.env.VITE_WS_API_KEY  : "",
    apiBaseUrl: import.meta.env.MODE === "production" ? import.meta.env.VITE_API_BASE_URL : "https://api.yourapp.com",
  },
};

// Pre-select the profile that matches the current build mode, with "dev" as fallback
const DEFAULT_PROFILE =
  PROFILES[import.meta.env.VITE_DEFAULT_PROFILE] !== undefined
    ? import.meta.env.VITE_DEFAULT_PROFILE
    : "dev";

// ─────────────────────────────────────────────────────────────────────────────

export default function ChatBot() {
  // ── Profile state ──────────────────────────────────────────────────────────
  const [activeProfile,    setActiveProfile]    = useState(DEFAULT_PROFILE);
  const [showProfileMenu,  setShowProfileMenu]  = useState(false);

  // ── Chat state ─────────────────────────────────────────────────────────────
  const [stompClient,      setStompClient]      = useState(null);
  const [connected,        setConnected]        = useState(false);
  const [message,          setMessage]          = useState("");
  const [chat,             setChat]             = useState([]);
  const [currentNode,      setCurrentNode]      = useState(null);
  const [sessionId,        setSessionId]        = useState(null);
  const [isTyping,         setIsTyping]         = useState(false);
  const [canGoBack,        setCanGoBack]        = useState(false);
  const [completed,        setCompleted]        = useState(false);
  const [workflowStarted,  setWorkflowStarted]  = useState(false);

  const chatEndRef       = useRef(null);
  const inputRef         = useRef(null);
  const sessionIdRef     = useRef(null);
  const currentNodeRef   = useRef(null);
  const workflowsNodeRef = useRef(null);
  const stompClientRef   = useRef(null);

  useEffect(() => { sessionIdRef.current   = sessionId;   }, [sessionId]);
  useEffect(() => { currentNodeRef.current = currentNode; }, [currentNode]);

  /* ── Incoming topic message ────────────────────────────────────────────── */
  const handleTopicMessage = useCallback((msg) => {
    let responseData = JSON.parse(msg.body);

    if (responseData?.error) {
      setIsTyping(false);
      setChat((prev) => [...prev, { sender: "system", text: `⚠️ ${responseData.error}`, time: new Date() }]);
      return;
    }

    if (responseData?.completed === true) {
      setIsTyping(false);
      setCompleted(true);
      setCurrentNode(null);
      setChat((prev) => [...prev,
        { sender: "bot",    text: responseData.response || "✅ Workflow completed. Thank you!", node: responseData, time: new Date() },
        { sender: "system", text: "✅ This workflow has completed. Click Restart to begin again.", time: new Date() },
      ]);
      return;
    }

    if (responseData?.node?.config?.nodeType === "buttons" || responseData?.node?.config?.apiType === "buttons") {
      responseData.buttons = responseData.response
        .split("\n")
        .filter((item) => item.trim())
        .map((item) => ({ name: item.trim(), id: item.trim() }));
    }

    setCurrentNode(responseData);
    setIsTyping(false);

    if (responseData?.node?.config?.nodeType === "api") {
      if (responseData?.node?.config?.apiType === "buttons") {
        setChat((prev) => [...prev, { sender: "bot", text: responseData?.node?.name, node: responseData, time: new Date() }]);
      }
    } else {
      setChat((prev) => [...prev, {
        sender: "bot",
        text: responseData?.config?.nodeType === "buttons" ? "Please select an option:" : responseData.response,
        node: responseData,
        time: new Date(),
      }]);
    }
  }, []);

  /* ── Build & activate a STOMP client for the given profile ────────────── */
  const buildClient = useCallback((profileKey) => {
    const profile = PROFILES[profileKey];

    const client = new Client({
      webSocketFactory: () => new WebSocket(profile.wsUrl),
      reconnectDelay: 5000,
      debug: () => {},
      connectHeaders: { "X-API-Key": profile.wsApiKey },

      onConnect: () => {
        setConnected(true);
        const existingSessionId = sessionIdRef.current;

        if (existingSessionId) {
          client.subscribe(`/topic/chat/${existingSessionId}`, handleTopicMessage);
          client.publish({ destination: "/app/chat.reconnect", body: JSON.stringify({ sessionId: existingSessionId }) });
          setChat((prev) => [...prev, { sender: "system", text: "🔄 Reconnected to server", time: new Date() }]);
        } else {
          client.subscribe("/app/chat.init", (response) => {
            const data = JSON.parse(response.body);
            setSessionId(data.sessionId);
            sessionIdRef.current = data.sessionId;
            client.subscribe(`/topic/chat/${data.sessionId}`, handleTopicMessage);

            if (data.workflows?.length > 0) {
              const node = {
                workflowsNode: true,
                node: { ...data.workflows[0], config: { nodeType: "buttons" } },
                buttons: data.workflows,
              };
              setCurrentNode(node);
              workflowsNodeRef.current = node;
              setChat([{ sender: "bot", text: "👋 Hi! I'm your assistant. Please select a workflow to get started:", node, time: new Date() }]);
            }
          });
          client.publish({ destination: "/app/chat.init", body: "{}" });
        }
      },

      onDisconnect: () => setConnected(false),
      onStompError:  () => setConnected(false),
    });

    client.activate();
    setStompClient(client);
    stompClientRef.current = client;
    return client;
  }, [handleTopicMessage]);

  /* ── Mount: connect with the default profile ──────────────────────────── */
  useEffect(() => {
    const client = buildClient(activeProfile);
    return () => client.deactivate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Switch profile ────────────────────────────────────────────────────── */
  const switchProfile = useCallback((profileKey) => {
    if (profileKey === activeProfile) { setShowProfileMenu(false); return; }

    stompClientRef.current?.deactivate();

    // Reset all state
    setConnected(false);
    setChat([]);
    setCurrentNode(null);
    setSessionId(null);
    sessionIdRef.current    = null;
    workflowsNodeRef.current = null;
    setCompleted(false);
    setCanGoBack(false);
    setWorkflowStarted(false);
    setIsTyping(false);
    setMessage("");
    setActiveProfile(profileKey);
    setShowProfileMenu(false);

    setTimeout(() => buildClient(profileKey), 50);
  }, [activeProfile, buildClient]);

  /* ── Auto-scroll ───────────────────────────────────────────────────────── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, isTyping]);

  /* ── Close profile menu on outside click ──────────────────────────────── */
  useEffect(() => {
    if (!showProfileMenu) return;
    const handler = () => setShowProfileMenu(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showProfileMenu]);

  /* ── Send helpers ──────────────────────────────────────────────────────── */
  const sendMessage = useCallback((value) => {
    if (!stompClient?.connected || !sessionIdRef.current) return;
    setIsTyping(true);
    stompClient.publish({
      destination: "/app/chat.message",
      body: JSON.stringify({ sessionId: currentNodeRef.current?.sessionId || sessionIdRef.current, message: value }),
    });
  }, [stompClient]);

  const handleSend = () => {
    if (!message.trim() || completed) return;
    const text         = message.trim();
    const variableName = currentNode?.node?.config?.variableName || null;
    setChat((prev) => [...prev, { sender: "user", text, time: new Date() }]);
    setCanGoBack(true);
    if (!stompClient?.connected || !sessionIdRef.current) return;
    setIsTyping(true);
    stompClient.publish({
      destination: "/app/chat.message",
      body: JSON.stringify({ sessionId: currentNodeRef.current?.sessionId || sessionIdRef.current, message: text, variableName }),
    });
    setMessage("");
    inputRef.current?.focus();
  };

  const handleGoBack = () => {
    if (!stompClient?.connected || !sessionIdRef.current) return;
    setIsTyping(true);
    setChat((prev) => [...prev, { sender: "system", text: "⬅ Went back to previous input", time: new Date() }]);
    stompClient.publish({
      destination: "/app/chat.back",
      body: JSON.stringify({ sessionId: currentNodeRef.current?.sessionId || sessionIdRef.current }),
    });
  };

  const handleRestart = () => {
    if (!stompClient?.connected || !sessionIdRef.current) return;
    setCompleted(false);
    setCanGoBack(false);
    setIsTyping(true);
    setChat((prev) => [...prev, { sender: "system", text: "🔄 Restarting workflow…", time: new Date() }]);
    stompClient.publish({ destination: "/app/chat.restart", body: JSON.stringify({ sessionId: sessionIdRef.current }) });
  };

  const handleOptionClick = (value) => {
    setChat((prev) => [...prev, { sender: "user", text: value.id, time: new Date() }]);
    setCanGoBack(true);
    sendMessage(value.id);
  };

  const handleWorkflowClick = (workflow) => {
    if (!stompClient?.connected || !sessionIdRef.current) return;
    setIsTyping(true);
    setWorkflowStarted(true);
    stompClient.publish({
      destination: "/app/chat.start",
      body: JSON.stringify({ sessionId: sessionIdRef.current, workflowId: workflow.id }),
    });
    setChat((prev) => [...prev, { sender: "user", text: workflow.name, time: new Date() }]);
    setCanGoBack(true);
  };

  const handleMainMenu = () => {
    const client = stompClientRef.current;
    if (!client?.connected) return;

    setCompleted(false);
    setCanGoBack(false);
    setWorkflowStarted(false);
    setIsTyping(false);
    setMessage("");
    setChat([]);
    setCurrentNode(null);
    sessionIdRef.current    = null;
    setSessionId(null);
    workflowsNodeRef.current = null;

    client.subscribe("/app/chat.init", (response) => {
      const data = JSON.parse(response.body);
      setSessionId(data.sessionId);
      sessionIdRef.current = data.sessionId;
      client.subscribe(`/topic/chat/${data.sessionId}`, handleTopicMessage);

      if (data.workflows?.length > 0) {
        const node = {
          workflowsNode: true,
          node: { ...data.workflows[0], config: { nodeType: "buttons" } },
          buttons: data.workflows,
        };
        setCurrentNode(node);
        workflowsNodeRef.current = node;
        setChat([{ sender: "bot", text: "👋 Hi! I'm your assistant. Please select a workflow to get started:", node, time: new Date() }]);
      }
    });
    client.publish({ destination: "/app/chat.init", body: "{}" });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* ── Derived ───────────────────────────────────────────────────────────── */
  const profile          = PROFILES[activeProfile];
  const showInput        = !completed && currentNode?.node?.config?.nodeType === "input";
  const inputPlaceholder = currentNode?.node?.name || "Type your message…";

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="cb-wrapper">
      <div className="cb-shell">

        {/* Header */}
        <div className="cb-header">
          <div className="cb-avatar">🤖</div>
          <div className="cb-header-info">
            <p className="cb-header-title">AI Assistant</p>
            <div className="cb-header-status">
              <span className={`cb-status-dot ${connected ? "" : "offline"}`} />
              <span className="cb-status-text">
                {connected ? "Online — ready to help" : "Connecting…"}
              </span>
            </div>
          </div>

          {/* Profile selector */}
          <div
            className="cb-profile-selector"
            onClick={(e) => { e.stopPropagation(); setShowProfileMenu((v) => !v); }}
            role="button"
            aria-haspopup="listbox"
            aria-expanded={showProfileMenu}
            aria-label={`Environment: ${profile.label}`}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setShowProfileMenu((v) => !v)}
          >
            <span className="cb-profile-badge" style={{ background: profile.color }}>
              {profile.badge}
            </span>
            {/* <span className="cb-profile-chevron">▾</span> */}

            {/* {showProfileMenu && (
              <div className="cb-profile-menu" role="listbox">
                {Object.entries(PROFILES).map(([key, p]) => (
                  <button
                    key={key}
                    role="option"
                    aria-selected={key === activeProfile}
                    className={`cb-profile-item ${key === activeProfile ? "active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); switchProfile(key); }}
                  >
                    <span className="cb-profile-dot" style={{ background: p.color }} />
                    {p.label}
                    {key === activeProfile && <span className="cb-profile-check">✓</span>}
                  </button>
                ))}
              </div>
            )} */}
          </div>
        </div>

        {/* Connecting banner */}
        {!connected && (
          <div className="cb-connecting">
            <div className="cb-connecting-spinner" />
            Connecting to {profile.label} server…
          </div>
        )}

        {/* Messages */}
        <div className="cb-messages">
          {chat.length === 0 && (
            <div className="cb-empty">
              <span className="cb-empty-icon">💬</span>
              <p>Start a conversation by selecting a workflow below</p>
            </div>
          )}

          {chat.map((msg, index) => {
            const hasButtons = msg.sender === "bot" &&
              (msg.node?.node?.config?.nodeType === "buttons" || msg.node?.node?.config?.apiType === "buttons");
            let isActiveButtons = false;
            if (hasButtons) {
              const lastBtnIndex = chat.findLastIndex((m) =>
                m.sender === "bot" &&
                (m.node?.node?.config?.nodeType === "buttons" || m.node?.node?.config?.apiType === "buttons")
              );
              isActiveButtons = index === lastBtnIndex;
            }
            return (
              <MessageRow
                key={index}
                msg={msg}
                disabled={hasButtons && !isActiveButtons}
                onOptionClick={handleOptionClick}
                onWorkflowClick={handleWorkflowClick}
              />
            );
          })}

          {isTyping && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        {/* Footer */}
        <div className="cb-footer">
          {showInput ? (
            <>
              <div className="cb-input-row">
                <input ref={inputRef} className="cb-text-input" value={message}
                  placeholder={inputPlaceholder} type="text"
                  onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown}
                  autoComplete="off" />
                <button className="cb-send-btn" onClick={handleSend}
                  disabled={!message.trim() || !connected} aria-label="Send message">
                  <SendIcon />
                </button>
              </div>
              <div className="cb-footer-actions">
                {canGoBack && (
                  <button className="cb-back-btn" onClick={handleGoBack} disabled={!connected}>⬅ Back</button>
                )}
                {workflowStarted && (
                  <button className="cb-restart-btn" onClick={handleRestart} disabled={!connected}>🔄 Restart</button>
                )}
                {workflowStarted && (
                  <button className="cb-main-menu-btn" onClick={handleMainMenu}>🏠 Main Menu</button>
                )}
                <p className="cb-input-hint">Press Enter to send</p>
              </div>
            </>
          ) : (
            <div className="cb-footer-actions">
              {canGoBack && !completed && (
                <button className="cb-back-btn" onClick={handleGoBack} disabled={!connected}>⬅ Back</button>
              )}
              {workflowStarted && (
                <button className="cb-restart-btn" onClick={handleRestart} disabled={!connected}>🔄 Restart</button>
              )}
              {workflowStarted && (
                <button className="cb-main-menu-btn" onClick={handleMainMenu}>🏠 Main Menu</button>
              )}
              <p className="cb-input-hint" style={{ margin: 0 }}>
                {completed ? "Workflow finished" : connected ? "Select an option above to continue" : "Waiting for connection…"}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* ── Sub-components ──────────────────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="cb-typing-row">
      <div className="cb-msg-avatar">🤖</div>
      <div className="cb-typing-bubble">
        <span className="cb-typing-dot" />
        <span className="cb-typing-dot" />
        <span className="cb-typing-dot" />
      </div>
    </div>
  );
}

function MessageRow({ msg, disabled, onOptionClick, onWorkflowClick }) {
  const isUser     = msg.sender === "user";
  const isSystem   = msg.sender === "system";
  const hasButtons = msg.sender === "bot" &&
    (msg.node?.node?.config?.nodeType === "buttons" || msg.node?.node?.config?.apiType === "buttons");

  if (isSystem) {
    return (
      <div className="cb-msg-row system">
        <div className="cb-system-msg">{msg.text}</div>
      </div>
    );
  }

  return (
    <div className={`cb-msg-row ${isUser ? "user" : "bot"}`}>
      {!isUser && <div className="cb-msg-avatar">🤖</div>}
      <div className="cb-bubble-wrap">
        <div className="cb-bubble">{msg.text}</div>
        <span className="cb-timestamp">{formatTime(msg.time)}</span>
        {hasButtons && (
          <div className={`cb-options ${disabled ? "cb-options-disabled" : ""}`}>
            {msg.node?.buttons?.map((btn) => (
              <button key={btn.id} className="cb-option-btn" disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  msg?.node?.workflowsNode ? onWorkflowClick(btn) : onOptionClick(btn);
                }}>
                {btn.name}
              </button>
            ))}
          </div>
        )}
      </div>
      {isUser && <div className="cb-msg-avatar-spacer" />}
    </div>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}
