"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Moon,
  Sun,
  Send,
  MessageCircle,
  Paperclip,
  Bot,
  User,
  Upload,
  Trash2,
  Sparkles,
  FileCheck,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  source?: string;
}

export default function ChatInterface() {
  const [isDark, setIsDark] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const shouldBeDark =
      savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    setIsDark(shouldBeDark);

    document.documentElement.setAttribute(
      "data-theme",
      shouldBeDark ? "dark" : "light"
    );
  }, []);

  // Handle theme changes
  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [isDark]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [question]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const supportedTypes = [
      "application/pdf",
      "text/csv",
      "image/png",
      "image/jpeg",
      "image/bmp",
      "image/tiff",
    ];

    if (!supportedTypes.includes(selectedFile.type)) {
      alert("Please select a supported file (PDF, CSV, PNG, JPG, BMP, TIFF).");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setPdfText(data.pdfText);
      setChat((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          text: `Perfect! I've successfully processed "${file.name}". The document is now ready for analysis. What would you like to know about it?`,
          timestamp: new Date(),
        },
      ]);

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    if (!pdfText) {
      alert("Please upload a PDF first.");
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: question,
      timestamp: new Date(),
    };

    setChat((prev) => [...prev, userMessage]);
    setQuestion("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, pdfText }),
      });

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text:
          data.answer ||
          data.error ||
          "I couldn't find an answer to your question.",
        source: data.source,
        timestamp: new Date(),
      };

      setChat((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setChat((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "Sorry, I encountered an error while processing your question. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAsk();
    }
  };

  const removeFile = () => {
    setFile(null);
    setPdfText(null);
    setChat([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="app-container">
      <div className="max-w-5xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white header shadow-sm border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="brand-icon flex items-center justify-center w-10 h-10 rounded-xl">
                <MessageCircle size={24} />
              </div>
              <div>
                <h1
                  className="text-xl font-bold m-0"
                  style={{ color: "var(--text-primary)" }}
                >
                  PDF Chat Assistant
                </h1>
                <p
                  className="text-sm m-0"
                  style={{ color: "var(--text-secondary)" }}
                >
                  AI-powered document analysis
                </p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="theme-toggle flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-all duration-200"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Compact File Upload Section */}
        <div className="upload-section px-6 py-3 rounded-b">
          {pdfText ? (
            <div className="file-ready flex items-center justify-between p-3 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="file-icon success flex items-center justify-center w-8 h-8 rounded-lg">
                  <FileCheck size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold m-0">Document Ready</h3>
                  <p
                    className="text-xs m-0"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    PDF processed • Ready for questions
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="remove-btn flex items-center justify-center w-8 h-8 bg-transparent border-0 rounded-lg cursor-pointer transition-all duration-200"
                aria-label="Remove file"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.png,.jpg,.jpeg,.bmp,.tiff"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={isUploading}
              />

              <label
                htmlFor="file-upload"
                className="upload-label flex-1 flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200"
              >
                <div className="upload-icon flex items-center justify-center w-8 h-8 rounded-lg">
                  <Paperclip size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-sm font-medium m-0 truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {file ? file.name : "Choose a file (PDF, CSV, Image)"}
                  </h3>
                  <p
                    className="text-xs m-0 truncate"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {file ? formatFileSize(file.size) : "Click to browse"}
                  </p>
                </div>
              </label>

              {file && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="upload-btn flex items-center gap-2 px-4 py-2 border-0 rounded-lg font-medium cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Upload size={14} />
                  <span className="hidden sm:inline">
                    {isUploading ? "Processing..." : "Upload"}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="chat-area flex-1 overflow-hidden">
          <div
            ref={chatContainerRef}
            className="messages-container h-full overflow-y-auto p-6 flex flex-col gap-6"
          >
            {chat.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <div className="empty-icon flex items-center justify-center w-16 h-16 rounded-full">
                  <Sparkles size={32} />
                </div>
                <h2
                  className="text-2xl font-semibold m-0"
                  style={{ color: "var(--text-primary)" }}
                >
                  Ready to analyze your document
                </h2>
                <p
                  className="text-base m-0 max-w-md leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Upload a PDF and I&apos;ll help you understand its content,
                  answer questions, and provide detailed insights.
                </p>
              </div>
            ) : (
              <>
                {chat.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[70%] ${
                      msg.role === "user"
                        ? "self-end flex-row-reverse"
                        : "self-start"
                    }`}
                  >
                    <div
                      className={`message-avatar flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0`}
                    >
                      {msg.role === "user" ? (
                        <User size={16} />
                      ) : (
                        <Bot size={16} />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div
                        className={`message-bubble px-4 py-3 rounded-2xl text-sm leading-relaxed`}
                      >
                        <p className="m-0">{msg.text}</p>
                        {msg.source && (
                          <div
                            className="mt-3 p-3 rounded-lg border"
                            style={{
                              background: "rgba(0, 0, 0, 0.1)",
                              borderColor: "rgba(255, 255, 255, 0.2)",
                            }}
                          >
                            <h4 className="text-xs font-semibold m-0 mb-2 opacity-80">
                              Source Context:
                            </h4>
                            <pre className="text-xs font-mono whitespace-pre-wrap m-0 opacity-90">
                              {msg.source}
                            </pre>
                          </div>
                        )}
                      </div>
                      <div
                        className={`text-xs px-1 ${
                          msg.role === "user" ? "text-right" : "text-left"
                        }`}
                        style={{ color: "var(--text-muted)" }}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 max-w-[70%] self-start">
                    <div className="message-avatar flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0">
                      <Bot size={16} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="message-bubble px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-3">
                        <div className="typing-indicator flex gap-1">
                          <span className="w-2 h-2 rounded-full"></span>
                          <span className="w-2 h-2 rounded-full"></span>
                          <span className="w-2 h-2 rounded-full"></span>
                        </div>
                        <span className="loading-text text-sm">
                          Analyzing...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Input Section */}
        <div className="input-section p-6 rounded">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                pdfText
                  ? "Ask me anything about your document..."
                  : "Upload a PDF first to start chatting"
              }
              className="message-input flex-1 min-h-[2.75rem] max-h-[7.5rem] px-4 py-3 rounded-xl text-sm leading-relaxed resize-none outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!pdfText || isLoading}
              rows={1}
            />
            <button
              onClick={handleAsk}
              disabled={!question.trim() || !pdfText || isLoading}
              className="send-btn flex items-center justify-center w-11 h-11 border-0 rounded-xl cursor-pointer transition-all duration-200 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
