/**
 * NeuralDoc Chat Interface - Enterprise Document Intelligence Platform
 * 
 * This is the main chat interface for NeuralDoc, an enterprise document intelligence platform
 * that enables users to upload documents and engage in neural-powered conversations about their content.
 * 
 * Key Features:
 * - Advanced document processing (PDF, DOCX, Excel, images with OCR, web content)
 * - NeuralDoc-powered semantic understanding and chat responses
 * - Real-time document processing status updates
 * - Multilingual support (Serbian Cyrillic/Latin, English)
 * - Source attribution for every neural response
 * - Intelligent file management with drag-and-drop support
 * 
 * Architecture:
 * - React Query for efficient server state management and real-time updates
 * - TypeScript for type safety and better developer experience
 * - Responsive design with mobile-first approach
 * - Semantic search using NeuralDoc embeddings for contextual document retrieval
 */

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Menu, X, Send, Trash2, Info, Paperclip, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { FileList } from "@/components/ui/file-list";
import { ChatMessageComponent } from "@/components/ui/chat-message";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Document, ChatMessage } from "@shared/schema";

/**
 * Main Chat Component - The Heart of NeuralDoc
 * 
 * This component orchestrates the entire document-intelligence chat experience:
 * 1. Document Upload & Management
 * 2. Real-time Processing Status
 * 3. AI-Powered Chat Interface
 * 4. Source Attribution & Context Awareness
 */
export default function Chat() {
  // UI State Management for Responsive Design
  const [sidebarOpen, setSidebarOpen] = useState(false);     // Mobile sidebar toggle
  const [message, setMessage] = useState("");               // Current chat input message
  const [isTyping, setIsTyping] = useState(false);          // AI response loading state
  
  // React refs for smooth UX interactions
  const messagesEndRef = useRef<HTMLDivElement>(null);      // Auto-scroll to latest message
  const textareaRef = useRef<HTMLTextAreaElement>(null);    // Focus management for input
  
  // Responsive design and notification system
  const isMobile = useIsMobile();                          // Mobile-first responsive design
  const { toast } = useToast();                            // User feedback system
  const queryClient = useQueryClient();                    // React Query cache management

  /**
   * Real-time Document Processing Status System
   * 
   * This query implements aggressive polling to provide real-time updates on document
   * processing status. Documents go through multiple stages:
   * 1. Upload confirmation
   * 2. Text extraction (PDF, DOCX, OCR for images)
   * 3. Content chunking for optimal AI processing
   * 4. NeuralDoc embedding generation for semantic search
   * 5. Database storage and indexing
   * 
   * The aggressive polling ensures users see immediate status changes during processing.
   */
  const { data: documents = [], isLoading: documentsLoading, refetch: refetchDocuments } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    refetchInterval: 2000,     // Poll every 2 seconds for real-time updates
    staleTime: 0,             // Always refetch to ensure fresh processing status
    gcTime: 0,                // Don't cache old data - always show current state
    refetchOnMount: true,     // Immediate refresh when component mounts
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });

  // Debug logging for documents (disabled in production)
  // React.useEffect(() => {
  //   console.log(`Frontend documents state: ${documents.length} documents`);
  // }, [documents]);

  /**
   * Chat History Management
   * 
   * Maintains persistent conversation history for context-aware AI responses.
   * The system remembers the last 8 conversation pairs to provide coherent,
   * contextual responses that build upon previous interactions.
   */
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
  });

  /**
   * Advanced Document Upload System
   * 
   * Handles concurrent upload of multiple documents with advanced processing pipeline:
   * 
   * Processing Pipeline:
   * 1. File validation (type, size, format)
   * 2. Secure upload with progress tracking
   * 3. Multi-format text extraction:
   *    - PDF: Advanced parsing with fallback methods
   *    - DOCX: Mammoth.js for rich text extraction
   *    - Excel/CSV: Structured data processing
   *    - Images: Tesseract.js OCR with Neural Vision (optional)
   *    - Web URLs: Content scraping and parsing
   * 4. Intelligent text chunking (up to 6000 chars for optimal AI processing)
   * 5. NeuralDoc embedding generation for semantic search
   * 6. Database storage with metadata indexing
   * 
   * Supports batch uploads (up to 10 files, 100MB each) with concurrent processing.
   */
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      console.log(`NeuralDoc: Starting upload of ${files.length} files`);
      const promises = Array.from(files).map(async (file, index) => {
        console.log(`NeuralDoc: Uploading file ${index + 1}/${files.length}: ${file.name} (${file.type})`);
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiRequest("POST", "/api/documents/upload", formData);
        const result = await response.json();
        console.log(`NeuralDoc: File ${file.name} upload completed:`, result);
        return result;
      });
      return Promise.all(promises);
    },
    onSuccess: (results) => {
      console.log(`NeuralDoc: All ${results.length} files uploaded successfully`);
      // Force immediate cache refresh for real-time UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.refetchQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Files uploaded successfully",
        description: `${results.length} document(s) are being processed and will be available for chat soon.`,
      });
    },
    onError: (error: any) => {
      console.error("NeuralDoc: Upload failed:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Web Content Extraction System
   * 
   * Advanced web content scraping and processing for URL-based documents:
   * 
   * Features:
   * - Intelligent content extraction from web pages
   * - Domain-wide content crawling capabilities
   * - HTML parsing with content prioritization
   * - Automatic text cleaning and formatting
   * - Social media and dynamic content handling
   * - Same processing pipeline as uploaded documents
   * 
   * This enables users to chat with content from websites, articles, and web resources.
   */
  const urlExtractMutation = useMutation({
    mutationFn: async (url: string) => {
      console.log(`NeuralDoc: Starting URL extraction for: ${url}`);
      const response = await apiRequest("POST", "/api/documents/extract-url", { url });
      const result = await response.json();
      console.log(`NeuralDoc: URL extraction initiated:`, result);
      return result;
    },
    onSuccess: (result) => {
      console.log(`NeuralDoc: URL extraction request successful for: ${result.originalName}`);
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "URL extraction started",
        description: `Content from ${result.originalName} is being processed and will be available for chat soon.`,
      });
    },
    onError: (error: any) => {
      console.error("NeuralDoc: URL extraction failed:", error);
      toast({
        title: "URL extraction failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Document Deletion System
   * 
   * Secure document removal with complete cleanup:
   * - Removes document from storage
   * - Deletes all associated embeddings
   * - Cleans up processed file data
   * - Updates UI in real-time
   * 
   * Ensures no orphaned data remains in the system.
   */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "File deleted",
        description: "The document has been removed from your chat.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Multilingual Support System
   * 
   * NeuralDoc supports Serbian (Cyrillic & Latin scripts) and English with automatic
   * language detection and script-matching response generation.
   */
  const [language, setLanguage] = useState<string>("auto");

  /**
   * AI-Powered Message Processing System
   * 
   * This mutation handles the core neural functionality of NeuralDoc:
   * 
   * Processing Pipeline:
   * 1. Language detection and preprocessing
   * 2. Semantic search across document embeddings
   * 3. Context retrieval from relevant document chunks
   * 4. Neural language model integration for response generation
   * 5. Source attribution and citation linking
   * 6. Multilingual response formatting
   * 
   * Features:
   * - Document-focused responses (no general knowledge)
   * - Maintains conversation context (last 8 pairs)
   * - Serbian/English bilingual support
   * - Source citation for every response
   * - Real-time typing indicators
   */
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/chat/messages", { 
        content, 
        language: language  // Pass language preference for response formatting
      });
      return response.json();
    },
    onMutate: () => {
      setIsTyping(true);  // Show AI thinking indicator
    },
    onSuccess: () => {
      // Refresh chat history and reset input
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setMessage("");
      setIsTyping(false);
    },
    onError: (error: any) => {
      setIsTyping(false);
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Chat History Management
   * 
   * Provides users with the ability to clear conversation history while maintaining
   * document availability. This resets the conversation context but preserves all
   * uploaded documents and their processed embeddings.
   */
  const clearChatMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/chat/messages");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      toast({
        title: "Chat cleared",
        description: "All messages have been removed.",
      });
    },
  });

  /**
   * User Experience Enhancement Effects
   * 
   * These effects provide smooth, responsive interactions for optimal user experience.
   */
  
  // Dynamic textarea resizing for long messages
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [message]);

  // Auto-scroll to latest messages for continuous conversation flow
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Mobile-responsive sidebar management
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isMobile && sidebarOpen) {
        const sidebar = document.getElementById("sidebar");
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setSidebarOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, sidebarOpen]);

  /**
   * Message Submission Handler
   * 
   * Processes user input and initiates AI response generation with validation.
   */
  const handleSendMessage = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const completedDocuments = documents.filter(doc => doc.status === "completed");
  const statusText = completedDocuments.length > 0 
    ? `${completedDocuments.length} document${completedDocuments.length !== 1 ? "s" : ""} ready`
    : "No documents ready";

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        id="sidebar"
        className={`
          w-80 bg-surface border-r border-gray-200 flex flex-col transition-all duration-300
          ${isMobile ? "absolute z-10 h-full" : ""}
          ${isMobile && !sidebarOpen ? "-translate-x-full" : ""}
        `}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Document Chat</h1>
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">Upload and chat with your documents</p>
          
          {/* Language Selector */}
          <div className="mt-4">
            <label className="text-xs font-medium text-gray-600 mb-2 block flex items-center">
              <Globe className="w-3 h-3 mr-1" />
              Language / Jezik
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">🌐 Auto-detect</SelectItem>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="sr">🇷🇸 Srpski / Српски</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="p-6 border-b border-gray-200">
          <FileUpload
            onFileUpload={(files) => uploadMutation.mutate(files)}
            onUrlUpload={(url) => urlExtractMutation.mutate(url)}
            uploading={uploadMutation.isPending || urlExtractMutation.isPending}
          />
        </div>

        {/* Uploaded Files List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
              <span className="mr-2">📁</span>
              Uploaded Files
              <span className="ml-auto bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {documents.length}
              </span>
            </h3>
            
            <FileList
              files={documents}
              onDeleteFile={(id) => deleteMutation.mutate(id)}
            />
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center text-xs text-gray-500">
            <Info className="w-3 h-3 mr-2" />
            <span>Files are processed and embedded for chat</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-surface border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="mr-4 p-2"
                >
                  <Menu className="w-4 h-4" />
                </Button>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Chat Assistant</h2>
                <p className="text-sm text-gray-500">Ask questions about your uploaded documents</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span>{statusText}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearChatMutation.mutate()}
                disabled={clearChatMutation.isPending}
                title="Clear conversation"
                className="p-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && !messagesLoading && (
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 neuraldoc-gradient rounded-full flex items-center justify-center neuraldoc-shadow">
                <span className="text-white text-lg">🧠</span>
              </div>
              <div className="flex-1">
                <div className="ai-message rounded-lg rounded-tl-none p-5 max-w-3xl">
                  <div className="flex items-center space-x-2 mb-3">
                    <h3 className="font-semibold neuraldoc-text-gradient text-lg">NeuralDoc Intelligence</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Advanced AI</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Welcome to <strong>NeuralDoc</strong>, your enterprise document intelligence platform! 🚀
                    <br /><br />
                    I can help you:
                    <br />• <strong>Analyze documents</strong> in multiple formats (PDF, DOCX, Excel, images)
                    <br />• <strong>Answer questions</strong> with precise source citations
                    <br />• <strong>Extract insights</strong> using advanced semantic search
                    <br />• <strong>Process content</strong> in Serbian (Cyrillic/Latin) and English
                    <br /><br />
                    Upload your documents using the sidebar to get started with intelligent document analysis.
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center space-x-2">
                  <span>🕒 Just now</span>
                  <span>•</span>
                  <span>Powered by NeuralDoc AI & Advanced NLP</span>
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessageComponent key={msg.id} message={msg} />
          ))}

          {isTyping && (
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 neuraldoc-gradient rounded-full flex items-center justify-center neuraldoc-shadow">
                <span className="text-white text-lg">🧠</span>
              </div>
              <div className="flex-1">
                <div className="ai-message rounded-lg rounded-tl-none p-4 max-w-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                    <span className="text-sm font-medium neuraldoc-text-gradient">NeuralDoc is analyzing...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="border-t border-gray-200 bg-surface p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask NeuralDoc anything about your documents... 🧠"
                    className="resize-none pr-12 border-2 focus:border-blue-400 transition-colors"
                    rows={1}
                    disabled={sendMessageMutation.isPending}
                  />
                  <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Attach file"
                      onClick={() => document.getElementById("file-upload")?.click()}
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="p-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Press Enter to send, Shift+Enter for new line</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>{message.length}</span>
                <span>/</span>
                <span>2000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
