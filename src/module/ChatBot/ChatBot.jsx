import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import "./ChatBot.css";

export default function ChatBot() {
  const [stompClient, setStompClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  /* ── WebSocket setup ───────────────────────────────────────────────────── */
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      debug: () => { },
      onConnect: () => {
        setConnected(true);

        client.subscribe("/app/chat.init", (response) => {
          const data = JSON.parse(response.body);
          setSessionId(data.sessionId);

          // Subscribe to session topic
          client.subscribe(`/topic/chat/${data.sessionId}`, (msg) => {
            let responseData = JSON.parse(msg.body);
            console.log("Received message:", responseData);

            if (responseData?.node?.config?.nodeType === "buttons" || responseData?.node?.config?.apiType === "buttons") {
              let buttons = responseData.response.split("\n").filter((item) => item.trim()).map((item) => (
                { 
                  name: item.trim(), 
                  id: item.trim() 
                }
              ));
              responseData.buttons = buttons;
            }

            setCurrentNode(responseData);
            setIsTyping(false);

            if (responseData?.node?.config?.nodeType == "api") {
              
              if (responseData?.node?.config?.apiType === "buttons") {
                setChat((prev) => [
                  ...prev,
                  {
                    sender: "bot",
                    text: responseData?.node?.name,
                    node: responseData,
                    time: new Date(),
                  },
                ]);
              }

            } else {
              
              setChat((prev) => [
                ...prev,
                {
                  sender: "bot",
                  text: responseData?.config?.nodeType === "buttons" ? "Please select an option:" : responseData.response,
                  node: responseData,
                  time: new Date(),
                },
              ]);

            }

          });

          // Initial workflow list
          if (data.workflows?.length > 0) {
            const node = {
              workflowsNode:true,
              node: {
                ...data.workflows[0],
                config: { nodeType: "buttons", },
              },
              buttons: data.workflows,
            };
            setCurrentNode(node);
            setChat([
              {
                sender: "bot",
                text: "👋 Hi! I'm your assistant. Please select a workflow to get started:",
                node,
                time: new Date(),
              },
            ]);
          }
        });

        client.publish({ destination: "/app/chat.init", body: "{}" });
      },

      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();
    setStompClient(client);

    return () => client.deactivate();
  }, []);

  /* ── Auto-scroll ───────────────────────────────────────────────────────── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, isTyping]);

  /* ── Send helpers ──────────────────────────────────────────────────────── */
  const sendMessage = useCallback(
    (value) => {
      if (!stompClient?.connected || !sessionId) return;
      setIsTyping(true);
      stompClient.publish({
        destination: "/app/chat.message",
        body: JSON.stringify({
          sessionId: currentNode?.sessionId || sessionId,
          message: value,
        }),
      });
    },
    [stompClient, sessionId, currentNode]
  );

  const handleSend = () => {
    if (!message.trim()) return;
    const text = message.trim();

    // Determine which variable this input maps to
    const variableName = currentNode?.node?.config?.variableName || null;

    setChat((prev) => [
      ...prev,
      { sender: "user", text, time: new Date() },
    ]);

    // After user gives input, they can go back
    setCanGoBack(true);

    // Send with variable metadata so backend can store it correctly
    if (!stompClient?.connected || !sessionId) return;
    setIsTyping(true);
    stompClient.publish({
      destination: "/app/chat.message",
      body: JSON.stringify({
        sessionId: currentNode?.sessionId || sessionId,
        message: text,
        variableName,
      }),
    });

    setMessage("");
    inputRef.current?.focus();
  };

  /* ── Go Back — returns to the previous input node ──────────────────────── */
  const handleGoBack = () => {
    if (!stompClient?.connected || !sessionId) return;
    setIsTyping(true);

    // Add a system message to indicate user went back
    setChat((prev) => [
      ...prev,
      { sender: "system", text: "⬅ Went back to previous input", time: new Date() },
    ]);

    stompClient.publish({
      destination: "/app/chat.back",
      body: JSON.stringify({
        sessionId: currentNode?.sessionId || sessionId,
      }),
    });
  };

  const handleOptionClick = (value) => {
    setChat((prev) => [...prev,
      { 
        sender: "user", 
        text: value.id, 
        time: new Date() 
      },
    ]);
    setCanGoBack(true);
    sendMessage(value.id);
  };

  const handleWorkflowClick = (workflow) => {
    if (!stompClient?.connected || !sessionId) return;
    setIsTyping(true);

    stompClient.publish({
      destination: "/app/chat.start",
      body: JSON.stringify({ sessionId, workflowId: workflow.id }),
    });

    setChat((prev) => [
      ...prev,
      { sender: "user", text: workflow.name, time: new Date() },
    ]);
    setCanGoBack(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Input visibility ───────────────────────────────────────────────────── */
  const showInput = currentNode?.node?.config?.nodeType === "input";
  const inputPlaceholder = currentNode?.node?.name || "Type your message…";

  /* ─── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="cb-wrapper">
      <div className="cb-shell">

        {/* ── Header ───────────────────────────────────────────────────── */}
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
        </div>

        {/* ── Connecting banner ─────────────────────────────────────────── */}
        {!connected && (
          <div className="cb-connecting">
            <div className="cb-connecting-spinner" />
            Connecting to server…
          </div>
        )}

        {/* ── Messages ─────────────────────────────────────────────────── */}
        <div className="cb-messages">
          {chat.length === 0 && (
            <div className="cb-empty">
              <span className="cb-empty-icon">💬</span>
              <p>Start a conversation by selecting a workflow below</p>
            </div>
          )}

          {chat.map((msg, index) => {
            // Only the last bot message with buttons should be interactive
            const hasButtons = msg.sender === "bot" &&
              (msg.node?.node?.config?.nodeType === "buttons" || msg.node?.node?.config?.apiType === "buttons");
            let isActiveButtons = false;
            if (hasButtons) {
              // Check if this is the last bot message with buttons in the chat
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

          {/* Typing indicator */}
          {isTyping && <TypingIndicator />}

          <div ref={chatEndRef} />
        </div>

        {/* ── Footer / Input ────────────────────────────────────────────── */}
        <div className="cb-footer">
          {showInput ? (
            <>
              <div className="cb-input-row">
                <input
                  ref={inputRef}
                  className="cb-text-input"
                  value={message}
                  placeholder={inputPlaceholder}
                  type="text"
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                />
                <button
                  className="cb-send-btn"
                  onClick={handleSend}
                  disabled={!message.trim() || !connected}
                  aria-label="Send message"
                >
                  <SendIcon />
                </button>
              </div>
              <div className="cb-footer-actions">
                {canGoBack && (
                  <button
                    className="cb-back-btn"
                    onClick={handleGoBack}
                    disabled={!connected}
                  >
                    ⬅ Back
                  </button>
                )}
                <p className="cb-input-hint">Press Enter to send</p>
              </div>
            </>
          ) : (
            <div className="cb-footer-actions">
              {canGoBack && (
                <button
                  className="cb-back-btn"
                  onClick={handleGoBack}
                  disabled={!connected}
                >
                  ⬅ Back
                </button>
              )}
              <p className="cb-input-hint" style={{ margin: 0 }}>
                {connected ? "Select an option above to continue" : "Waiting for connection…"}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ─── Main Function End ────────────────────────────────────────────────────────────── */



/* ─── helpers ────────────────────────────────────────────────────────────── */
const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* ─── sub-components ─────────────────────────────────────────────────────── */

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
  const isUser = msg.sender === "user";
  const isSystem = msg.sender === "system";
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
      {/* Bot avatar */}
      {!isUser && <div className="cb-msg-avatar">🤖</div>}

      <div className="cb-bubble-wrap">
        <div className="cb-bubble">{msg.text}</div>

        {/* Timestamp */}
        <span className="cb-timestamp">{formatTime(msg.time)}</span>

        {/* Option / workflow buttons */}
        {hasButtons && (
          <div className={`cb-options ${disabled ? "cb-options-disabled" : ""}`}>
            {msg.node?.buttons?.map((btn) => (
              <button
                key={btn.id}
                className="cb-option-btn"
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  msg?.node?.workflowsNode ? onWorkflowClick(btn) : onOptionClick(btn);
                }}
              >
                {btn.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User side spacer (keeps alignment without an avatar) */}
      {isUser && <div className="cb-msg-avatar-spacer" />}
    </div>
  );
}

/* ─── Send icon SVG ──────────────────────────────────────────────────────── */
function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}