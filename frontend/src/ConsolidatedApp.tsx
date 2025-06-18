
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, MessageSquare, Loader, Sparkles, Upload, X, CheckCircle, AlertCircle, FileText, RefreshCw } from "lucide-react";

// API Configuration
const API_BASE_URL =  'http://localhost:5000';

// Types
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  status: 'uploading' | 'processed' | 'error';
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  sources?: DocumentSource[];
}

export interface DocumentSource {
  source?: string;
  page?: number;
  content?: string;
}

export interface APIResponse {
  answer: string;
  sources: DocumentSource[];
}

// API Functions
const uploadFileToBackend = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Upload failed';
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

const sendMessageToBackend = async (question: string): Promise<APIResponse> => {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Failed to get response';
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

const clearChatMemory = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/clear`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Failed to clear memory';
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

// Basic UI Components
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "ghost" | "outline";
    size?: "default" | "sm";
  }
>(({ className = "", variant = "default", size = "default", ...props }, ref) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50";
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    ghost: "hover:bg-gray-100 hover:text-gray-900",
    outline: "border border-gray-300 bg-white hover:bg-gray-50"
  };
  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3"
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => (
  <textarea
    className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    ref={ref}
    {...props}
  />
));

Textarea.displayName = "Textarea";

// Utility Functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string): string => {
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('text')) return '📋';
  if (type.includes('image')) return '🖼️';
  return '📁';
};

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Header Component
const Header = React.memo(({ onClearChat }: { onClearChat: () => void }) => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur-sm opacity-75"></div>
              <div className="relative p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <Bot className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                DocuChat AI
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Intelligent Document Assistant
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClearChat}
            className="gap-2"
            aria-label="Clear chat history"
          >
            <RefreshCw className="h-4 w-4" />
            Clear Chat
          </Button>
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

// File Upload Component
interface DocumentUploadProps {
  onFileUpload: (files: File[]) => void;
  uploadedFiles: UploadedFile[];
  onDeleteFile: (fileId: string) => void;
  isUploading: boolean;
}

const DocumentUpload = React.memo(({ 
  onFileUpload, 
  uploadedFiles, 
  onDeleteFile, 
  isUploading 
}: DocumentUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.includes('pdf') || 
      file.type.includes('document') || 
      file.type.includes('text') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.rtf') ||
      file.name.endsWith('.odt')
    );
    
    if (files.length > 0) {
      onFileUpload(files);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileUpload(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileUpload]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleUploadClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleUploadClick();
          }
        }}
        aria-label="Upload documents by clicking or dragging files here"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.rtf,.odt"
          aria-label="File input for document upload"
        />
        
        {isUploading ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader className="h-12 w-12 text-blue-500 animate-spin" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">Processing documents...</p>
              <p className="text-sm text-gray-500">Please wait while we analyze your files</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className={`p-4 rounded-full transition-colors duration-300 ${
                isDragOver ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Upload className={`h-8 w-8 transition-colors duration-300 ${
                  isDragOver ? 'text-blue-500' : 'text-gray-400'
                }`} />
              </div>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragOver ? 'Drop your files here' : 'Upload your documents'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supports PDF, DOC, DOCX, TXT files
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Documents ({uploadedFiles.length})
          </h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-lg" role="img" aria-label={`${file.type} file`}>
                    {getFileIcon(file.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.uploadedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(file.status)}
                    <span className="text-xs text-gray-500 capitalize">{file.status}</span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteFile(file.id)}
                  className="text-gray-400 hover:text-red-500 h-8 w-8 p-0"
                  disabled={file.status === 'uploading'}
                  aria-label={`Delete ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length === 0 && !isUploading && (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No documents uploaded yet</p>
          <p className="text-xs text-gray-400 mt-1">Upload some documents to start chatting</p>
        </div>
      )}
    </div>
  );
});

DocumentUpload.displayName = "DocumentUpload";

// Chat Interface Component
interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isGenerating: boolean;
  hasDocuments: boolean;
  error: string | null;
}

const ChatInterface = React.memo(({ 
  messages, 
  onSendMessage, 
  isGenerating, 
  hasDocuments, 
  error 
}: ChatInterfaceProps) => {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isGenerating && hasDocuments) {
      onSendMessage(inputMessage.trim());
      setInputMessage("");
      // Focus back to textarea after sending
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [inputMessage, isGenerating, hasDocuments, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
  }, []);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50/50">
      <div className="p-6 border-b border-gray-100/80 bg-white/70 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur-sm opacity-20"></div>
            <div className="relative p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              AI Assistant
            </h2>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              {hasDocuments 
                ? "Ready to answer questions about your documents" 
                : "Upload documents to start an intelligent conversation"
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${hasDocuments ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`}></div>
            <span className="text-xs text-gray-500 font-medium">
              {hasDocuments ? 'Ready' : 'Waiting'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl\" role="alert">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm font-medium text-red-800">Error</p>
              </div>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full blur-xl opacity-50"></div>
                <div className="relative w-20 h-20 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full flex items-center justify-center border border-blue-100/50">
                  <Bot className="h-10 w-10 text-blue-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Welcome to DocuChat AI
              </h3>
              <p className="text-gray-500 max-w-md leading-relaxed">
                {hasDocuments 
                  ? "Your documents are processed and ready! Start by asking me any questions about their content and I'll provide detailed insights."
                  : "Upload your documents first, then I'll be ready to provide intelligent answers and insights about their content."
                }
              </p>
              {hasDocuments && (
                <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium">💡 Try asking questions like:</p>
                  <ul className="mt-2 text-xs text-blue-500 space-y-1">
                    <li>• "What are the main topics covered?"</li>
                    <li>• "Can you summarize the key points?"</li>
                    <li>• "What specific details about [topic]?"</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-5 w-5 text-white" />
                    ) : (
                      <Bot className="h-5 w-5 text-white" />
                    )}
                  </div>
                  
                  <div className={`flex-1 max-w-4xl ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-4 rounded-2xl shadow-sm ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-100'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 ">
                          <p className="text-xs text-gray-500 font-medium mb-2">Sources:</p>
                          <div className="space-y-1 flex flex-row flex-wrap">
                            {message.sources.map((source, index) => (
                              <div key={index} className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                                {source.source && <span className="font-medium">{source.source}</span>}
                                {source.page && <span className="ml-2">Page {source.page}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 px-3 flex items-center gap-1">
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <time dateTime={message.timestamp.toISOString()}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </p>
                  </div>
                </div>
              ))}
              
              {isGenerating && (
                <div className="flex gap-4 animate-fade-in">
                  <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-sm font-medium">AI is analyzing your documents...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-6 border-t border-gray-100/80 bg-white/70 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={hasDocuments ? "Ask anything about your documents..." : "Upload documents first to start chatting"}
              disabled={!hasDocuments || isGenerating}
              className="min-h-[60px] max-h-32 resize-none pr-14 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm rounded-xl"
              aria-label="Message input"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputMessage.trim() || !hasDocuments || isGenerating}
              className="absolute bottom-3 right-3 h-8 w-8 p-0 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {!hasDocuments && (
            <div className="flex items-center gap-2 p-3 bg-amber-50/80 border border-amber-200 rounded-xl" role="status">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <p className="text-sm text-amber-700 font-medium">
                Please upload and process documents to enable the chat functionality
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
});

ChatInterface.displayName = "ChatInterface";

// Main App Component
const DocuChatApp = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    // Create initial file entries
    const newFiles: UploadedFile[] = files.map(file => ({
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      status: 'uploading'
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload files to backend
    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileId = newFiles[index].id;
        try {
          await uploadFileToBackend(file);
          // Update file status to processed
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === fileId 
                ? { ...f, status: 'processed' as const }
                : f
            )
          );
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          // Update file status to error
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === fileId 
                ? { ...f, status: 'error' as const }
                : f
            )
          );
          throw error;
        }
      });

      await Promise.allSettled(uploadPromises);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    setError(null);

    try {
      const response = await sendMessageToBackend(message);
      
      const botMessage: ChatMessage = {
        id: generateId(),
        type: 'bot',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources
      };

      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      setError(errorMessage);
      
      const botMessage: ChatMessage = {
        id: generateId(),
        type: 'bot',
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, botMessage]);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleDeleteFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  const handleClearChat = useCallback(async () => {
    try {
      await clearChatMemory();
      setChatMessages([]);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to clear chat: ${errorMessage}`);
    }
  }, []);

  const hasProcessedDocuments = uploadedFiles.some(file => file.status === 'processed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header onClearChat={handleClearChat} />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-12rem)]">
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 h-full overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
                    <p className="text-sm text-gray-500">
                      {uploadedFiles.length} files • {uploadedFiles.filter(f => f.status === 'processed').length} processed
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 h-full overflow-y-auto">
                <DocumentUpload
                  onFileUpload={handleFileUpload}
                  uploadedFiles={uploadedFiles}
                  onDeleteFile={handleDeleteFile}
                  isUploading={isUploading}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 h-full">
              <ChatInterface
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isGenerating={isGenerating}
                hasDocuments={hasProcessedDocuments}
                error={error}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocuChatApp;