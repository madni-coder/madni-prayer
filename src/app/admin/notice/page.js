"use client";
import React, { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";

function getCroppedImg(imageSrc, crop, aspect) {
    // Utility to crop the image using canvas
    return new Promise((resolve, reject) => {
        const image = new window.Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement("canvas");
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;
            canvas.width = crop.width;
            canvas.height = crop.height;
            const ctx = canvas.getContext("2d");

            ctx.drawImage(
                image,
                crop.x * scaleX,
                crop.y * scaleY,
                crop.width * scaleX,
                crop.height * scaleY,
                0,
                0,
                crop.width,
                crop.height
            );

            canvas.toBlob((blob) => {
                resolve(blob);
            }, "image/jpeg");
        };
        image.onerror = (e) => reject(e);
    });
}

const MAX_IMAGES = 5;

export default function NoticePage() {
    const [images, setImages] = useState([]);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [croppingIndex, setCroppingIndex] = useState(null);
    const fileInputRef = useRef(null);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImageSrc(reader.result);
                setCroppingIndex(images.length); // new image
            });
            reader.readAsDataURL(file);
        }
    };

    const handleEdit = (idx) => {
        setImageSrc(images[idx].src);
        setCroppingIndex(idx);
    };

    const handleDelete = (idx) => {
        setImages(images.filter((_, i) => i !== idx));
    };

    const showCroppedImage = useCallback(async () => {
        try {
            const croppedBlob = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                9 / 16
            );
            const url = URL.createObjectURL(croppedBlob);
            const name = `cropped-image-${croppingIndex + 1}.jpg`;
            let newImages = [...images];
            if (croppingIndex < images.length) {
                newImages[croppingIndex] = { src: url, name };
            } else {
                newImages.push({ src: url, name });
            }
            setImages(newImages);
            setImageSrc(null);
            setCroppingIndex(null);
        } catch (e) {
            console.error(e);
        }
    }, [imageSrc, croppedAreaPixels, croppingIndex, images]);

    return (
        <div className="p-8">
            <div className="flex items-center mb-2">
                <span className="text-2xl font-semibold mr-2">
                    <i className="fa-regular fa-images mr-2" /> Social Media
                    Images
                </span>
            </div>
            <div className="flex items-center justify-between mb-2">
                <div className="font-medium">
                    Upload Images ({images.length}/{MAX_IMAGES})
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                    <i className="fa-regular fa-info-circle" />
                    All images will be cropped to 9:16 ratio
                </div>
            </div>
            <hr className="mb-4" />
            <div className="flex flex-wrap gap-6">
                {images.map((img, idx) => (
                    <div
                        key={idx}
                        className="bg-base-100 rounded-xl shadow p-2 flex flex-col items-center w-48"
                    >
                        <img
                            src={img.src}
                            alt={img.name}
                            className="rounded-lg object-cover"
                            style={{ width: 180, height: 320 }}
                        />
                        <div className="flex justify-between w-full mt-2">
                            <span className="text-xs truncate">{img.name}</span>
                            <div className="flex gap-1">
                                <button
                                    className="btn btn-xs btn-circle btn-info"
                                    title="Edit"
                                    onClick={() => handleEdit(idx)}
                                >
                                    <i className="fa fa-pen" />
                                </button>
                                <button
                                    className="btn btn-xs btn-circle btn-error"
                                    title="Delete"
                                    onClick={() => handleDelete(idx)}
                                >
                                    <i className="fa fa-trash" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {images.length < MAX_IMAGES && (
                    <div
                        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl w-48 h-[360px] cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                            fileInputRef.current && fileInputRef.current.click()
                        }
                    >
                        <i className="fa fa-plus text-3xl text-gray-400 mb-2" />
                        <span className="text-gray-400">Add Image</span>
                    </div>
                )}
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
            />
            {/* Cropper Modal */}
            {imageSrc && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 relative flex flex-col items-center">
                        <div
                            style={{
                                position: "relative",
                                width: 300,
                                height: 533,
                            }}
                        >
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={9 / 16}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>
                        <div className="flex gap-4 mt-4">
                            <button
                                className="btn btn-primary"
                                onClick={showCroppedImage}
                            >
                                Crop & Save
                            </button>
                            <button
                                className="btn"
                                onClick={() => {
                                    setImageSrc(null);
                                    setCroppingIndex(null);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
