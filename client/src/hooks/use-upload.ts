import { useState, useCallback } from "react";
import type { UppyFile } from "@uppy/core";

interface UploadMetadata {
  name: string;
  size: number;
  contentType: string;
}

interface UploadResponse {
  uploadURL: string;
  objectPath: string;
  metadata?: UploadMetadata;
}

interface UseUploadOptions {
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initData) {
      headers["x-telegram-init-data"] = tg.initData;
    }
    return headers;
  };

  const requestUploadUrl = useCallback(
    async (file: File): Promise<UploadResponse> => {
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get upload URL");
      }

      return response.json();
    },
    []
  );

  const uploadToCloudinaryViaServer = useCallback(
    async (file: File, targetURL: string, taskId: number): Promise<string> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", taskId.toString());
      const response = await fetch(targetURL, {
        method: "POST", 
        body: formData,
      
      });

      if (!response.ok) {
        throw new Error("Failed to upload file to Cloudinary");
      }

      const data = await response.json();
      return data.url; 
    },
    []
  );

  const uploadFile = useCallback(
    async (file: File,taskId: number): Promise<UploadResponse | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        setProgress(10);
        const requestResponse = await requestUploadUrl(file);

        setProgress(30);
        // Загружаем файл и получаем реальную ссылку
        const finalUrl = await uploadToCloudinaryViaServer(file, requestResponse.uploadURL, taskId);

        const result = {
          uploadURL: finalUrl,
          objectPath: finalUrl,
          metadata: { name: file.name, size: file.size, contentType: file.type }
        };

        setProgress(100);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [requestUploadUrl, uploadToCloudinaryViaServer, options]
  );

  // Заглушка для Uppy, если он используется
  const getUploadParameters = useCallback(
    async (
      file: UppyFile<Record<string, unknown>, Record<string, unknown>>
    ): Promise<{
      method: "POST";
      url: string;
      headers?: Record<string, string>;
      getResponseData?: (responseText: string) => any;
    }> => {
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const data = await response.json();
      
      return {
        method: "POST", 
        url: data.uploadURL,
        headers: {
         
        },
       
        getResponseData: (responseText) => {
          try {
            const json = JSON.parse(responseText);
            return { location: json.url || json.uploadURL }; 
          } catch (e) {
            return {};
          }
        }
      };
    },
    []
  );

  return {
    uploadFile,
    getUploadParameters,
    isUploading,
    error,
    progress,
  };
}