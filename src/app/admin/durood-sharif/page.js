"use client";
import React, { useState, useEffect } from "react";
import { FaBitcoin, FaMosque } from "react-icons/fa";
import { useRouter } from "next/navigation";
import fetchFromApi from '../../../utils/fetchFromApi';

export default function DuroodSharifTable() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState([]);
    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetchFromApi("/api/api-tasbihUsers");
                const json = await res.json();
                if (json.ok) setUsers(json.data);
            } catch (e) {
                setUsers([]);
            }
        }
        fetchUsers();
    }, []);
    const filtered = users.filter(
        (row) =>
            row["Full Name"].toLowerCase().includes(search.toLowerCase()) ||
            row["Address"].toLowerCase().includes(search.toLowerCase()) ||
            row["mobile number"].toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl shadow p-0 mt-8">
            <div className="p-4">
                <input
                    type="text"
                    placeholder="Search by name, address or mobile number"
                    className="input input-bordered bg-white w-full max-w-xs text-black"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <table className="table w-full">
                <thead>
                    <tr className="bg-[#5fb923] rounded-t-xl">
                        <th className="font-semibold text-base text-white text-left rounded-tl-xl">
                            Name
                        </th>
                        <th className="font-semibold text-base text-white text-left">
                            Colony Address
                        </th>
                        <th className="font-semibold text-base text-white text-left">
                            Mobile Number
                        </th>
                        <th className="font-semibold text-base text-white text-left">
                            Durood Counts
                        </th>
                        <th className="font-semibold text-base text-white text-left rounded-tr-xl">
                            Date
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((row, idx) => (
                        <tr
                            key={idx}
                            className="border-b last:border-b-0 hover:bg-gray-50"
                        >
                            <td className="flex items-center gap-3 py-4 text-gray-800 text-left">
                                <span className="bg-amber-100 rounded-full p-2 flex items-center justify-center">
                                    <FaBitcoin className="text-2xl text-amber-700" />
                                </span>
                                <span className="font-medium">
                                    {row["Full Name"]}
                                </span>
                            </td>
                            <td className="py-4 text-gray-800 text-left">
                                {row["Address"]}
                            </td>
                            <td className="py-4 text-gray-800 text-left">
                                {row["mobile number"]}
                            </td>
                            <td className="py-4 text-gray-800 text-left">
                                {row["Tasbih Counts"] || "NA"}
                            </td>
                            <td className="py-4 text-gray-800 text-left">
                                {row["date"] || new Date().toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
