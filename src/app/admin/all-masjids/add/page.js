"use client";
import { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

const prayers = [
    { name: "Fajr", defaultTime: "00:00" },
    { name: "Zuhar", defaultTime: "00:00" },
    { name: "Asr", defaultTime: "00:00" },
    { name: "Maghrib", defaultTime: "00:00" },
    { name: "Isha", defaultTime: "00:00" },
    { name: "Juma", defaultTime: "00:00" },
];

export default function AddMasjidPage() {
    const router = useRouter();
    const [masjidName, setMasjidName] = useState("");
    const [colony, setColony] = useState("");
    const [locality, setLocality] = useState("");
    const [times, setTimes] = useState(prayers.map((p) => p.defaultTime));
    const [editIdx, setEditIdx] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Validation function to check if all times are properly set
    const areAllTimesValid = () => {
        return times.every((time) => time && time.trim() !== "");
    };

    const handleEdit = (idx) => {
        setEditIdx(idx);
        setEditValue(convertTo24(times[idx]));
    };

    const handleSave = (idx) => {
        setTimes((times) =>
            times.map((t, i) => (i === idx ? convertTo12(editValue) : t))
        );
        setEditIdx(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate that all fields are filled
        if (!masjidName.trim() || !colony.trim() || !locality.trim()) {
            setErrorMessage(
                "Please fill in all masjid details (Name, Colony, Locality)"
            );
            return;
        }

        // Validate that all Jamat times are set
        if (!areAllTimesValid()) {
            setErrorMessage(
                "Please set all Jamat times before adding the masjid"
            );
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(""); // Clear any previous errors

        try {
            const jamaatData = {
                masjidName,
                colony,
                locality,
                fazar: convertTo24(times[0]),
                zuhar: convertTo24(times[1]),
                asar: convertTo24(times[2]),
                maghrib: convertTo24(times[3]),
                isha: convertTo24(times[4]),
                juma: convertTo24(times[5]),
            };

            const response = await fetch("/api/api-jamat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(jamaatData),
            });

            const result = await response.json();

            if (response.ok) {
                setShowSuccess(true);
                // Reset form
                setMasjidName("");
                setColony("");
                setLocality("");
                setTimes(prayers.map((p) => p.defaultTime));
                // Hide success message after 3 seconds and redirect
                setTimeout(() => {
                    setShowSuccess(false);
                    router.push("/admin/all-masjids?refresh=" + Date.now());
                }, 3000);
            } else {
                setErrorMessage(`Error: ${result.error}`);
                if (result.missingFields) {
                    console.log("Missing fields:", result.missingFields);
                }
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            setErrorMessage("Failed to add masjid. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center py-10">
            {/* Success Message Card */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-50 animate-pulse">
                    <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-6 max-w-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <FaCheckCircle className="h-8 w-8 text-green-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-green-800">
                                    Success!
                                </h3>
                                <p className="text-sm text-green-600 mt-1">
                                    Masjid has been added successfully.
                                    Redirecting...
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message Card */}
            {errorMessage && (
                <div className="fixed top-4 right-4 z-50">
                    <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-6 max-w-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                    <span className="text-red-600 font-bold">
                                        !
                                    </span>
                                </div>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-red-800">
                                    Error
                                </h3>
                                <p className="text-sm text-red-600 mt-1">
                                    {errorMessage}
                                </p>
                            </div>
                            <button
                                onClick={() => setErrorMessage("")}
                                className="ml-4 text-red-400 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-5xl flex items-center mb-4">
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white btn btn-sm mr-2 flex items-center gap-1"
                    onClick={() => router.push("/admin/all-masjids")}
                >
                    <ArrowLeft size={16} /> Back
                </button>
            </div>
            <div className="flex flex-row gap-8 w-full max-w-5xl items-start">
                {/* Add Masjid Form */}
                <div className="w-1/2">
                    <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
                        Add New Masjid
                    </h1>
                    <form
                        className="bg-white p-6 rounded shadow mb-8"
                        onSubmit={handleSubmit}
                    >
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">
                                Masjid Name
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full bg-white text-black border-gray-300 rounded-full"
                                value={masjidName}
                                onChange={(e) => setMasjidName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">
                                Colony
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full bg-white text-black border-gray-300 rounded-full"
                                value={colony}
                                onChange={(e) => setColony(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">
                                Locality
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full bg-white text-black border-gray-300 rounded-full"
                                value={locality}
                                onChange={(e) => setLocality(e.target.value)}
                                required
                            />
                        </div>
                    </form>
                </div>
                {/* Jamat Time Table */}
                <div className="w-1/2">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                        Jamat Time Table
                    </h2>
                    <div className="overflow-x-auto w-full">
                        <table className="table w-full border border-gray-200 bg-gray-50">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="text-gray-700">Prayer</th>
                                    <th className="text-gray-700">Time</th>
                                    <th className="text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prayers.map((prayer, idx) => (
                                    <tr
                                        key={prayer.name}
                                        className="border-b border-gray-200"
                                    >
                                        <td
                                            className={[
                                                "font-semibold border-b-2",
                                                idx === 0
                                                    ? "text-primary border-primary"
                                                    : idx === 1
                                                    ? "text-pink-500 border-pink-500"
                                                    : idx === 2
                                                    ? "text-warning border-warning"
                                                    : idx === 3
                                                    ? "text-error border-error"
                                                    : idx === 4
                                                    ? "text-info border-info"
                                                    : idx === 5
                                                    ? "text-[#8B4513] border-[#8B4513]"
                                                    : "",
                                            ].join(" ")}
                                        >
                                            {prayer.name}
                                        </td>
                                        <td className="text-blue-600 font-semibold">
                                            {editIdx === idx ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="time"
                                                        className="input input-bordered input-sm bg-white text-gray-800 border-gray-300"
                                                        value={editValue}
                                                        onChange={(e) =>
                                                            setEditValue(
                                                                e.target.value
                                                            )
                                                        }
                                                        autoFocus
                                                    />
                                                    <button
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center"
                                                        onClick={() =>
                                                            handleSave(idx)
                                                        }
                                                    >
                                                        <FaCheckCircle
                                                            size={16}
                                                        />
                                                    </button>
                                                </div>
                                            ) : (
                                                times[idx]
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center"
                                                onClick={() => handleEdit(idx)}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Masjid Button - Below both cards */}
            <div className="w-full max-w-5xl mt-8">
                <button
                    onClick={handleSubmit}
                    disabled={
                        isSubmitting ||
                        !masjidName.trim() ||
                        !colony.trim() ||
                        !locality.trim() ||
                        !areAllTimesValid()
                    }
                    className={`btn w-full text-white rounded-none py-4 text-lg font-semibold ${
                        isSubmitting ||
                        !masjidName.trim() ||
                        !colony.trim() ||
                        !locality.trim() ||
                        !areAllTimesValid()
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600"
                    }`}
                >
                    {isSubmitting ? "Adding Masjid..." : "Add Masjid"}
                </button>
            </div>
        </div>
    );
}

function convertTo24(timeStr) {
    const [time, period] = timeStr.split(" ");
    let [h, m] = time.split(":");
    h = parseInt(h);
    if (period === "pm" && h !== 12) h += 12;
    if (period === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}`;
}

function convertTo12(timeStr) {
    let [h, m] = timeStr.split(":");
    h = parseInt(h);
    const period = h >= 12 ? "pm" : "am";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${m} ${period}`;
}
