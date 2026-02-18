"use client";
import React, { useState } from "react";
import AppIcon from "../AppIcon";
import { uploadFile, deleteFile } from "../../lib/cloudinary";
import { toast } from "react-toastify";

// Clean helper function to extract public ID from Cloudinary URL
const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const match = url.match(/\/upload\/(?:[^\/]+\/)*([^\/]+)(?:\.[^.]+)?$/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};

interface LogoManagerProps {
  storeSlug: string;
  currentLogoUrl?: string;
  onLogoUpdated: (logoUrl: string | null) => void;
}

export const LogoManager: React.FC<LogoManagerProps> = ({
  storeSlug,
  currentLogoUrl,
  onLogoUpdated,
}) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      // If there's an existing Cloudinary logo, delete it first
      if (currentLogoUrl && !currentLogoUrl.startsWith("blob:")) {
        const publicId = extractPublicIdFromUrl(currentLogoUrl);
        if (publicId) {
          try {
            await deleteFile(publicId);
          } catch (error) {
            console.warn("Failed to delete old logo:", error);
          }
        }
      }

      // Show instant preview using object URL (temporary)
      const objectUrl = URL.createObjectURL(file);
      onLogoUpdated(objectUrl);

      // Store in session storage for persistence
      sessionStorage.setItem(
        `temp_logo_${storeSlug}`,
        JSON.stringify({
          filename: file.name,
          size: file.size,
          type: file.type,
          objectUrl: objectUrl,
        })
      );

      toast.success(
        "Logo preview updated! Click 'Save' to upload to Cloudinary."
      );
    } catch (error) {
      console.error("Logo preview error:", error);
      toast.error("Failed to create logo preview");
    }
  };

  const handleLogoDelete = async () => {
    if (!currentLogoUrl) return;

    setDeleting(true);

    try {
      // If it's a temporary object URL, just clear it
      if (currentLogoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentLogoUrl);
        onLogoUpdated(null);
        sessionStorage.removeItem(`temp_logo_${storeSlug}`);
        toast.success("Logo removed");
      } else {
        // If it's a Cloudinary URL, delete from Cloudinary
        const publicId = extractPublicIdFromUrl(currentLogoUrl);
        if (publicId) {
          await deleteFile(publicId);
        }
        onLogoUpdated(null);
        toast.success("Logo deleted successfully");
      }
    } catch (error) {
      console.error("Logo delete error:", error);
      toast.error("Failed to delete logo");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Logo Preview */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Store Logo</h4>
            <p className="text-sm text-gray-500">
              Upload your store logo (recommended: 512x512px, PNG/JPG)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Logo Preview */}
          <div className="relative">
            {currentLogoUrl ? (
              <div className="relative group">
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                  <img
                    src={currentLogoUrl}
                    alt="Store Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* Delete button */}
                <button
                  onClick={handleLogoDelete}
                  disabled={deleting}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  {deleting ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <AppIcon name="X" size={12} />
                  )}
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center">
                <AppIcon name="Image" size={24} className="text-gray-400" />
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex-1">
            <label
              htmlFor="logo-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
            >
              <AppIcon name="Upload" size={16} className="mr-2" />
              {currentLogoUrl ? "Change Logo" : "Upload Logo"}
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Status Info */}
        {currentLogoUrl && currentLogoUrl.startsWith("blob:") && (
          <div className="mt-3 p-3 rounded-md bg-green-50 border border-green-200">
            <p className="text-xs text-green-600 mt-1">
              Click 'Save' to upload to Cloudinary
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
