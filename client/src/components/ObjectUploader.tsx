import { useState,useEffect,useRef } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import type { UppyFile, UploadResult } from "@uppy/core";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import XHRUpload from '@uppy/xhr-upload'
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  /**
   * Function to get upload parameters for each file.
   * IMPORTANT: This receives the file object - use file.name, file.size, file.type
   * to request per-file presigned URLs from your backend.
   */
  onGetUploadParameters: (
    file: UppyFile<Record<string, unknown>, Record<string, unknown>>
  ) => Promise<{
    method: "POST";
    url: string;
    headers?: Record<string, string>;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 *
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 *
 * The component uses Uppy v5 under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 *
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters for each file.
 *   Receives the UppyFile object with file.name, file.size, file.type properties.
 *   Use these to request per-file presigned URLs from your backend. Returns method,
 *   url, and optional headers for the upload request.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uppy] = useState(() =>
    new Uppy({
      restrictions: { maxNumberOfFiles, maxFileSize },
      autoProceed: true,
    }).use(XHRUpload, {
      method: 'POST',
      formData: true,
      fieldName: 'file',
      endpoint: 'placeholder', 
    })
  );

  useEffect(() => {
    uppy.addPreProcessor(async (fileIds) => {
      for (const fileId of fileIds) {
        const file = uppy.getFile(fileId);
        try {
          const params = await onGetUploadParameters(file as any);
          
          uppy.setFileState(fileId, {
            xhrUpload: {
              endpoint: params.url,
              method: params.method,
              headers: params.headers, 
            }
          });
        } catch (err) {
          console.error("Failed to prepare upload params:", err);
          uppy.info("Failed to prepare upload", "error", 5000);
          throw err;
        }
      }
    });
    const handleComplete = (result: any) => {
      setIsUploading(false);
      onComplete?.(result);
    };

    const handleUpload = () => setIsUploading(true);
    const handleError = () => setIsUploading(false);

    uppy.on('upload', handleUpload);
    uppy.on('complete', handleComplete);
    uppy.on('error', handleError);

    return () => {
      uppy.removePreProcessor(async () => {});
      if ((uppy as any).close) {
        (uppy as any).close();
      }
    };
  }, [uppy, onComplete, onGetUploadParameters]);

  const handleButtonClick = () => {
    fileInputRef.current?.click(); 
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    uppy.cancelAll();
    files.forEach((file) => {
      try {
        uppy.addFile({
          source: 'file input',
          name: file.name,
          type: file.type,
          data: file,
        });
      } catch (err) {
        console.error(err);
      }
    });
    e.target.value = ""; 
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*"
      />
      
      <Button 
        onClick={handleButtonClick} 
        className={buttonClassName}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : null}
        {isUploading ? "Loading..." : children}
      </Button>
    </div>
  );
}

