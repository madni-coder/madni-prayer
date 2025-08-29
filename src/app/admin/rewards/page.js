"use client";
import React, { useState } from "react";

export default function RewardsPage() {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        address: "",
        badge: "gold",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <div style={{ display: "flex" }}>
            {/* Sidebar */}
            <div
                style={{
                    width: "220px",
                    background: "#fff",
                    minHeight: "100vh",
                    borderRight: "1px solid #eee",
                    padding: "32px 0 0 0",
                }}
            >
                <div
                    style={{
                        color: "#22c55e",
                        fontWeight: "bold",
                        fontSize: "22px",
                        marginLeft: "32px",
                        marginBottom: "32px",
                    }}
                >
                    Admin Panel
                </div>
                <nav
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "18px",
                        marginLeft: "32px",
                        color: "#000", // ensure nav text is black
                    }}
                >
                    <a
                        href="/admin/jamat"
                        style={{ color: "#000", textDecoration: "none" }}
                    >
                        Jamat Times
                    </a>
                    <a
                        href="/admin/rewards"
                        style={{
                            color: "#000",
                            textDecoration: "none",
                            fontWeight: "bold",
                        }}
                    >
                        Rewards
                    </a>
                    <a
                        href="/logout"
                        style={{ color: "#000", textDecoration: "none" }}
                    >
                        Logout
                    </a>
                </nav>
            </div>
            {/* Main Content */}
            <div
                style={{
                    flex: 1,
                    background: "#f5f6f8",
                    minHeight: "100vh",
                    padding: "48px 0 0 0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    color: "#000", // ensure main content text is black
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: "700px",
                        background: "#fff",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        padding: "32px",
                        marginTop: "32px",
                        color: "#000", // ensure form text is black
                    }}
                >
                    <h1
                        style={{
                            fontSize: "28px",
                            fontWeight: "bold",
                            marginBottom: "24px",
                            color: "#000", // ensure heading is black
                        }}
                    >
                        Rewards
                    </h1>
                    <form>
                        <div style={{ marginBottom: "18px" }}>
                            <label>
                                First Name:
                                <input
                                    type="text"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    style={{
                                        marginLeft: "12px",
                                        padding: "8px",
                                        borderRadius: "6px",
                                        border: "1px solid #ccc",
                                        width: "220px",
                                    }}
                                />
                            </label>
                        </div>
                        <div style={{ marginBottom: "18px" }}>
                            <label>
                                Last Name:
                                <input
                                    type="text"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    style={{
                                        marginLeft: "12px",
                                        padding: "8px",
                                        borderRadius: "6px",
                                        border: "1px solid #ccc",
                                        width: "220px",
                                    }}
                                />
                            </label>
                        </div>
                        <div style={{ marginBottom: "18px" }}>
                            <label>
                                Address:
                                <input
                                    type="text"
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    style={{
                                        marginLeft: "12px",
                                        padding: "8px",
                                        borderRadius: "6px",
                                        border: "1px solid #ccc",
                                        width: "220px",
                                    }}
                                />
                            </label>
                        </div>
                        <div style={{ marginBottom: "18px" }}>
                            <label>
                                Badge:
                                <select
                                    name="badge"
                                    value={form.badge}
                                    onChange={handleChange}
                                    style={{
                                        marginLeft: "12px",
                                        padding: "8px",
                                        borderRadius: "6px",
                                        border: "1px solid #ccc",
                                        width: "120px",
                                    }}
                                >
                                    <option value="gold">Gold</option>
                                    <option value="silver">Silver</option>
                                    <option value="bronze">Bronze</option>
                                </select>
                            </label>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
