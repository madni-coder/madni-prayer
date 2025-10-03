"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Trash2, Download } from "lucide-react";
import fetchFromApi from '../utils/fetchFromApi';

export default function SocialMediaImageUpload({ onUpload, onUploadComplete }) {
    const [images, setImages] = useState([]);
    const fileInputRef = useRef(null);
    const previewUrlsRef = useRef(new Set());

    const uploadImageToApi = async (file) => {
        try {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("imageName", file.name);

            const response = await fetchFromApi("/api/api-notice", 'POST', formData);

            if (!response.ok) {
                const errorText = await response.text();
                return { error: errorText };
            }

            const data = await response.json();
            return data;
        } catch (err) {
            return { error: err.message };
        }
    };

    const handleFileSelect = useCallback(
        async (e) => {
            const files = Array.from(e.target.files);
            const validFiles = files.filter(
                (file) =>
                    file &&
                    (file.type === "image/jpeg" ||
                        file.type === "image/jpg" ||
                        file.type === "image/png")
            );

            if (validFiles.length === 0) return;

            // Call onUpload for each valid file
            if (onUpload) {
                validFiles.forEach((file) => onUpload(file));
            }

            // Immediately create previews and show them
            const previews = validFiles.map((file) => {
                const url = URL.createObjectURL(file);
                previewUrlsRef.current.add(url);
                return {
                    id: Date.now() + Math.random(),
                    file,
                    src: url,
                    name: file.name,
                    cropped: false,
                    croppedSrc: null,
                };
            });

            setImages((prev) => [...prev, ...previews]);

            // Upload each image to API and update the preview when server returns image
            for (const file of validFiles) {
                const result = await uploadImageToApi(file);
                if (result && result.imageSrc) {
                    setImages((prev) =>
                        prev.map((img) => {
                            // match by name and size to identify the preview
                            if (
                                img.file &&
                                img.file.name === file.name &&
                                img.file.size === file.size
                            ) {
                                // revoke the preview blob url if any
                                if (img.src && img.src.startsWith("blob:")) {
                                    try {
                                        URL.revokeObjectURL(img.src);
                                        previewUrlsRef.current.delete(img.src);
                                    } catch (e) {}
                                }

                                return {
                                    ...img,
                                    src: result.imageSrc,
                                    name: result.imageName || img.name,
                                };
                            }
                            return img;
                        })
                    );

                    // After successful upload, call onUploadComplete if provided
                    if (typeof onUploadComplete === "function") {
                        try {
                            onUploadComplete();
                        } catch (err) {
                            // swallow callback errors to avoid breaking UI
                            console.error(
                                "onUploadComplete callback error:",
                                err
                            );
                        }
                    }
                } else {
                    console.error(
                        "Failed to upload",
                        file.name,
                        result && result.error
                    );
                }
            }

            // Reset file input
            e.target.value = "";
        },
        [onUpload, onUploadComplete]
    );

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file && onUpload) {
            onUpload(file);
        }
    };

    const removeImage = (index) => {
        setImages((prev) => {
            const img = prev[index];
            if (img) {
                if (img.src && img.src.startsWith("blob:")) {
                    try {
                        URL.revokeObjectURL(img.src);
                        previewUrlsRef.current.delete(img.src);
                    } catch (e) {}
                }
                if (img.croppedSrc && img.croppedSrc.startsWith("blob:")) {
                    try {
                        URL.revokeObjectURL(img.croppedSrc);
                        previewUrlsRef.current.delete(img.croppedSrc);
                    } catch (e) {}
                }
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    const downloadImage = (image) => {
        const link = document.createElement("a");
        link.download = `cropped-${image.name}`;
        link.href = image.croppedSrc || image.src;
        link.click();
    };

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            previewUrlsRef.current.forEach((url) => {
                try {
                    URL.revokeObjectURL(url);
                } catch (e) {}
            });
            previewUrlsRef.current.clear();
        };
    }, []);

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Announcment Media Images
                        </h2>
                        <p className="text-sm text-gray-500">
                            Use the action buttons on each image to download or
                            remove it.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Upload className="w-4 h-4" />
                    Upload Images
                </button>
            </div>

            {/* Upload Counter */}
            <div className="mb-4">
                <span className="text-sm text-gray-600">
                    Images uploaded ({images.length})
                </span>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {images.map((image, index) => (
                    <div key={image.id} className="relative group">
                        <div className="bg-gray-100 rounded-lg overflow-hidden">
                            <img
                                src={image.croppedSrc || image.src}
                                alt={image.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Image Actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => downloadImage(image)}
                                    className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                                    title="Download Image"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => removeImage(index)}
                                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                    title="Remove Image"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Image Name */}
                        <p className="mt-2 text-xs text-gray-600 truncate text-center">
                            {image.name}
                        </p>
                    </div>
                ))}
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpeg,.jpg,.png"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
}
