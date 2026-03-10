import { useState, useCallback } from "react";
import type { UppyFile } from "@uppy/core";
import { useAccount } from "wagmi";

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
  const { address } = useAccount();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const getAuthHeaders = useCallback((isJson = true) => {
    const headers: Record<string, string> = {};
    if (isJson) headers["Content-Type"] = "application/json";
    
    if (address) {
      headers["x-user-address"] = address.toLowerCase();
    }
    return headers;
  }, [address]);

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
      headers: getAuthHeaders(false)
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

  const getUploadParameters = useCallback(
    async (file: UppyFile<any, any>) => {
      const authHeaders = getAuthHeaders(false);

     const response = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { 
        ...getAuthHeaders(true), 
      },
      body: JSON.stringify({
  name: file.name,
  size: file.size ?? 0, 
  contentType: file.type || "application/octet-stream",
}),
    });

      if (!response.ok) throw new Error("Failed to get upload URL");
      const data = await response.json();
     

      return {
      method: "POST" as const, 
      url: data.uploadURL, // Это наш "/api/uploads/direct"
      headers: {
        ...authHeaders, // ПЕРЕДАЕМ x-user-address СЮДА
      },
      // Не добавляй здесь 'Content-Type', Uppy сам поставит multipart/form-data
      getResponseData: (responseText: string) => {
        try {
          const json = JSON.parse(responseText);
          return { url: json.url || json.uploadURL };
        } catch (e) { return {}; }
      }
    };
  },
  [getAuthHeaders]
);

  return {
    uploadFile,
    getUploadParameters,
    isUploading,
    error,
    progress,
  };
}