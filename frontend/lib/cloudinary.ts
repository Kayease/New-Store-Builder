import { api } from "./api";

// Clean Cloudinary utility for file uploads
export const uploadFile = async (file: File, folder: string = "uploads") => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      success: true,
      data: {
        url: response.data.url,
        publicId: response.data.publicId,
        width: response.data.width,
        height: response.data.height,
        format: response.data.format,
        bytes: response.data.size,
      },
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

// Clean Cloudinary utility for file deletion
export const deleteFile = async (publicId: string) => {
  try {
    // URL encode the public ID to handle forward slashes
    const encodedPublicId = encodeURIComponent(publicId);
    const response = await api.delete(`/upload/${encodedPublicId}`);
    return response.data;
  } catch (error) {
    console.error("Delete error:", error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const deleteCloudinary = async (publicId: string) => {
  return deleteFile(publicId);
};

// Extract public ID from Cloudinary URL
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    // Match the pattern: /upload/v{version}/path/to/publicId.extension
    // The public ID includes the full path without the extension
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match) {
      const publicId = match[1];
      return publicId;
    }
    return null;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};