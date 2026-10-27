
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  Search,
  Send,
  LoaderCircle,
  Inbox,
    AlertCircle,
    ShoppingBag,
} from "lucide-react";

import { io } from "socket.io-client";
import { useAuth } from "../store/useAuth";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Something went wrong."
    );
  }

  return data;
}

function getId(value) {
  if (!value) return "";
  return String(value._id || value.id || value);
}

function formatTime(date) {
  if (!date) return "";

  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatInboxTime(date) {
    if (!date) return "";
  
    const messageDate = new Date(date);
    if (Number.isNaN(messageDate.getTime())) return "";
  
    const today = new Date();
  
    if (messageDate.toDateString() === today.toDateString()) {
      return formatTime(date);
    }
  
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
  
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
  
    return messageDate.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
  }

export default function Messages() {
  const user = useAuth((state) => state.user);

  const [searchParams, setSearchParams] =
    useSearchParams();

  const conversationId = searchParams.get("chat");

  const [conversations, setConversations] =
    useState([]);

  const [messages, setMessages] = useState([]);

  const [search, setSearch] = useState("");
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] =
    useState(false);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const activeChatRef = useRef(conversationId);

  activeChatRef.current = conversationId;
  const currentUserId = getId(user);

  const selectedConversation =
    conversations.find(
      (conversation) =>
        getId(conversation) === conversationId
    );

  // ========================================
  // LOAD CONVERSATIONS
  // ========================================

  
async function loadConversations() {
  try {
    const data = await apiRequest(
      "/api/messages/conversations"
    );

    setConversations(data.conversations || []);
    setError("");
  } catch (err) {
    console.error("Failed to load conversations:", err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
}


  useEffect(() => {
    loadConversations();
  }, []);
    
    
  // ========================================
  // REAL-TIME SOCKET.IO CONNECTION
  // ========================================
  
  useEffect(() => {
    if (!currentUserId) return;
  
    const socket = io(API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
    });
  
    socketRef.current = socket;
  
    socket.on("connect", () => {
        console.log("CampusMart chat connected!");
      
        loadConversations();
      
        const chatId = activeChatRef.current;
      
        if (chatId) {
          apiRequest(`/api/messages/conversations/${chatId}`)
            .then((data) => {
              if (activeChatRef.current === chatId) {
                setMessages(data.messages || []);
              }
            })
            .catch(console.error);
        }
      });
  
    socket.on("connect_error", (error) => {
      console.error("Chat connection:", error.message);
    });
  
    socket.on("message:new", ({ conversationId: incomingId, message }) => {
      if (!message) return;
  
      // Update the currently opened conversation.
      if (String(incomingId) === activeChatRef.current) {
        setMessages((previous) => {
          const exists = previous.some(
            (item) => getId(item) === getId(message)
          );
  
          if (exists) return previous;
  
          return [...previous, message];
        });
  
        // Mark incoming messages as read.
        if (getId(message.sender) !== currentUserId) {
          apiRequest(
            `/api/messages/conversations/${incomingId}/read`,
            { method: "PATCH" }
          ).catch(console.error);
        }
      }
  
      // Refresh the inbox.
      loadConversations();
    });
  
    socket.on("conversation:updated", () => {
      loadConversations();
    });
  
      socket.on("conversation:read", ({ conversationId: updatedId }) => {
        loadConversations();
      if (String(updatedId) !== activeChatRef.current) {
        return;
      }
  
      // Refresh messages to update read status.
      apiRequest(
        `/api/messages/conversations/${updatedId}`
      )
        .then((data) => {
          if (activeChatRef.current === String(updatedId)) {
            setMessages(data.messages || []);
          }
        })
        .catch(console.error);
    });
  
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
  
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [currentUserId]);

  // ========================================
  // LOAD SELECTED CHAT
  // ========================================

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
  
    let cancelled = false;
  
    async function loadChat() {
      setChatLoading(true);
  
      try {
        const data = await apiRequest(
          `/api/messages/conversations/${conversationId}`
        );
  
        if (!cancelled) {
          setMessages(data.messages || []);
          setError("");
        }
  
        await apiRequest(
          `/api/messages/conversations/${conversationId}/read`,
          { method: "PATCH" }
        );
  
        if (!cancelled) {
          await loadConversations();
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setChatLoading(false);
        }
      }
    }
  
    loadChat();
  
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // ========================================
  // SCROLL TO LATEST MESSAGE
  // ========================================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ========================================
  // SEND MESSAGE
  // ========================================

  async function sendMessage(event) {
    event.preventDefault();

    const messageText = text.trim();

    if (
      !messageText ||
      !conversationId ||
      sending
    ) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const result = await apiRequest(
        `/api/messages/conversations/${conversationId}`,
        {
          method: "POST",
          body: JSON.stringify({
            text: messageText,
          }),
        }
      );

      setMessages((previous) => {
        const exists = previous.some(
          (message) => getId(message) === getId(result.data)
        );
      
        if (exists) return previous;
      
        return [...previous, result.data];
      });

      setText("");
      await loadConversations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  // ========================================
  // OPEN CONVERSATION
  // ========================================

  function openConversation(id) {
    setSearchParams({ chat: id });
    setError("");
  }

  // ========================================
  // FILTER CONVERSATIONS
  // ========================================

  const filteredConversations =
    conversations.filter((conversation) => {
      const otherPerson =
        getId(conversation.buyer) === currentUserId
          ? conversation.seller
          : conversation.buyer;

      const name = otherPerson?.name || "Student";
      const productTitle =
        conversation.product?.title || "Product";

      return (
        name.toLowerCase().includes(
          search.toLowerCase()
        ) ||
        productTitle.toLowerCase().includes(
          search.toLowerCase()
        )
      );
    });

  // ========================================
  // RENDER
  // ========================================

  return (
    <div
      className="container"
      style={{
        paddingTop: 36,
        paddingBottom: 70,
      }}
    >
      <div style={{ marginBottom: 26 }}>
        <h1 style={{ marginBottom: 6 }}>
          Your messages ✿
        </h1>

        <p style={{ opacity: 0.7 }}>
          Little conversations, lovely finds.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: 14,
            borderRadius: 14,
            marginBottom: 18,
            background: "rgba(239,68,68,0.1)",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(230px, 320px) minmax(0, 1fr)",
          gap: 16,
          minHeight: 520,
        }}
        className="campus-chat-layout"
      >
        {/* ==================================
            CONVERSATION LIST
        ================================== */}

        <aside
          className={
            conversationId
              ? "campus-chat-sidebar chat-open"
              : "campus-chat-sidebar"
          }
          style={{
            border: "1px solid var(--border, #ddd)",
            borderRadius: 20,
            overflow: "hidden",
            background: "var(--card, transparent)",
          }}
        >
          <div style={{ padding: 18 }}>
            <h3 style={{ marginBottom: 14 }}>
              <Inbox size={18} style={{
                verticalAlign: "middle",
                marginRight: 8,
              }} />
              Inbox
            </h3>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 12,
                border:
                  "1px solid var(--border, #ddd)",
              }}
            >
              <Search size={17} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search chats..."
                aria-label="Search chats"
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "inherit",
                }}
              />
            </div>
          </div>

          {loading ? (
            <p style={{ padding: 20 }}>
              Loading conversations...
            </p>
          ) : filteredConversations.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                opacity: 0.7,
              }}
            >
              <MessageCircle
                size={34}
                style={{ marginBottom: 10 }}
              />

              <p>No conversations yet.</p>

              <small>
                Find something you love and
                message the seller!
              </small>
            </div>
          ) : (
            filteredConversations.map(
              (conversation) => {
                const otherPerson =
                  getId(conversation.buyer) ===
                  currentUserId
                    ? conversation.seller
                    : conversation.buyer;

                const name =
                  otherPerson?.name || "Student";

                const active =
                  getId(conversation) ===
                  conversationId;

                return (
                  <button
                    key={getId(conversation)}
                    type="button"
                    onClick={() =>
                      openConversation(
                        getId(conversation)
                      )
                    }
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: 16,
                      border: "none",
                      borderBottom:
                        "1px solid var(--border, #ddd)",
                      background: active
                        ? "rgba(167,139,250,0.16)"
                        : "transparent",
                      color: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 12,
  }}
>
  {/* Student avatar */}
  <div
    style={{
      width: 44,
      height: 44,
      borderRadius: "50%",
      background: "rgba(167,139,250,0.18)",
      color: "#a78bfa",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      fontSize: 18,
      flexShrink: 0,
    }}
  >
    {name.charAt(0).toUpperCase()}
  </div>

  {/* Chat information */}
  <div style={{ flex: 1, minWidth: 0 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      }}
    >
      <strong
        style={{
          fontWeight:
            conversation.unreadCount > 0 ? 800 : 600,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </strong>

      <small
        style={{
          opacity: 0.6,
          fontSize: 11,
          flexShrink: 0,
        }}
      >
        {formatInboxTime(
          conversation.latestMessage?.createdAt ||
            conversation.lastMessageAt
        )}
      </small>
    </div>

    {/* Product title */}
    <p
      style={{
        margin: "5px 0",
        fontSize: 12,
        opacity: 0.65,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {conversation.product?.title || "Product"}
    </p>

    {/* Latest message and unread badge */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight:
            conversation.unreadCount > 0 ? 700 : 400,
          opacity:
            conversation.unreadCount > 0 ? 1 : 0.65,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
      >
        {conversation.latestMessage?.text ||
          "Start a conversation ✿"}
      </span>

      {conversation.unreadCount > 0 && (
        <span
          style={{
            background: "#a78bfa",
            color: "#fff",
            borderRadius: 999,
            minWidth: 21,
            height: 21,
            padding: "0 6px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {conversation.unreadCount > 99
            ? "99+"
            : conversation.unreadCount}
        </span>
      )}
    </div>
  </div>
</div>

                  </button>
                );
              }
            )
          )}
        </aside>

        {/* ==================================
            CHAT PANEL
        ================================== */}

        <section
          className={
            conversationId
              ? "campus-chat-panel chat-open"
              : "campus-chat-panel"
          }
          style={{
            display: "flex",
            flexDirection: "column",
            border: "1px solid var(--border, #ddd)",
            borderRadius: 20,
            overflow: "hidden",
            minHeight: 520,
            background: "var(--card, transparent)",
          }}
        >
          {!conversationId ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                padding: 30,
              }}
            >
              <MessageCircle
                size={52}
                color="#a78bfa"
              />

              <h2 style={{ marginTop: 16 }}>
                Your conversations live here
              </h2>

              <p style={{ opacity: 0.65 }}>
                Select a chat to start talking.
              </p>
            </div>
          ) : (
            <>
              {/* CHAT HEADER */}

              <div
                style={{
                  padding: 18,
                  borderBottom:
                    "1px solid var(--border, #ddd)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <button
                  type="button"
                  className="campus-chat-back"
                  aria-label="Back to inbox"
                  onClick={() =>
                    setSearchParams({})
                  }
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft size={20} />
                </button>

                <div>
                  <strong>
                    {selectedConversation?.product
                      ?.title || "Conversation"}
                  </strong>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      opacity: 0.65,
                    }}
                  >
                    CampusMart private chat
                  </p>
                </div>
              </div>
              
{/* PRODUCT PREVIEW */}
{selectedConversation?.product && (() => {
  const product = selectedConversation.product;

  const productId = getId(product);

  const image =
    product.images?.[0]?.url ||
    product.images?.[0] ||
    product.image?.url ||
    product.image ||
    null;

  return (
    <div
      style={{
        margin: "12px 16px",
        padding: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderRadius: 16,
        border: "1px solid var(--border, #e9ddf2)",
        background: "var(--card, transparent)",
      }}
    >
      {/* Product image */}
      <div
        style={{
          width: 76,
          height: 76,
          flexShrink: 0,
          borderRadius: 12,
          overflow: "hidden",
          background: "rgba(167,139,250,0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {typeof image === "string" && image ? (
          <img
            src={image}
            alt={product.title || "Product"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <ShoppingBag size={28} color="#a78bfa" />
        )}
      </div>

      {/* Product information */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong
          style={{
            display: "block",
            fontSize: 14,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {product.title || "Product"}
        </strong>

        <div
          style={{
            color: "#a78bfa",
            fontWeight: 800,
            fontSize: 18,
            margin: "5px 0",
          }}
        >
          {product.price != null
            ? `₹${Number(product.price).toLocaleString("en-IN")}`
            : "Price unavailable"}
        </div>

        {productId && (
          <Link
            to={`/product/${productId}`}
            style={{
              color: "#a78bfa",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            View listing ↗
          </Link>
        )}
      </div>
    </div>
  );
})()}

              {/* MESSAGES */}

              <div
                style={{
                  flex: 1,
                  padding: 20,
                  overflowY: "auto",
                  maxHeight: 460,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {chatLoading ? (
                  <p>Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p
                    style={{
                      textAlign: "center",
                      opacity: 0.65,
                    }}
                  >
                    Say hello! 👋
                  </p>
                ) : (
                  messages.map((message) => {
                    const mine =
                      getId(message.sender) ===
                      currentUserId;

                    return (
                      <div
                        key={getId(message)}
                        style={{
                          alignSelf: mine
                            ? "flex-end"
                            : "flex-start",
                          maxWidth: "80%",
                          padding: "11px 15px",
                          borderRadius: 16,
                          background: mine
                            ? "rgba(167,139,250,0.24)"
                            : "var(--bg, #f3f4f6)",
                          overflowWrap: "anywhere",
                        }}
                      >
                        <div>{message.text}</div>

                        <small
                          style={{
                            display: "block",
                            textAlign: "right",
                            marginTop: 5,
                            opacity: 0.55,
                            fontSize: 10,
                          }}
                        >
                          {formatTime(
                            message.createdAt
                          )}
                        </small>
                      </div>
                    );
                  })
                )}

                <div ref={bottomRef} />
              </div>

              {/* MESSAGE INPUT */}

              <form
                onSubmit={sendMessage}
                style={{
                  padding: 14,
                  borderTop:
                    "1px solid var(--border, #ddd)",
                  display: "flex",
                  gap: 10,
                }}
              >
                <input
                  value={text}
                  onChange={(event) =>
                    setText(event.target.value)
                  }
                  placeholder="Write a message..."
                  maxLength={2000}
                  aria-label="Write a message"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "12px 14px",
                    borderRadius: 14,
                    border:
                      "1px solid var(--border, #ddd)",
                    background: "transparent",
                    color: "inherit",
                  }}
                />

                <button
                  type="submit"
                  disabled={
                    sending ||
                    !text.trim() ||
                    chatLoading
                  }
                  style={{
                    border: "none",
                    borderRadius: 14,
                    padding: "0 18px",
                    background: "#a78bfa",
                    color: "#fff",
                    cursor: "pointer",
                    opacity: sending ? 0.6 : 1,
                  }}
                >
                  {sending ? (
                    <LoaderCircle size={19} />
                  ) : (
                    <Send size={19} />
                  )}
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {/* MOBILE RESPONSIVENESS */}

      <style>{`
        .campus-chat-back {
          display: none;
        }

        @media (max-width: 700px) {
          .campus-chat-layout {
            display: block !important;
          }

          .campus-chat-sidebar.chat-open {
            display: none;
          }

          .campus-chat-panel {
            display: none !important;
          }

          .campus-chat-panel.chat-open {
            display: flex !important;
          }

          .campus-chat-back {
            display: inline-flex;
          }

          .campus-chat-sidebar {
            min-height: 400px;
          }
        }
      `}</style>
    </div>
  );
}
