import { Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFileIcon, getFileIconColor } from "@/components/ui/file-upload";
import { Document } from "@shared/schema";

interface FileListProps {
  files: Document[];
  onDeleteFile: (id: string) => void;
}

export function FileList({ files, onDeleteFile }: FileListProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "processing":
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Processed";
      case "processing":
        return "Processing...";
      case "failed":
        return "Failed";
      default:
        return "Pending";
    }
  };

  return (
    <div className="space-y-3">
      {files.map((file) => {
        const IconComponent = getFileIcon(file.mimeType);
        const iconColors = getFileIconColor(file.mimeType);
        
        return (
          <div
            key={file.id}
            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${iconColors}`}>
              <IconComponent className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate" title={file.originalName}>
                {file.originalName}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span>{getStatusText(file.status)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {getStatusIcon(file.status)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteFile(file.id)}
                className="text-gray-400 hover:text-gray-600 p-1 h-auto"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        );
      })}
      
      {files.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No files uploaded yet</p>
          <p className="text-xs mt-1">Upload documents to start chatting</p>
        </div>
      )}
    </div>
  );
}
