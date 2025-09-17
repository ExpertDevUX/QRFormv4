import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { validateImageFile, fileToBase64 } from '@/lib/enhanced-qr';

interface FileUploadProps {
  onFileUpload: (file: string | null) => void;
  currentFile?: string | null;
  className?: string;
  accept?: Record<string, string[]>;
  maxSize?: number;
  disabled?: boolean;
}

export function FileUpload({
  onFileUpload,
  currentFile,
  className,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.webp']
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  disabled = false
}: FileUploadProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      // Validate file
      if (!validateImageFile(file)) {
        throw new Error('Invalid file type or size. Please upload a PNG, JPEG, or WebP image under 5MB.');
      }

      // Convert to base64
      const base64 = await fileToBase64(file);
      onFileUpload(base64);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled: disabled || isUploading
  });

  const handleRemoveFile = () => {
    onFileUpload(null);
    setUploadError(null);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          'hover:border-primary/50 hover:bg-accent/50',
          isDragActive && 'border-primary bg-accent',
          disabled && 'opacity-50 cursor-not-allowed',
          currentFile ? 'border-green-200 bg-green-50' : 'border-border'
        )}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : currentFile ? (
          <div className="space-y-3">
            <div className="relative inline-block">
              <img
                src={currentFile}
                alt="Uploaded background"
                className="max-w-32 max-h-32 rounded-lg border"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm text-green-600">Background image uploaded</p>
            <p className="text-xs text-muted-foreground">Click to change or drag a new image</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 text-muted-foreground">
              {isDragActive ? (
                <Upload className="w-full h-full" />
              ) : (
                <Image className="w-full h-full" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {isDragActive ? 'Drop image here' : 'Upload background image'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop an image here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPEG, WebP up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center space-x-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}