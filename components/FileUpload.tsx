"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { IKImage, ImageKitProvider, IKUpload, IKVideo } from "imagekitio-next";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import config from "@/lib/config";

const {
  imagekit: { publicKey, urlEndpoint },
} = config.env;

// Fix: use the correct API route you created
const authenticator = async () => {
  try {
    const response = await fetch("/api/upload-id");
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    const { signature, expire, token } = await response.json();
    return { token, expire, signature };
  } catch (error: any) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

interface Props {
  type: "image" | "video";
  accept: string;
  placeholder: string;
  folder: string;
  variant: "dark" | "light";
  onFileChange: (filePath: string) => void;
  value?: string;
}

const FileUpload = ({
  type,
  accept,
  placeholder,
  folder,
  variant,
  onFileChange,
  value,
}: Props) => {
  const ikUploadRef = useRef<any>(null);
  const [file, setFile] = useState<{ filePath: string | null }>({
    filePath: value ?? null,
  });
  const [progress, setProgress] = useState(0);

  const styles = {
    button:
      variant === "dark"
        ? "bg-dark-300"
        : "bg-light-600 border-gray-100 border",
    placeholder: variant === "dark" ? "text-light-100" : "text-slate-500",
    text: variant === "dark" ? "text-light-100" : "text-dark-400",
  };

  const onError = (error: any) => {
    console.error(error);
    toast({
      title: `${type} upload failed`,
      description: "Please try again.",
      variant: "destructive",
    });
  };

  const onSuccess = (res: any) => {
    setFile(res);
    onFileChange(res.filePath);
    toast({
      title: `${type} uploaded successfully`,
      description: res.filePath,
    });
  };

  const onValidate = (file: File) => {
    const maxSize = type === "image" ? 20 : 50;
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Max size is ${maxSize}MB`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  return (
    <ImageKitProvider
      publicKey={publicKey}
      urlEndpoint={urlEndpoint}
      authenticator={authenticator}
    >
      <IKUpload
        ref={ikUploadRef}
        onError={onError}
        onSuccess={onSuccess}
        useUniqueFileName
        validateFile={onValidate}
        onUploadStart={() => setProgress(0)}
        onUploadProgress={({ loaded, total }) => {
          setProgress(Math.round((loaded / total) * 100));
        }}
        folder={folder}
        accept={accept}
        className="hidden"
      />

      <button
        className={cn("upload-btn", styles.button)}
        onClick={(e) => {
          e.preventDefault();
          ikUploadRef.current?.click();
        }}
      >
        <Image
          src="/icons/upload.svg"
          alt="upload-icon"
          width={20}
          height={20}
          className="object-contain"
        />
        <p className={cn("text-base", styles.placeholder)}>{placeholder}</p>
        {file.filePath && (
          <p className={cn("upload-filename", styles.text)}>{file.filePath}</p>
        )}
      </button>

      {progress > 0 && progress < 100 && (
        <div className="w-full rounded-full bg-green-200">
          <div className="progress" style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      )}

      {file.filePath &&
        (type === "image" ? (
          <IKImage
            alt="Uploaded preview"
            path={file.filePath}
            width={500}
            height={300}
          />
        ) : (
          <IKVideo
            path={file.filePath}
            controls
            className="h-96 w-full rounded-xl"
          />
        ))}
    </ImageKitProvider>
  );
};

export default FileUpload;