/**
 * wAIonix File Upload Component - Advanced Document Processing Interface
 * 
 * This component provides a sophisticated file upload experience with multiple input methods:
 * - Drag-and-drop interface for intuitive file selection
 * - Traditional file browser integration
 * - URL/web content extraction capabilities
 * - Advanced file validation and type checking
 * - Real-time upload progress and feedback
 * 
 * Supported Document Types:
 * - PDF documents (with advanced text extraction)
 * - Microsoft Word documents (DOCX)
 * - Excel spreadsheets (XLSX, XLS)
 * - CSV data files
 * - Plain text files (TXT)
 * - Images with OCR (JPG, JPEG, PNG)
 * - Web content via URL extraction
 * 
 * File Processing Features:
 * - Batch upload support (up to 10 files simultaneously)
 * - 100MB per file size limit for enterprise-grade documents
 * - Intelligent MIME type detection with fallback to file extensions
 * - Real-time validation feedback for optimal user experience
 */

import { useCallback, useState } from "react";
import { Upload, X, FileText, FileSpreadsheet, Link, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// TypeScript interface for component props with clear documentation
interface FileUploadProps {
  onFileUpload: (files: FileList) => void;     // Callback for file uploads
  onUrlUpload?: (url: string) => void;         // Optional URL extraction callback
  uploading?: boolean;                         // Loading state indicator
}

/**
 * Advanced File Upload Component
 * 
 * Orchestrates the entire file upload experience with intelligent validation,
 * drag-and-drop support, and seamless integration with wAIonix processing pipeline.
 */
export function FileUpload({ onFileUpload, onUrlUpload, uploading = false }: FileUploadProps) {
  // Component state for interactive UI elements
  const [dragActive, setDragActive] = useState(false);      // Visual feedback for drag-and-drop
  const [showUrlInput, setShowUrlInput] = useState(false);  // Toggle URL input interface
  const [urlValue, setUrlValue] = useState('');             // URL input field value
  const { toast } = useToast();                            // User notification system

  /**
   * Drag and Drop Event Handlers
   * 
   * Provides smooth, responsive drag-and-drop experience with visual feedback.
   * Prevents default browser behavior and manages UI state for optimal UX.
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();    // Prevent default browser file handling
    e.stopPropagation();   // Stop event bubbling
    
    // Visual feedback based on drag state
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);   // Show active drop zone styling
    } else if (e.type === "dragleave") {
      setDragActive(false);  // Remove active styling when drag leaves
    }
  }, []);

  /**
   * File Drop Handler
   * 
   * Processes dropped files and initiates the validation and upload pipeline.
   * Extracts files from the drag event and passes them to validation system.
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);  // Reset visual state

    // Extract dropped files and initiate processing
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = e.dataTransfer.files;
      validateAndUpload(files);  // Start validation and upload pipeline
    }
  }, []);

  /**
   * File Input Change Handler
   * 
   * Handles traditional file browser selection and initiates the same
   * validation pipeline as drag-and-drop uploads.
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    // Process files selected through file browser
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files);  // Same validation pipeline as drop
    }
  }, []);

  /**
   * Advanced File Validation System
   * 
   * Comprehensive validation pipeline that ensures optimal processing:
   * 1. File count validation (enterprise batch processing limit)
   * 2. File type validation with intelligent MIME type detection
   * 3. File size validation for system performance
   * 4. Extension-based fallback for generic MIME types
   * 
   * This validation ensures all uploaded files can be successfully processed
   * by the wAIonix document analysis pipeline.
   */
  const validateAndUpload = (files: FileList) => {
    // Enterprise batch processing limit - prevents system overload
    if (files.length > 10) {
      toast({
        title: "Too many files",
        description: `You can upload up to 10 files at once. You selected ${files.length} files.`,
        variant: "destructive"
      });
      return;
    }

    const supportedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
      "application/csv",
      "text/comma-separated-values",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/octet-stream", // Generic binary files (Excel/CSV/DOCX sometimes detected as this)
      "text/plain",
      "image/jpeg",
      "image/jpg", 
      "image/png"
    ];

    // Enhanced validation - also check file extensions for generic types
    const invalidFiles = Array.from(files).filter(file => {
      if (supportedTypes.includes(file.type)) {
        return false; // File type is directly supported
      }
      
      // For generic types, check file extension
      if (file.type === "application/octet-stream" || file.type === "") {
        const ext = file.name.toLowerCase().split('.').pop();
        return !['pdf', 'docx', 'xlsx', 'xls', 'csv', 'txt', 'jpg', 'jpeg', 'png'].includes(ext || '');
      }
      
      return true; // File type not supported
    });
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Unsupported file type",
        description: `Files: ${invalidFiles.map(f => `${f.name} (${f.type || 'unknown type'})`).join(", ")} are not supported. Supported: PDF, DOCX, XLSX, CSV, TXT, JPG, JPEG, PNG`,
        variant: "destructive"
      });
      return;
    }

    const oversizedFiles = Array.from(files).filter(file => file.size > 100 * 1024 * 1024);
    
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: `Files must be under 100MB. Files: ${oversizedFiles.map(f => f.name).join(", ")} are too large.`,
        variant: "destructive"
      });
      return;
    }

    console.log(`FileUpload: Validation passed, calling onFileUpload with ${files.length} files:`, Array.from(files).map(f => `${f.name} (${f.type})`));
    onFileUpload(files);
  };

  const handleUrlSubmit = () => {
    if (!urlValue.trim()) return;
    
    try {
      new URL(urlValue); // Validate URL format
      if (onUrlUpload) {
        onUrlUpload(urlValue.trim());
        setUrlValue('');
        setShowUrlInput(false);
      }
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., https://example.com)",
        variant: "destructive"
      });
    }
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
        dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary",
        uploading && "pointer-events-none opacity-50",
        "file-upload-component"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        onChange={handleChange}
        className="hidden"
        id="file-upload"
        accept=".pdf,.docx,.csv,.xlsx,.xls,.txt,.jpg,.jpeg,.png"
        disabled={uploading}
      />
      
      <div className="mb-4">
        <Upload className="mx-auto h-10 w-10 text-gray-400" />
      </div>
      
      <h3 className="text-sm font-medium text-gray-900 mb-2">Upload Documents</h3>
      <p className="text-xs text-gray-500 mb-4">Drag & drop files or click to browse</p>
      
      <div className="flex gap-2 justify-center mb-3">
        <Button
          onClick={() => document.getElementById("file-upload")?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Choose Files"}
        </Button>
        
        {onUrlUpload && (
          <Button
            variant="outline"
            onClick={() => setShowUrlInput(!showUrlInput)}
            disabled={uploading}
          >
            <Link className="w-4 h-4 mr-2" />
            URL
          </Button>
        )}
      </div>
      
      {showUrlInput && onUrlUpload && (
        <div className="mb-3 p-3 border rounded-lg bg-gray-50">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              disabled={uploading}
            />
            <Button
              size="sm"
              onClick={handleUrlSubmit}
              disabled={uploading || !urlValue.trim()}
            >
              Extract
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Extract content from a website and its related pages</p>
        </div>
      )}
      
      <p className="text-xs text-gray-400">Supports: PDF, DOCX, CSV, XLSX, TXT, JPG, JPEG, PNG (up to 100MB each, 10 files max)</p>
    </div>
  );
}

export function getFileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("word") || mimeType.includes("document")) return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("image")) return Image;
  return FileText;
}

export function getFileIconColor(mimeType: string) {
  if (mimeType.includes("pdf")) return "text-red-600 bg-red-100";
  if (mimeType.includes("word") || mimeType.includes("document")) return "text-blue-600 bg-blue-100";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "text-green-600 bg-green-100";
  if (mimeType.includes("image")) return "text-purple-600 bg-purple-100";
  return "text-gray-600 bg-gray-100";
}
