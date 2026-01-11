export async function uploadFileToR2(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ url: string; key: string } | null> {
  try {
    // 1. Get presigned URL from /api/r2/upload
    const presignedResponse = await fetch("/api/r2/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });

    if (!presignedResponse.ok) {
      throw new Error("Failed to get presigned URL");
    }

    const { presignedUrl, key, publicUrl } = await presignedResponse.json();

    // 2. Upload via XHR with progress tracking
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 204) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Upload failed"));
      };

      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });

    return { url: publicUrl, key };
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}
