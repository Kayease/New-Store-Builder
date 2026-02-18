"use client";
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import AppIcon from "../AppIcon";
import {
  uploadFile,
  deleteFile,
  extractPublicIdFromUrl,
} from "../../lib/cloudinary";
import { Store } from "../../lib/api";
import { toast } from "react-toastify";

// Favicon sizes configuration
const FAVICON_SIZES = [
  { size: "16x16", width: 16, height: 16, filename: "favicon-16x16.png" },
  { size: "32x32", width: 32, height: 32, filename: "favicon-32x32.png" },
  { size: "48x48", width: 48, height: 48, filename: "favicon-48x48.png" },
  { size: "64x64", width: 64, height: 64, filename: "favicon-64x64.png" },
  { size: "96x96", width: 96, height: 96, filename: "favicon-96x96.png" },
  { size: "128x128", width: 128, height: 128, filename: "favicon-128x128.png" },
  { size: "144x144", width: 144, height: 144, filename: "favicon-144x144.png" },
  { size: "152x152", width: 152, height: 152, filename: "favicon-152x152.png" },
  { size: "180x180", width: 180, height: 180, filename: "favicon-180x180.png" },
  { size: "192x192", width: 192, height: 192, filename: "favicon-192x192.png" },
  { size: "256x256", width: 256, height: 256, filename: "favicon-256x256.png" },
  { size: "512x512", width: 512, height: 512, filename: "favicon-512x512.png" },
];

interface GeneratedFavicon {
  size: string;
  url: string;
  width: number;
  height: number;
  filename: string;
  file?: File; // Store the actual file for upload
}

interface FaviconManagerProps {
  storeSlug: string;
  savedFavicons?: Record<string, GeneratedFavicon>;
  onFaviconsUpdated: (favicons: Record<string, GeneratedFavicon>) => void;
}

export interface FaviconManagerRef {
  saveFavicons: () => Promise<Record<string, GeneratedFavicon>>;
  hasTempFavicons: boolean;
}

export const FaviconManager = forwardRef<
  FaviconManagerRef,
  FaviconManagerProps
>(({ storeSlug, savedFavicons = {}, onFaviconsUpdated }, ref) => {
  // State management
  const [savedFaviconsState, setSavedFaviconsState] =
    useState<Record<string, GeneratedFavicon>>(savedFavicons);
  const [tempFavicons, setTempFavicons] = useState<
    Record<string, GeneratedFavicon>
  >({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletedFavicons, setDeletedFavicons] = useState<Set<string>>(
    new Set()
  );

  // Load saved favicons on mount
  useEffect(() => {
    if (Object.keys(savedFavicons).length > 0) {
      setSavedFaviconsState(savedFavicons);
    }
  }, [savedFavicons]);

  // Expose methods to parent component
  useImperativeHandle(
    ref,
    () => ({
      saveFavicons: handleSaveFavicons,
      hasTempFavicons: Object.keys(tempFavicons).length > 0,
    }),
    [tempFavicons]
  );

  // Step 1: File upload and validation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsGenerating(true);

    try {
      // Step 2: Generate all favicon sizes
      const generatedFavicons = await generateAllFaviconSizes(file);

      // Store temp favicons for preview
      setTempFavicons(generatedFavicons);

      toast.success(
        "Favicons generated! Click 'Save' to upload to Cloudinary."
      );
    } catch (error) {
      toast.error("Failed to generate favicons");
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 2: Generate all favicon sizes
  const generateAllFaviconSizes = async (
    file: File
  ): Promise<Record<string, GeneratedFavicon>> => {
    const generatedFavicons: Record<string, GeneratedFavicon> = {};

    for (const faviconSize of FAVICON_SIZES) {
      try {
        // Resize the image
        const resizedFile = await resizeImage(
          file,
          faviconSize.width,
          faviconSize.height
        );

        // Create blob URL for preview
        const blobUrl = URL.createObjectURL(resizedFile);

        generatedFavicons[faviconSize.size] = {
          size: faviconSize.size,
          url: blobUrl,
          width: faviconSize.width,
          height: faviconSize.height,
          filename: faviconSize.filename,
          file: resizedFile, // Store the actual file for upload
        };
      } catch (error) {}
    }

    return generatedFavicons;
  };

  // Helper function to resize image
  const resizeImage = (
    file: File,
    width: number,
    height: number
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File(
                [blob],
                `favicon-${width}x${height}.png`,
                {
                  type: "image/png",
                }
              );
              resolve(resizedFile);
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          "image/png",
          0.9
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Step 3: Upload to Cloudinary when user clicks Save
  const handleSaveFavicons = async (): Promise<
    Record<string, GeneratedFavicon>
  > => {
    if (Object.keys(tempFavicons).length === 0) {
      return savedFaviconsState;
    }

    setIsUploading(true);

    try {
      // Delete old favicons from Cloudinary if they exist
      if (Object.keys(savedFaviconsState).length > 0) {
        const deletePromises = Object.values(savedFaviconsState).map(
          async (favicon) => {
            try {
              const publicId = extractPublicIdFromUrl(favicon.url);
              if (publicId && !deletedFavicons.has(publicId)) {
                await deleteFile(publicId);
                setDeletedFavicons(
                  (prev) => new Set(Array.from(prev).concat(publicId))
                );
              }
            } catch (error) {
              console.error("Failed to delete favicon:", error);
            }
          }
        );

        await Promise.all(deletePromises);
      }

      // Upload new favicons to Cloudinary
      const uploadedFavicons: Record<string, GeneratedFavicon> = {};

      for (const [size, favicon] of Object.entries(tempFavicons)) {
        if (!favicon.file) {
          continue;
        }

        try {
          const uploadResult = await uploadFile(
            favicon.file,
            `${storeSlug}/favicons`
          );

          if (uploadResult.success) {
            uploadedFavicons[size] = {
              size: favicon.size,
              url: uploadResult.data.url,
              width: favicon.width,
              height: favicon.height,
              filename: favicon.filename,
            };
          }
        } catch (error) {
          console.error("Failed to upload favicon:", error);
        }
      }

      // Step 4: Update state and notify parent
      setSavedFaviconsState(uploadedFavicons);
      onFaviconsUpdated(uploadedFavicons);

      // Clear deleted favicons set since we've uploaded new ones
      setDeletedFavicons(new Set());

      // Step 5: Clean up temp favicons
      for (const favicon of Object.values(tempFavicons)) {
        URL.revokeObjectURL(favicon.url);
      }
      setTempFavicons({});

      toast.success("Favicons saved successfully!");
      return uploadedFavicons;
    } catch (error) {
      console.error("Save favicons error:", error);
      toast.error("Failed to save favicons");
      return {};
    } finally {
      setIsUploading(false);
    }
  };

  // Discard temp favicons
  const handleDiscardTempFavicons = () => {
    for (const favicon of Object.values(tempFavicons)) {
      URL.revokeObjectURL(favicon.url);
    }
    setTempFavicons({});
    toast.success("Favicon preview discarded");
  };

  // Delete all saved favicons
  const handleDeleteAllFavicons = async () => {
    if (Object.keys(savedFaviconsState).length === 0) return;

    try {
      // Delete from Cloudinary
      const deletePromises = Object.values(savedFaviconsState).map(
        async (favicon) => {
          try {
            const publicId = extractPublicIdFromUrl(favicon.url);
            if (publicId && !deletedFavicons.has(publicId)) {
              const deleteResult = await deleteFile(publicId);
              setDeletedFavicons(
                (prev) => new Set(Array.from(prev).concat(publicId))
              );
            } else if (publicId) {
              console.log("⚠️ Delete All ");
            } else {
              console.error(
                "❌ Delete All - Could not extract public ID from URL:",
                favicon.url
              );
            }
          } catch (error) {
            console.error("Delete All - Failed to delete favicon:", error);
          }
        }
      );

      // Wait for all deletions to complete
      await Promise.all(deletePromises);

      // Update state and database
      setSavedFaviconsState({});
      onFaviconsUpdated({});

      // Clear favicons from database by calling API
      try {
        await Store.update(storeSlug, { favicons: {} });
      } catch (error) {
        console.error("Failed to clear favicons from database:", error);
      }

      // Force page reload to sync with database
      setTimeout(() => {
        window.location.reload();
      }, 500);

      toast.success("All favicons deleted successfully!");
    } catch (error) {
      console.error("Delete all favicons error:", error);
      toast.error("Failed to delete favicons");
    }
  };

  // Determine which favicons to display
  const displayFavicons =
    Object.keys(tempFavicons).length > 0 ? tempFavicons : savedFaviconsState;
  const hasTempFavicons = Object.keys(tempFavicons).length > 0;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Favicon Manager
            </h3>
            <p className="text-sm text-gray-500">
              Upload an image to generate favicons for all devices
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label
            htmlFor="favicon-upload"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
          >
            <AppIcon name="Upload" size={16} className="mr-2" />
            {isGenerating ? "Generating..." : "Upload Image"}
          </label>
          <input
            id="favicon-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isGenerating}
          />

          {hasTempFavicons && (
            <button
              onClick={handleDiscardTempFavicons}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <AppIcon name="X" size={14} className="mr-1" />
              Discard
            </button>
          )}
        </div>
      </div>

      {/* Generated Favicons Display */}
      {Object.keys(displayFavicons).length > 0 && (
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                {hasTempFavicons
                  ? "Generated Favicons (Preview)"
                  : "Saved Favicons"}
              </h4>
              <p className="text-sm text-gray-500">
                {hasTempFavicons
                  ? "Click 'Save' to upload these favicons to Cloudinary"
                  : "These favicons are saved in Cloudinary"}
              </p>
            </div>
            {!hasTempFavicons && Object.keys(savedFaviconsState).length > 0 && (
              <button
                onClick={handleDeleteAllFavicons}
                className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <AppIcon name="Trash2" size={14} className="mr-1" />
                Delete All
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(displayFavicons).map(([size, favicon]) => (
              <div key={size} className="text-center">
                <div className="w-16 h-16 mx-auto rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                  <img
                    src={favicon.url}
                    alt={`${size}px favicon`}
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* <p className="text-xs text-gray-700 mt-1">{size}</p> */}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      {hasTempFavicons && (
        <div className="flex justify-end">
          <button
            onClick={handleSaveFavicons}
            disabled={isUploading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <AppIcon
                  name="Loader"
                  size={16}
                  className="mr-2 animate-spin"
                />
                Uploading...
              </>
            ) : (
              <>
                <AppIcon name="Save" size={16} className="mr-2" />
                Save Favicons
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
});

FaviconManager.displayName = "FaviconManager";
