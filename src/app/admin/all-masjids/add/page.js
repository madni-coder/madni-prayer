"use client";
import { useState } from "react";
import { FaPencilAlt, FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const prayers = [
    { name: "Fajr", defaultTime: "5:00 am" },
    { name: "Zuhar", defaultTime: "6:10 am" },
    { name: "Asr", defaultTime: "4:30 pm" },
    { name: "Maghrib", defaultTime: "7:15 pm" },
    { name: "Isha", defaultTime: "8:45 pm" },
    { name: "Juma", defaultTime: "1:30 pm" },
];

export default function AddMasjidPage() {
    const router = useRouter();
    const [masjidName, setMasjidName] = useState("");
    const [colony, setColony] = useState("");
    const [locality, setLocality] = useState("");
    const [times, setTimes] = useState(prayers.map((p) => p.defaultTime));
    const [editIdx, setEditIdx] = useState(null);
    const [editValue, setEditValue] = useState("");

    const handleTimeChange = (idx, value) => {
        setTimes((times) => times.map((t, i) => (i === idx ? value : t)));
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

    const handleSubmit = (e) => {
        e.preventDefault();
        // Submit logic here
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center py-10">
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
                        <button
                            type="submit"
                            className="btn w-full mt-4 bg-green-500 hover:bg-green-600 text-white rounded-none"
                        >
                            Add Masjid
                        </button>
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
                                                <FaPencilAlt size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
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
