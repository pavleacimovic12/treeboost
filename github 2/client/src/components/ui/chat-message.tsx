import { Bot, User, ExternalLink } from "lucide-react";
import { ChatMessage } from "@shared/schema";
import { getFileIcon } from "@/components/ui/file-upload";

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessageComponent({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date));
  };

  return (
    <div className={`flex items-start space-x-4 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`flex-1 ${isUser ? "flex justify-end" : ""}`}>
        <div
          className={`rounded-lg p-4 max-w-2xl ${
            isUser
              ? "bg-primary text-white rounded-tr-none"
              : "bg-gray-100 text-gray-800 rounded-tl-none"
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
          

        </div>
        
        <div className={`mt-2 ${isUser ? "text-right" : ""}`}>
          <p className="text-xs text-gray-500">{formatTime(message.createdAt)}</p>
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-gray-600" />
        </div>
      )}
    </div>
  );
}
