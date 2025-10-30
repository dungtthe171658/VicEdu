import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { chatApi } from "../../api/chatApi";
import axios from "../../api/axios";
import type { ChatMessage } from "../../api/chatApi";
import { useAuth } from "../../hooks/useAuth";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Trash2, X, Send, Bot, User } from "lucide-react";
import { cn } from "../../lib/utils";

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const courseSlugCache = useRef<Map<string, string>>(new Map());
  const bookSlugCache = useRef<Map<string, string>>(new Map());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen]);

  // Xóa chat history khi user thay đổi (logout/login tài khoản khác)
  useEffect(() => {
    setMessages([]);
    setInputMessage("");
    courseSlugCache.current.clear();
    bookSlugCache.current.clear();
  }, [user?._id]);

  const loadChatHistory = async () => {
    try {
      const response = await chatApi.getChatHistory();
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await chatApi.sendMessage(inputMessage.trim());
      if (response.success) {
        const aiMsg = response.data.aiResponse;
        const normalized = await normalizeInternalLinks(aiMsg.content);
        setMessages((prev) => [...prev, { ...aiMsg, content: normalized }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Xin lỗi, có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await chatApi.clearChatHistory();
      setMessages([]);
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Convert internal ID links (/courses/<id>, /books/<id>) to slug links before displaying
  const normalizeInternalLinks = async (text: string): Promise<string> => {
    if (!text) return text;
    let result = text;

    // Courses: /courses/<ObjectId>
    const courseIdRe = /\/courses\/([a-f\d]{24})/gi;
    const courseIds = Array.from(
      new Set(Array.from(result.matchAll(courseIdRe)).map((m) => m[1]))
    );
    if (courseIds.length) {
      const pairs = await Promise.all(
        courseIds.map(async (id) => {
          const cached = courseSlugCache.current.get(id);
          if (cached) return [id, cached] as const;
          try {
            const res: {
              slug?: string;
              data?: { slug?: string; data?: { slug?: string } };
            } = await axios.get(`/courses/${id}`);
            const slug: string | undefined =
              res?.slug || res?.data?.slug || res?.data?.data?.slug;
            if (slug) {
              courseSlugCache.current.set(id, slug);
              return [id, slug] as const;
            }
          } catch {
            // Ignore errors
          }
          return [id, id] as const;
        })
      );
      pairs.forEach(([id, slug]) => {
        result = result.replace(
          new RegExp(`/courses/${id}`, "g"),
          `/courses/${slug}`
        );
      });
    }

    // Books: /books/<ObjectId>
    const bookIdRe = /\/books\/([a-f\d]{24})/gi;
    const bookIds = Array.from(
      new Set(Array.from(result.matchAll(bookIdRe)).map((m) => m[1]))
    );
    if (bookIds.length) {
      const pairs = await Promise.all(
        bookIds.map(async (id) => {
          const cached = bookSlugCache.current.get(id);
          if (cached) return [id, cached] as const;
          try {
            const res: {
              slug?: string;
              data?: { slug?: string; data?: { slug?: string } };
            } = await axios.get(`/books/${id}`);
            const slug: string | undefined =
              res?.slug || res?.data?.slug || res?.data?.data?.slug;
            if (slug) {
              bookSlugCache.current.set(id, slug);
              return [id, slug] as const;
            }
          } catch {
            // Ignore errors
          }
          return [id, id] as const;
        })
      );
      pairs.forEach(([id, slug]) => {
        result = result.replace(
          new RegExp(`/books/${id}`, "g"),
          `/books/${slug}`
        );
      });
    }

    return result;
  };

  // Render AI text with basic Markdown: [text](url), **bold**, *italic*, URLs, and line breaks
  const renderFormatted = (text: string) => {
    const linkMd = /\[([^\]]+)\]\(([^)]+)\)/g;
    const urlRe = /(https?:\/\/[^\s]+)/g;

    const renderInline = (segment: string, keyPrefix: string) => {
      const partsBold = segment.split("**");
      const nodesBold: React.ReactNode[] = [];
      partsBold.forEach((p, i) => {
        if (i % 2 === 1) {
          nodesBold.push(<strong key={`${keyPrefix}-b-${i}`}>{p}</strong>);
        } else {
          const partsIt = p.split("*");
          partsIt.forEach((pp, j) => {
            const isEm = j % 2 === 1;
            // Detect internal app paths like /courses/..., /books/..., etc., and external URLs
            const internalRe = /(\/[A-Za-z0-9_\-/]+(?:\?[A-Za-z0-9_\-=&%]+)*)/g;
            const partsInt = pp.split(internalRe);
            const collected: React.ReactNode[] = [];
            partsInt.forEach((seg, k) => {
              if (seg && seg.trim().startsWith("/")) {
                collected.push(
                  <Link
                    key={`${keyPrefix}-in-${i}-${j}-${k}`}
                    to={seg}
                    className="inline-link"
                  >
                    {seg}
                  </Link>
                );
              } else {
                const urlSplit = seg.split(urlRe);
                urlSplit.forEach((us, m) => {
                  if (/^https?:\/\//.test(us)) {
                    collected.push(
                      <a
                        key={`${keyPrefix}-u-${i}-${j}-${k}-${m}`}
                        href={us}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {us}
                      </a>
                    );
                  } else {
                    collected.push(
                      <React.Fragment
                        key={`${keyPrefix}-t-${i}-${j}-${k}-${m}`}
                      >
                        {us}
                      </React.Fragment>
                    );
                  }
                });
              }
            });
            const urlNodes = collected;
            if (isEm) {
              nodesBold.push(
                <em key={`${keyPrefix}-e-${i}-${j}`}>{urlNodes}</em>
              );
            } else {
              nodesBold.push(
                <React.Fragment key={`${keyPrefix}-n-${i}-${j}`}>
                  {urlNodes}
                </React.Fragment>
              );
            }
          });
        }
      });
      return nodesBold;
    };

    const makeNodesFromMdLinks = (input: string, keyPrefix: string) => {
      const nodes: React.ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      linkMd.lastIndex = 0;
      while ((match = linkMd.exec(input)) !== null) {
        const [full, label, href] = match;
        const start = match.index;
        if (start > lastIndex) {
          nodes.push(
            <React.Fragment key={`${keyPrefix}-pre-${start}`}>
              {renderInline(
                input.slice(lastIndex, start),
                `${keyPrefix}-pre-${start}`
              )}
            </React.Fragment>
          );
        }
        const isInternal = href.startsWith("/");
        if (isInternal) {
          nodes.push(
            <Link
              key={`${keyPrefix}-link-${start}`}
              to={href}
              className="inline-link"
            >
              {label}
            </Link>
          );
        } else {
          nodes.push(
            <a
              key={`${keyPrefix}-alink-${start}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {label}
            </a>
          );
        }
        lastIndex = start + full.length;
      }
      if (lastIndex < input.length) {
        nodes.push(
          <React.Fragment key={`${keyPrefix}-tail`}>
            {renderInline(input.slice(lastIndex), `${keyPrefix}-tail`)}
          </React.Fragment>
        );
      }
      return nodes;
    };

    const lines = text.split(/\r?\n/);
    return (
      <div className="formatted-text">
        {lines.map((line, idx) => (
          <div key={`l-${idx}`} className="formatted-line">
            {makeNodesFromMdLinks(line, `md-${idx}`)}
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl h-[600px] mx-4 shadow-2xl animate-slide-up flex flex-col">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">VudeicAI</h3>
              <p className="text-sm text-muted-foreground">Đang hoạt động</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-semibold mb-2">
                Chào mừng đến với VudeicAI!
              </h4>
              <p className="text-muted-foreground">
                Tôi có thể giúp bạn:
                {user?.role === "admin" ? (
                  <>
                    <br />• Quản lý hệ thống và người dùng
                    <br />• Cập nhật thông tin khóa học
                    <br />• Xem thống kê và báo cáo
                  </>
                ) : (
                  <>
                    <br />• Tìm khóa học phù hợp
                    <br />• Gợi ý sách hỗ trợ học tập
                    <br />• Trả lời câu hỏi về nội dung
                  </>
                )}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-3 animate-fade-in",
                  message.role === "user"
                    ? "flex-row-reverse space-x-reverse"
                    : ""
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2 break-words whitespace-pre-wrap",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="text-sm leading-relaxed">
                    {renderFormatted(message.content)}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex items-start space-x-3 animate-fade-in">
              <div className="w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex items-end space-x-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn của bạn..."
              className="min-h-[44px] max-h-[140px] resize-none flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
              className="h-11 w-11"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatWidget;
