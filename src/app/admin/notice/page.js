"use client";
import { useEffect, useState } from "react";
import SocialMediaImageUpload from "../../../components/SocialMediaImageUpload";
import fetchFromApi from '../../../utils/fetchFromApi';

export default function NoticeAdmin() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchImages = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchFromApi("/api/api-notice");
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.error || res.statusText);
            }
            const data = await res.json();
            setImages(data.images || []);
        } catch (err) {
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Notice Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Create and manage announcements and notices
                    </p>
                </div>
            </div>

            {/* Social Media Image Upload Component */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:p-6">
                    <SocialMediaImageUpload onUploadComplete={fetchImages} />
                </div>
            </div>

            {/* Uploaded images list */}
            <div className="bg-white shadow sm:rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">
                        Uploaded Images
                    </h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={fetchImages}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {loading && (
                    <p className="text-sm text-gray-500">Loading images...</p>
                )}
                {error && (
                    <p className="text-sm text-red-500">Error: {error}</p>
                )}

                {!loading && !error && images.length === 0 && (
                    <p className="text-sm text-gray-500">
                        No images uploaded yet.
                    </p>
                )}

                {!loading && images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {images.map((img) => (
                            <div
                                key={img.imageName}
                                className="border rounded overflow-hidden"
                            >
                                {img.imageSrc ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <div
                                        style={{ aspectRatio: "9 / 16" }}
                                        className="w-full"
                                    >
                                        <img
                                            src={
                                                img.imageSrcPortrait ||
                                                img.imageSrc
                                            }
                                            alt={img.imageName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div
                                        style={{ aspectRatio: "9 / 16" }}
                                        className="w-full bg-gray-100 flex items-center justify-center text-sm text-gray-500"
                                    >
                                        No preview
                                    </div>
                                )}
                                <div className="p-2 text-xs text-gray-700 truncate">
                                    {img.imageName}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
