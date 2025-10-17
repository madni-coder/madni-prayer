"use client";
import { useState, useEffect, useRef } from "react";
import { FaPencilAlt, FaCheckCircle } from "react-icons/fa";
import { X, RotateCcw } from "lucide-react";
import fetchFromApi from "../../../utils/fetchFromApi";
import { useRouter } from "next/navigation";

const prayers = [
    { name: "Fajr", defaultTime: "5:00 am" },
    { name: "Zuhar", defaultTime: "6:10 am" },
    { name: "Asr", defaultTime: "4:30 pm" },
    { name: "Maghrib", defaultTime: "7:15 pm" },
    { name: "Isha", defaultTime: "8:45 pm" },
    { name: "Juma", defaultTime: "1:30 pm" }, // Added Juma below Isha
];

export default function JamatTimesPage() {
    const router = useRouter();
    const fetchedMasjidsRef = useRef(false);

    // All state hooks at the top level - called unconditionally
    const [loading, setLoading] = useState(true);
    const [colonies, setColonies] = useState([]);
    const [masjids, setMasjids] = useState([]);
    const [selectedColony, setSelectedColony] = useState("");
    const [selectedMasjid, setSelectedMasjid] = useState("");
    const [times, setTimes] = useState(prayers.map((p) => p.defaultTime));
    const [editIdx, setEditIdx] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [colonySearch, setColonySearch] = useState(""); // add for colony search

    // Authentication check effect
    useEffect(() => {
        const checkAuth = () => {
            const authenticated =
                typeof window !== "undefined" &&
                localStorage.getItem("isAuthenticated") === "true";

            if (!authenticated) {
                router.push("/login");
            } else {
                setIsAuthenticated(true);
            }
            setAuthLoading(false);
        };

        checkAuth();
    }, [router]);

    // Fetch colonies and masjids effect
    useEffect(() => {
        if (!isAuthenticated || fetchedMasjidsRef.current) return;
        fetchedMasjidsRef.current = true; // de-dupe in StrictMode/dev and avoid loops
        const ac = new AbortController();

        const fetchData = async () => {
            setLoading(true);
            setError("");
            try {
                setLoading(true);

                // Fetch masjids
                const masjidsResponse = await fetchFromApi("/api/all-masjids");
                if (masjidsResponse.ok) {
                    const masjidsData = await masjidsResponse.json();
                    setMasjids(masjidsData.data || []);

                    // Extract unique colonies from masjids data
                    const uniqueColonies = [
                        ...new Set(
                            masjidsData.data?.map((masjid) => masjid.colony) ||
                                []
                        ),
                    ];
                    setColonies(
                        uniqueColonies.map((colony) => ({ name: colony }))
                    );
                }
                const masjidsData = await masjidsResponse.json();
                setMasjids(masjidsData.data || []);
                const uniqueColonies = [
                    ...new Set(
                        masjidsData.data
                            ?.map((masjid) => masjid.colony)
                            .filter(Boolean) || []
                    ),
                ];
                setColonies(uniqueColonies.map((colony) => ({ name: colony })));
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Error fetching data:", error);
                    setError("Error fetching data");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        return () => ac.abort();
    }, [isAuthenticated]);

    // Fetch jamat times effect
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchJamatTimes = async () => {
            setLoading(true);
            setError("");
            if (!selectedMasjid) {
                setTimes(prayers.map((p) => p.defaultTime));
                setLoading(false);
                return;
            }
            try {
                const masjidData = masjids.find(
                    (m) => m.masjidName === selectedMasjid
                );
                if (masjidData) {
                    const newTimes = prayers.map((prayer) => {
                        let value;
                        switch (prayer.name) {
                            case "Fajr":
                                value = masjidData.fazar; // backend field may be 'fazar'
                                break;
                            case "Zuhar":
                                value = masjidData.zuhar;
                                break;
                            case "Asr":
                                value = masjidData.asar;
                                break;
                            case "Maghrib":
                                value = masjidData.maghrib;
                                break;
                            case "Isha":
                                value = masjidData.isha;
                                break;
                            case "Juma":
                                value = masjidData.juma;
                                break;
                            default:
                                value = prayer.defaultTime;
                        }
                        return normalizeTime(value, prayer.defaultTime);
                    });
                    setTimes(newTimes);
                } else {
                    setError("Masjid data not found");
                    setTimes(prayers.map((p) => p.defaultTime));
                }
            } catch (e) {
                console.error("Error fetching jamat times", e);
                setError("Error fetching jamat times");
                setTimes(prayers.map((p) => p.defaultTime));
            } finally {
                setLoading(false);
            }
        };

        fetchJamatTimes();
    }, [selectedColony, selectedMasjid, masjids, isAuthenticated]);

    // Show loading spinner while checking authentication
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Don't render main content if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    const handleTimeChange = (idx, value) => {
        setTimes((times) => times.map((t, i) => (i === idx ? value : t)));
    };

    const handleEdit = (idx) => {
        setEditIdx(idx);
        setEditValue(convertTo24(times[idx]));
    };

    const handleSave = async (idx) => {
        const newTime = convertTo12(editValue);
        setTimes((times) => times.map((t, i) => (i === idx ? newTime : t)));
        setEditIdx(null);

        // If a masjid is selected, save to database
        if (selectedMasjid) {
            await saveJamatTimes(idx, newTime);
        }
    };

    const saveJamatTimes = async (changedIdx, newTime) => {
        setSaving(true);
        setSaveMessage("");
        setError("");

        try {
            // Find the selected masjid data to get the ID
            const masjidData = masjids.find(
                (m) => m.masjidName === selectedMasjid
            );

            if (!masjidData) {
                setError("Masjid data not found");
                return;
            }

            // Prepare the update data
            const updateData = {
                id: masjidData.id,
            };

            // Map the current times to API fields
            prayers.forEach((prayer, idx) => {
                const time = idx === changedIdx ? newTime : times[idx];
                switch (prayer.name) {
                    case "Fajr":
                        updateData.fazar = time;
                        break;
                    case "Zuhar":
                        updateData.zuhar = time;
                        break;
                    case "Asr":
                        updateData.asar = time;
                        break;
                    case "Maghrib":
                        updateData.maghrib = time;
                        break;
                    case "Isha":
                        updateData.isha = time;
                        break;
                    case "Juma":
                        updateData.juma = time;
                        break;
                }
            });
            const response = await fetchFromApi("/api/api-jamatTimes", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                setSaveMessage("Jamat times saved successfully!");
                setTimeout(() => setSaveMessage(""), 3000);

                // Update the masjids data in state
                setMasjids((prevMasjids) =>
                    prevMasjids.map((masjid) =>
                        masjid.id === masjidData.id
                            ? { ...masjid, ...updateData }
                            : masjid
                    )
                );
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.error || "Failed to save jamat times");
            }
        } catch (error) {
            console.error("Error saving jamat times:", error);
            setError("Error saving jamat times");
        } finally {
            setSaving(false);
        }
    };

    const handleClearColony = () => {
        setSelectedColony("");
    };

    const handleClearMasjid = () => {
        setSelectedMasjid("");
    };

    const handleReset = () => {
        setSelectedColony("");
        setSelectedMasjid("");
        setTimes(prayers.map((p) => p.defaultTime));
        setEditIdx(null);
        setError("");
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center py-10">
            <div className="flex gap-4 mb-8 w-full max-w-5xl items-center px-4">
                {/* Colony Search Input */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search or enter colony"
                        value={colonySearch}
                        onChange={(e) => {
                            setColonySearch(e.target.value);
                            setSelectedColony(e.target.value);
                        }}
                        className="input w-full bg-white border text-gray-800 text-lg h-14 pr-10"
                        list="colony-list"
                    />
                    {colonySearch && (
                        <button
                            onClick={() => {
                                setColonySearch("");
                                setSelectedColony("");
                            }}
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-20"
                            title="Clear colony"
                        >
                            <X size={20} />
                        </button>
                    )}
                    <datalist id="colony-list">
                        {colonies
                            .filter((colony) =>
                                (colony.name || colony)
                                    .toLowerCase()
                                    .includes(colonySearch.toLowerCase())
                            )
                            .map((colony) => (
                                <option
                                    key={colony.name || colony}
                                    value={colony.name || colony}
                                />
                            ))}
                    </datalist>
                </div>
                {/* Masjid Dropdown (DaisyUI) */}
                <div className="dropdown flex-1 relative">
                    <label
                        tabIndex={0}
                        className="btn w-full bg-white border text-gray-500 justify-between text-lg h-14"
                    >
                        {loading
                            ? "Loading..."
                            : selectedMasjid || "Select Masjid"}
                    </label>
                    {selectedMasjid && (
                        <button
                            onClick={handleClearMasjid}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-20"
                        >
                            <X size={20} />
                        </button>
                    )}
                    <ul
                        tabIndex={0}
                        className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full z-10"
                    >
                        {masjids
                            .filter(
                                (m) =>
                                    !selectedColony ||
                                    m.colony === selectedColony
                            )
                            .map((masjid) => (
                                <li key={masjid.id}>
                                    <a
                                        onClick={() => {
                                            setSelectedMasjid(
                                                masjid.masjidName
                                            );
                                            if (!selectedColony)
                                                setSelectedColony(
                                                    masjid.colony
                                                );
                                        }}
                                    >
                                        {masjid.masjidName}
                                    </a>
                                </li>
                            ))}
                    </ul>
                </div>
                {/* Reset Button */}
                <button
                    onClick={handleReset}
                    className="btn bg-gray-500 hover:bg-gray-600 text-white border-none px-4 h-14 flex items-center justify-center"
                    title="Reset all selections"
                >
                    <RotateCcw size={24} />
                </button>
            </div>
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
                Jamat Time Table
            </h1>
            <div className="overflow-x-auto w-full max-w-5xl px-4">
                {error && (
                    <div className="alert alert-warning mb-4 text-sm">
                        {error}
                    </div>
                )}
                {saveMessage && (
                    <div className="alert alert-success mb-4 text-sm">
                        {saveMessage}
                    </div>
                )}
                <table className="table w-full max-w-2xl border border-gray-200 bg-gray-50 text-base">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-gray-700 w-32">Prayer</th>
                            <th className="text-gray-700 w-40">Time</th>
                            <th className="text-gray-700 w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prayers.map((prayer, idx) => (
                            <tr
                                key={prayer.name}
                                className="border-b border-gray-200 h-12"
                            >
                                <td
                                    className={[
                                        "font-semibold border-b-2 text-base py-2 px-2 w-32",
                                        idx === 0
                                            ? "text-green-600 border-green-400"
                                            : idx === 1
                                            ? "text-pink-500 border-pink-300"
                                            : idx === 2
                                            ? "text-yellow-600 border-yellow-400"
                                            : idx === 3
                                            ? "text-red-500 border-red-400"
                                            : idx === 4
                                            ? "text-blue-500 border-blue-400"
                                            : idx === 5
                                            ? "text-[#8B4513] border-[#8B4513]"
                                            : "",
                                    ].join(" ")}
                                >
                                    {prayer.name}
                                </td>
                                <td className="text-blue-700 font-semibold text-base py-2 px-2 w-40">
                                    {editIdx === idx ? (
                                        <input
                                            type="time"
                                            className="input input-bordered input-sm bg-white text-gray-800 border-gray-300"
                                            value={editValue}
                                            onChange={(e) =>
                                                setEditValue(e.target.value)
                                            }
                                            autoFocus
                                        />
                                    ) : (
                                        times[idx]
                                    )}
                                </td>
                                <td className="py-2 px-2 w-24">
                                    {editIdx === idx ? (
                                        <button
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center"
                                            onClick={() => handleSave(idx)}
                                            title="Save time"
                                        >
                                            <FaCheckCircle size={18} />
                                        </button>
                                    ) : (
                                        <button
                                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded flex items-center justify-center"
                                            onClick={() => handleEdit(idx)}
                                            title="Edit time"
                                        >
                                            <FaPencilAlt size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!error && !loading && !selectedMasjid && (
                    <p className="text-center text-gray-500 text-md mt-4">
                        Select a masjid to load jamat times.
                    </p>
                )}
            </div>
        </div>
    );
}

// Normalize incoming time from API (supports 'HH:mm' or 'h:mm am/pm')
function normalizeTime(value, fallback) {
    if (!value) return fallback;
    const s = String(value).trim().toLowerCase();
    if (/^\d{1,2}:\d{2}\s?(am|pm)$/.test(s)) return s;
    if (/^\d{1,2}:\d{2}$/.test(s)) return convertTo12(s);
    return fallback;
}

// Helper to convert 12hr string to 24hr format for input value
function convertTo24(timeStr) {
    // e.g. '6:10 am' => '06:10', '4:30 pm' => '16:30'
    if (!timeStr) return "00:00";
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) return timeStr; // already 24h
    const [time, period] = timeStr.split(" ");
    let [h, m] = time.split(":");
    h = parseInt(h);
    if (period === "pm" && h !== 12) h += 12;
    if (period === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}`;
}

// Helper to convert 24hr input value to 12hr string
function convertTo12(timeStr) {
    // e.g. '06:10' => '6:10 am', '16:30' => '4:30 pm'
    if (!timeStr) return "12:00 am";
    let [h, m] = timeStr.split(":");
    h = parseInt(h);
    const period = h >= 12 ? "pm" : "am";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${m} ${period}`;
}
