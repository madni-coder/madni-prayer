"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Plus, Trash2, GripVertical, Settings2, Eye,
    ChevronDown, ChevronUp, Save, Check, CheckCircle, X,
    Type, Hash, AlignLeft, ChevronDownSquare, CircleDot,
    CheckSquare, List, MousePointerClick, Bell, Layers,
    Minus, Heading, Upload, Copy, MapPin, Moon
} from "lucide-react";

// ─── Field type definitions ───────────────────────────────────────────────────
export const FIELD_TYPES = [
    { type: "address", label: "Address", icon: MapPin, color: "#10b981" },
    { type: "masjid", label: "Area Masjid", icon: Moon, color: "#f59e0b" },
    { type: "text", label: "Full Name", icon: Type, color: "#059669" },
    { type: "notes", label: "Notes", icon: AlignLeft, color: "#0284c7" },
    { type: "email", label: "Email", icon: Type, color: "#059669" },
    { type: "phone", label: "Phone", icon: Type, color: "#16a34a" },
    { type: "dropdown", label: "Dropdown", icon: ChevronDownSquare, color: "#d97706" },
    { type: "radio", label: "Radio Group", icon: CircleDot, color: "#dc2626" },
    { type: "checkbox", label: "Checkbox", icon: CheckSquare, color: "#7c3aed" },
    { type: "checkboxGroup", label: "Checkbox Group", icon: CheckSquare, color: "#9333ea" },
    { type: "array", label: "Dynamic List", icon: List, color: "#f59e0b" },
    { type: "button", label: "Action Button", icon: MousePointerClick, color: "#ef4444" },
    { type: "toast", label: "Toast Message", icon: Bell, color: "#f97316" },
    { type: "popup", label: "Popup / Modal", icon: Layers, color: "#64748b" },
    { type: "divider", label: "Divider", icon: Minus, color: "#94a3b8" },
    { type: "heading", label: "Heading/Text", icon: Heading, color: "#475569" },
    { type: "image", label: "Image Upload", icon: Upload, color: "#10b981" },
];

// ─── Mock initial schema ──────────────────────────────────────────────────────
const DEMO_SCHEMA = {
    "eid-milad-2026": {
        page_title: "Eid Milad-un-Nabi Program 2026",
        page_slug: "eid-milad-2026",
        description: "Annual celebration registration form",
        submit_label: "Register Now",
        color: "#7c3aed",
        isActive: true,
        fields: [
            { id: "f1", key: "full_name", label: "Full Name", type: "text", placeholder: "Enter your full name", required: true, helperText: "As per your CNIC" },
            { id: "f2", key: "age", label: "Age", type: "number", min: 5, max: 120, required: true },
            { id: "f3", key: "gender", label: "Gender", type: "radio", options: ["Male", "Female"], required: true },
            { id: "f4", key: "city", label: "City", type: "dropdown", options: ["Karachi", "Lahore", "Islamabad", "Quetta", "Other"], required: false },
            { id: "f5", key: "confirm_info", label: "I confirm my information is correct", type: "checkbox", required: true },
        ],
    },
    "juma-khitab-registration": {
        page_title: "Juma Khitab — Volunteer Registration",
        page_slug: "juma-khitab-registration",
        description: "Sign-up form for khitab volunteers",
        submit_label: "Sign Up",
        color: "#0284c7",
        isActive: true,
        fields: [
            { id: "f1", key: "full_name", label: "Full Name", type: "text", placeholder: "Your name", required: true },
            { id: "f2", key: "contact", label: "Contact Number", type: "phone", placeholder: "03xx-xxxxxxx", required: true },
        ],
    },
};

const BLANK_SCHEMA = (slug) => ({
    page_title: slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
    page_slug: slug,
    description: "",
    submit_label: "Submit",
    color: "#7c3aed",
    isActive: false,
    fields: [],
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() {
    return "f" + Math.random().toString(36).slice(2, 8);
}

function getFieldTypeInfo(type) {
    return FIELD_TYPES.find(t => t.type === type) || FIELD_TYPES[0];
}

function makeNewField(type) {
    const base = {
        id: uid(),
        key: `field_${type}_${Math.floor(Math.random() * 100)}`,
        label: getFieldTypeInfo(type).label,
        type,
        required: false,
        placeholder: "",
        helperText: "",
    };
    if (["dropdown", "radio", "checkboxGroup"].includes(type)) {
        base.options = ["Option 1", "Option 2", "Option 3"];
    }
    if (type === "text") { base.placeholder = "Enter your full name"; }
    if (type === "notes") { base.placeholder = "Enter notes..."; }
    if (type === "array") { base.itemType = "text"; }
    if (type === "button") { base.action = "popup"; base.popupContent = "Message here"; base.toastMessage = ""; base.toastType = "success"; }
    if (type === "toast") { base.toastMessage = "Action triggered!"; base.toastType = "success"; }
    if (type === "popup") { base.popupTitle = "Info"; base.popupContent = "Content here"; }
    if (type === "heading") { base.text = "Section Heading"; base.size = "h2"; }
    return base;
}

// Sanitize text and strip trailing random id (e.g. " Wy36gq" or "-wy36gq") for display
function sanitizeText(text) {
    if (text == null) return "";
    const str = String(text);
    const withoutTags = str.replace(/<[^>]*>/g, "");
    if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.innerHTML = withoutTags;
        return textarea.value;
    }
    return withoutTags;
}

function displayTitle(text) {
    const clean = sanitizeText(text);
    // remove trailing space or hyphen/underscore + 6 alphanumeric chars
    return clean.replace(/(?:\s|[-_])?[A-Za-z0-9]{6}$/i, "");
}

// ─── Type Picker Modal ────────────────────────────────────────────────────────
function TypePickerModal({ onSelect, onClose }) {
    const [selected, setSelected] = useState([]);

    const toggle = (type) => {
        setSelected(s => s.includes(type) ? s.filter(x => x !== type) : [...s, type]);
    };

    const handleDone = () => {
        const toAdd = selected.length ? selected : FIELD_TYPES.map(f => f.type);
        onSelect(toAdd);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-gray-900">Choose Field Type</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-700 opacity-50 hover:text-gray-900 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {FIELD_TYPES.map(ft => {
                        const isSelected = selected.includes(ft.type);
                        return (
                            <button key={ft.type} onClick={() => toggle(ft.type)}
                                className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl hover:shadow-md hover:scale-[1.02] transition text-left group ${isSelected ? 'border-violet-400 bg-violet-50' : 'border-gray-200'}`}
                                style={{ "--hover-color": ft.color }}>
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: ft.color + "18" }}>
                                        <ft.icon className="w-4 h-4" style={{ color: ft.color }} />
                                    </div>
                                    {isSelected && (
                                        <div className="absolute -top-1 -right-1 bg-violet-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-gray-900 leading-tight">{ft.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                    <button onClick={() => { setSelected([]); onClose(); }}
                        className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
                    <button onClick={handleDone}
                        className="px-4 py-2 text-sm rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold">Done</button>
                </div>
            </div>
        </div>
    );
}

// ─── Options Editor (for dropdown/radio/checkboxGroup) ────────────────────────
function OptionsEditor({ options, onChange }) {
    const updateOption = (i, val) => {
        const next = [...options];
        next[i] = val;
        onChange(next);
    };
    const removeOption = (i) => onChange(options.filter((_, idx) => idx !== i));
    const addOption = () => onChange([...options, `Option ${options.length + 1}`]);

    return (
        <div className="space-y-2">
            {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={opt}
                        onChange={e => updateOption(i, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 text-gray-900 bg-white"
                    />
                    <button onClick={() => removeOption(i)}
                        className="p-1 text-gray-700 opacity-50 hover:text-red-500 rounded transition">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
            <button onClick={addOption}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1 mt-1">
                <Plus className="w-3.5 h-3.5" /> Add Option
            </button>
        </div>
    );
}

// ─── Field Config Panel ───────────────────────────────────────────────────────
function FieldConfig({ field, onChange }) {
    const ft = getFieldTypeInfo(field.type);

    const set = (key, val) => onChange({ ...field, [key]: val });
    const labelInput = (label, key, type = "text", placeholder = "") => (
        <div>
            <label className="block text-xs font-medium text-gray-700 opacity-60 mb-1">{label}</label>
            <input
                type={type}
                value={field[key] ?? ""}
                onChange={e => {
                    if (key === "label") {
                        const val = e.target.value;
                        const updates = { label: val };
                        if (!["divider", "heading", "button", "toast", "popup"].includes(field.type)) {
                            updates.key = val.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
                            if (!updates.key) updates.key = `field_${Math.floor(Math.random() * 1000)}`;
                        }
                        onChange({ ...field, ...updates });
                    } else {
                        set(key, e.target.value);
                    }
                }}
                placeholder={placeholder}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 text-gray-900 bg-white"
            />
        </div>
    );
    const toggle = (label, key) => (
        <div className="flex items-center justify-between py-1">
            <span className="text-xs font-medium text-gray-700 opacity-60">{label}</span>
            <button onClick={() => set(key, !field[key])}
                className={`w-9 h-5 rounded-full transition ${field[key] ? "bg-violet-600 text-white" : "bg-gray-100"} relative`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${field[key] ? "left-4" : "left-0.5"}`} />
            </button>
        </div>
    );

    return (
        <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: ft.color + "20" }}>
                    <ft.icon className="w-4 h-4" style={{ color: ft.color }} />
                </div>
                <span className="text-sm font-semibold text-gray-900">{ft.label} Configuration</span>
            </div>

            {/* Common */}
            {!["divider", "heading"].includes(field.type) && labelInput("Label (visible to user)", "label", "text", "e.g. Full Name")}
            {!["divider", "heading", "button", "toast", "popup", "checkbox"].includes(field.type) && labelInput("Placeholder", "placeholder", "text", "Optional placeholder")}
            {!["divider", "heading"].includes(field.type) && labelInput("Helper Text", "helperText", "text", "Optional hint text below field")}

            {/* Required toggle */}
            {!["divider", "heading", "button", "toast", "popup"].includes(field.type) && toggle("Required", "required")}

            {/* Number min/max */}
            {field.type === "number" && (
                <div className="grid grid-cols-2 gap-2">
                    {labelInput("Min", "min", "number")}
                    {labelInput("Max", "max", "number")}
                </div>
            )}

            {/* Options for dropdown, radio, checkboxGroup */}
            {["dropdown", "radio", "checkboxGroup"].includes(field.type) && (
                <div>
                    <label className="block text-xs font-medium text-gray-700 opacity-60 mb-2">Options</label>
                    <OptionsEditor options={field.options || []} onChange={opts => set("options", opts)} />
                </div>
            )}

            {/* Array item type */}
            {field.type === "array" && (
                <div>
                    <label className="block text-xs font-medium text-gray-700 opacity-60 mb-1">Item Type</label>
                    <select value={field.itemType || "text"} onChange={e => set("itemType", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 text-gray-900 bg-white">
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                    </select>
                </div>
            )}

            {/* Button action */}
            {field.type === "button" && (
                <>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 opacity-60 mb-1">Action</label>
                        <select value={field.action || "popup"} onChange={e => set("action", e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none text-gray-900 bg-white">
                            <option value="popup">Open Popup</option>
                            <option value="toast">Show Toast</option>
                        </select>
                    </div>
                    {field.action === "popup" && labelInput("Popup Content", "popupContent", "text", "Text to show in popup")}
                    {field.action === "toast" && (
                        <>
                            {labelInput("Toast Message", "toastMessage", "text", "Message to show")}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 opacity-60 mb-1">Toast Type</label>
                                <select value={field.toastType || "success"} onChange={e => set("toastType", e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg text-white">
                                    <option value="success">Success</option>
                                    <option value="error">Error</option>
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                </select>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Toast */}
            {field.type === "toast" && (
                <>
                    {labelInput("Toast Message", "toastMessage", "text", "Message to show")}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 opacity-60 mb-1">Toast Type</label>
                        <select value={field.toastType || "success"} onChange={e => set("toastType", e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-900 bg-white">
                            <option value="success">✅ Success</option>
                            <option value="error">❌ Error</option>
                            <option value="info">ℹ️ Info</option>
                            <option value="warning">⚠️ Warning</option>
                        </select>
                    </div>
                </>
            )}

            {/* Popup */}
            {field.type === "popup" && (
                <>
                    {labelInput("Popup Title", "popupTitle", "text", "Title of the popup")}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 opacity-60 mb-1">Popup Content</label>
                        <textarea
                            value={field.popupContent || ""}
                            onChange={e => set("popupContent", e.target.value)}
                            rows={3}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 text-gray-900 bg-white resize-none"
                            placeholder="Content text..."
                        />
                    </div>
                </>
            )}

            {/* Heading */}
            {field.type === "heading" && (
                <>
                    {labelInput("Text", "text", "text", "Section heading text")}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 opacity-60 mb-1">Size</label>
                        <select value={field.size || "h2"} onChange={e => set("size", e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-900 bg-white">
                            <option value="h1">H1 — Large</option>
                            <option value="h2">H2 — Medium</option>
                            <option value="h3">H3 — Small</option>
                            <option value="p">Paragraph</option>
                        </select>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Field Card ───────────────────────────────────────────────────────────────
function FieldCard({ field, index, total, onUpdate, onDelete, onMoveUp, onMoveDown, onDragStart, onDragEnter, onDragEnd }) {
    const [expanded, setExpanded] = useState(false);
    const ft = getFieldTypeInfo(field.type);

    return (
        <div
            draggable
            onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart && onDragStart(index); }}
            onDragEnter={(e) => { e.preventDefault(); onDragEnter && onDragEnter(index); }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={() => { onDragEnd && onDragEnd(); }}
            className={`bg-white border rounded-xl shadow-sm overflow-hidden transition ${expanded ? "border-violet-300" : "border-gray-200"}`}>
            {/* Header row */}
            <div className="flex items-center gap-2 px-3 py-2.5">
                {/* Drag Handle (visual only) */}
                <GripVertical className="w-4 h-4 text-gray-700 opacity-30 flex-shrink-0 cursor-grab" />

                {/* Field type icon */}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: ft.color + "18" }}>
                    <ft.icon className="w-3.5 h-3.5" style={{ color: ft.color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{field.label || "(No label)"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-1.5 py-0 rounded text-white"
                            style={{ backgroundColor: ft.color }}>{ft.label}</span>
                        {field.required && (
                            <span className="text-xs text-red-500 font-semibold">*required</span>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button disabled={index === 0} onClick={onMoveUp}
                        className="p-1 text-gray-700 opacity-30 hover:text-gray-900 opacity-80 disabled:opacity-20 transition">
                        <ChevronUp className="w-4 h-4" />
                    </button>
                    <button disabled={index === total - 1} onClick={onMoveDown}
                        className="p-1 text-gray-700 opacity-30 hover:text-gray-900 opacity-80 disabled:opacity-20 transition">
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => setExpanded(p => !p)}
                        className={`p-1.5 rounded-lg transition ${expanded ? "bg-violet-600/20 text-violet-600" : "text-gray-700 opacity-50 hover:text-gray-900 opacity-80 hover:bg-gray-50"}`}>
                        <Settings2 className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete}
                        className="p-1.5 text-gray-700 opacity-30 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Config panel */}
            {expanded && (
                <div className="border-t border-gray-100 p-3">
                    <FieldConfig field={field} onChange={onUpdate} />
                </div>
            )}
        </div>
    );
}

// ─── Page Header Config ───────────────────────────────────────────────────────
function PageHeaderConfig({ schema, onChange }) {
    const COLORS = ["#7c3aed", "#0284c7", "#059669", "#dc2626", "#d97706", "#db2777", "#0891b2", "#64748b"];
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-violet-600" />
                Page Settings
            </h3>
            <div>
                <label className="block text-xs font-medium text-gray-700 opacity-60 mb-1">Page Title</label>
                <input
                    type="text"
                    value={schema.page_title}
                    onChange={e => onChange({ ...schema, page_title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-900 font-medium bg-white"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 opacity-60 mb-1">Description</label>
                <input
                    type="text"
                    value={schema.description || ""}
                    onChange={e => onChange({ ...schema, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 text-gray-900 bg-white"
                    placeholder="Short description shown to users"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 opacity-60 mb-1">Submit Button Label</label>
                <input
                    type="text"
                    value={schema.submit_label || "Submit"}
                    onChange={e => onChange({ ...schema, submit_label: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 text-gray-900 bg-white"
                />
            </div>
            <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-gray-700 opacity-60">Page Status</span>
                <button onClick={() => onChange({ ...schema, isActive: !schema.isActive })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition ${schema.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700 opacity-80"}`}>
                    <span className={`w-3 h-3 rounded-full ${schema.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                    {schema.isActive ? "Live" : "Draft"}
                </button>
            </div>
        </div>
    );
}

// ─── Save Toast ───────────────────────────────────────────────────────────────
function SavedToast({ show }) {
    if (!show) return null;
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-full shadow-xl animate-[fadeIn_0.2s_ease]">
            <Check className="w-4 h-4 text-emerald-400" />
            Schema saved successfully!
        </div>
    );
}

// ─── JSON Preview Modal ───────────────────────────────────────────────────────
function JsonModal({ schema, onClose }) {
    const json = JSON.stringify({ ...schema }, null, 2);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <span className="text-white font-semibold text-sm">📋 Schema JSON Preview</span>
                    <button onClick={onClose} className="text-gray-700 opacity-50 hover:text-gray-900 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <pre className="flex-1 overflow-auto p-4 text-xs text-emerald-300 font-mono leading-relaxed">
                    {json}
                </pre>
            </div>
        </div>
    );
}

// ─── Live Preview Modal ───────────────────────────────────────────────────────
function LivePreviewModal({ schema, onClose }) {
    // Quick renderers to locally simulate frontend
    const renderInput = (f) => {
        const baseClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white pointer-events-none";
        switch (f.type) {
            // textarea is now used as Full Name (single-line)
            case "text": return <input placeholder={f.placeholder} className={baseClass} readOnly />;
            case "notes": return <textarea placeholder={f.placeholder} rows={3} className={baseClass + " resize-none"} readOnly />;
            case "dropdown": return <div className="relative"><select className={baseClass + " appearance-none"} readOnly><option>{f.placeholder || "— Select —"}</option></select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 opacity-50" /></div>;
            case "radio": return <div className="flex flex-wrap gap-2">{(f.options || ["Option 1"]).map(o => <div key={o} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-gray-200" />{o}</div>)}</div>;
            case "checkbox": return <div className="flex items-start gap-3"><div className="w-5 h-5 rounded-md border-2 border-gray-200 mt-0.5" /><span className="text-sm text-gray-700 leading-snug">{f.label}</span></div>;
            case "checkboxGroup": return <div className="flex flex-wrap gap-2">{(f.options || ["Option 1"]).map(o => <div key={o} className="px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-700">{o}</div>)}</div>;
            case "button": return <button className="px-5 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-xl shadow-sm pointer-events-none">{f.label}</button>;
            case "image": return <div className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl text-gray-700 opacity-50"><Upload className="w-6 h-6 mb-1" /><span className="text-xs">Image Upload Preview</span></div>;
            case "divider": return <hr className="border-gray-200 my-2" />;
            case "heading":
                const tags = { h1: "text-2xl font-bold", h2: "text-xl font-bold", h3: "text-base font-semibold", p: "text-sm opacity-70" };
                return <div className={tags[f.size || "h2"] + " text-gray-700"}>{f.text}</div>;
            case "address": return <div className="space-y-3"><input placeholder="Locality / Area" className={baseClass} readOnly /><input placeholder="City" className={baseClass} readOnly /></div>;
            case "masjid": return <div className="space-y-3"><input placeholder="Name of Masjid" className={baseClass} readOnly /><input placeholder="Locality / Area" className={baseClass} readOnly /><input placeholder="City" className={baseClass} readOnly /></div>;
            case "array": return <div className="space-y-2"><input placeholder={f.placeholder || "Item 1"} className={baseClass} readOnly /><div className="text-sm text-violet-600 font-medium flex items-center gap-1"><Plus className="w-4 h-4" /> Add item</div></div>;
            default: return <input type={f.type === "number" ? "number" : "text"} placeholder={f.placeholder} className={baseClass} readOnly />;
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 p-2 sm:p-4">
            <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-xl max-h-[95vh] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease]">
                <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-200 flex-shrink-0">
                    <div>
                        <h3 className="text-base font-bold text-gray-700 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-violet-600" />
                            Frontend Preview
                        </h3>
                        <p className="text-xs opacity-70 mt-1">Exactly how it will appear to users</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-700 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 custom-scrollbar">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden font-sans">
                        <div className="relative overflow-hidden bg-violet-600">
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                            <div className="relative px-6 py-8 text-white">
                                <h1 className="text-2xl font-bold leading-tight">{displayTitle(schema.page_title)}</h1>
                                {schema.description && <p className="mt-2 text-sm opacity-90 leading-relaxed">{schema.description}</p>}
                            </div>
                        </div>

                        <div className="p-6 space-y-6 text-gray-700">
                            {schema.fields.length === 0 ? (
                                <p className="text-gray-700 opacity-50 text-sm text-center py-4">No fields added to preview yet.</p>
                            ) : (
                                schema.fields.map(f => (
                                    <div key={f.id} className="space-y-1.5">
                                        {!["divider", "heading", "checkbox", "button"].includes(f.type) && (
                                            <label className="flex items-center gap-1.5 text-sm font-medium">
                                                {f.label}
                                                {f.required && <span className="text-red-500 text-base leading-none">*</span>}
                                            </label>
                                        )}
                                        {renderInput(f)}
                                        {f.helperText && !["divider", "heading", "button"].includes(f.type) && (
                                            <p className="text-xs opacity-50 mt-1">{f.helperText}</p>
                                        )}
                                    </div>
                                ))
                            )}

                            <div className="pt-2">
                                <button className="w-full py-3 text-white font-bold rounded-xl pointer-events-none opacity-90 text-sm flex items-center justify-center gap-2 bg-violet-600">
                                    {schema.submit_label || "Submit"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page Builder ────────────────────────────────────────────────────────
export default function EventPageBuilder() {
    const params = useParams();
    const slug = params?.slug || "new-event";
    const router = useRouter();

    const [schema, setSchema] = useState(() => DEMO_SCHEMA[slug] || BLANK_SCHEMA(slug));
    const [showTypePicker, setShowTypePicker] = useState(false);
    const [savedToast, setSavedToast] = useState(false);
    const [showJson, setShowJson] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const dragIndexRef = useRef(null);
    const [dragIndex, setDragIndex] = useState(null);

    // Fetch schema from API on load
    useEffect(() => {
        if (slug && slug !== "new-event") {
            import("axios").then((axios) => {
                axios.default.get(`/api/admin/events/${slug}`)
                    .then((res) => {
                        if (res.data?.event) {
                            const ev = res.data.event;
                            setSchema({
                                page_title: ev.title,
                                page_slug: ev.slug,
                                description: ev.description,
                                submit_label: ev.submit_label || "Submit",
                                color: ev.theme_color || "#7c3aed",
                                isActive: ev.is_active,
                                fields: ev.schema_fields || []
                            });
                        }
                    })
                    .catch((err) => {
                        console.error("Failed to load schema:", err);
                        // Fallback to demo/blank if not found
                    });
            });
        }
    }, [slug]);

    const addField = useCallback((typeOrTypes) => {
        if (Array.isArray(typeOrTypes)) {
            const newFields = typeOrTypes.map(t => makeNewField(t));
            setSchema(s => ({ ...s, fields: [...s.fields, ...newFields] }));
        } else {
            const field = makeNewField(typeOrTypes);
            setSchema(s => ({ ...s, fields: [...s.fields, field] }));
        }
        setShowTypePicker(false);
    }, []);

    const handleDragStart = useCallback((index) => {
        dragIndexRef.current = index;
        setDragIndex(index);
    }, []);

    const handleDragEnter = useCallback((enterIndex) => {
        const from = dragIndexRef.current;
        if (from === null || from === enterIndex) return;
        setSchema(s => {
            const arr = [...s.fields];
            const [moved] = arr.splice(from, 1);
            arr.splice(enterIndex, 0, moved);
            return { ...s, fields: arr };
        });
        dragIndexRef.current = enterIndex;
        setDragIndex(enterIndex);
    }, []);

    const handleDragEnd = useCallback(() => {
        dragIndexRef.current = null;
        setDragIndex(null);
    }, []);

    const updateField = useCallback((id, updated) => {
        setSchema(s => ({ ...s, fields: s.fields.map(f => f.id === id ? updated : f) }));
    }, []);

    const deleteField = useCallback((id) => {
        setSchema(s => ({ ...s, fields: s.fields.filter(f => f.id !== id) }));
    }, []);

    const moveField = (index, dir) => {
        setSchema(s => {
            const arr = [...s.fields];
            const target = index + dir;
            if (target < 0 || target >= arr.length) return s;
            [arr[index], arr[target]] = [arr[target], arr[index]];
            return { ...s, fields: arr };
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const axios = (await import("axios")).default;
            await axios.put(`/api/admin/events/${schema.page_slug}`, { schema });
            setSavedToast(true);
            // show a quick toast then redirect back to events list
            setTimeout(() => {
                setSavedToast(false);
                router.push('/admin/events');
            }, 800);
        } catch (error) {
            console.error("Error saving schema:", error);
            alert("Failed to save. Check console for details.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ─ Top Bar ─ */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                <Link href="/admin/events"
                    className="flex items-center gap-1.5 text-sm text-gray-700 opacity-60 hover:text-gray-900 transition">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-semibold text-gray-900 truncate">{displayTitle(schema.page_title)}</h1>
                    <p className="text-xs text-gray-700 opacity-50 font-mono">/events/{schema.page_slug}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={handleSave}
                        className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition shadow-sm bg-violet-600">
                        <Save className="w-4 h-4" />
                        Save
                    </button>
                </div>
            </div>

            {/* ─ Two-column layout ─ */}
            <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                {/* ─ LEFT: Page Settings ─ */}
                <div className="space-y-4">
                    <PageHeaderConfig schema={schema} onChange={setSchema} />

                    {/* Schema Stats */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                        <h3 className="text-xs font-semibold text-gray-700 opacity-60 uppercase tracking-wide">Overview</h3>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-700 opacity-80">Total fields</span>
                            <span className="font-semibold text-gray-900">{schema.fields.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-700 opacity-80">Required fields</span>
                            <span className="font-semibold text-gray-900">{schema.fields.filter(f => f.required).length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-700 opacity-80">Field types used</span>
                            <span className="font-semibold text-gray-900">
                                {[...new Set(schema.fields.map(f => f.type))].length}
                            </span>
                        </div>
                    </div>

                    {/* Field type legend */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <h3 className="text-xs font-semibold text-gray-700 opacity-60 uppercase tracking-wide mb-3">Field Types in Use</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {[...new Set(schema.fields.map(f => f.type))].map(t => {
                                const info = getFieldTypeInfo(t);
                                return (
                                    <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white"
                                        style={{ backgroundColor: info.color }}>
                                        <info.icon className="w-3 h-3" />
                                        {info.label}
                                    </span>
                                );
                            })}
                            {schema.fields.length === 0 && (
                                <span className="text-xs text-gray-700 opacity-50">No fields yet</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─ RIGHT: Field Builder ─ */}
                <div className="space-y-4">
                    {/* Section header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Form Fields</h2>
                            <p className="text-xs text-gray-700 opacity-60 mt-0.5">
                                {schema.fields.length === 0
                                    ? "No fields yet. Click \"Add Field\" to start building."
                                    : `${schema.fields.length} field${schema.fields.length > 1 ? "s" : ""} — drag to reorder`}
                            </p>
                        </div>
                    </div>

                    {/* Empty state */}
                    {schema.fields.length === 0 && (
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-16 flex flex-col items-center gap-3 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                                <Plus className="w-7 h-7 text-gray-700 opacity-50" />
                            </div>
                            <p className="text-gray-700 opacity-60 font-medium">No fields added yet</p>
                            <p className="text-gray-700 opacity-50 text-sm">Click "Add Field" to choose a field type and configure it.</p>
                            <button onClick={() => setShowTypePicker(true)}
                                className="mt-2 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition bg-violet-600">
                                Add your first field
                            </button>
                        </div>
                    )}

                    {/* Fields list */}
                    <div className="space-y-2">
                        {schema.fields.map((field, index) => (
                            <FieldCard
                                key={field.id}
                                field={field}
                                index={index}
                                total={schema.fields.length}
                                onUpdate={updated => updateField(field.id, updated)}
                                onDelete={() => deleteField(field.id)}
                                onMoveUp={() => moveField(index, -1)}
                                onMoveDown={() => moveField(index, 1)}
                                onDragStart={handleDragStart}
                                onDragEnter={handleDragEnter}
                                onDragEnd={handleDragEnd}
                            />
                        ))}
                    </div>

                    {/* Bottom Add Field button */}
                    {schema.fields.length > 0 && (
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowTypePicker(true)}
                                className="w-full py-3 rounded-xl border border-red-600 text-red-600 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-violet-50 transition shadow-sm">
                                <Plus className="w-4 h-4" />
                                Add Another Field
                            </button>
                            <button
                                onClick={() => setShowPreviewModal(true)}
                                className="w-full py-3.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-md bg-violet-600">
                                <Eye className="w-5 h-5" />
                                Show Preview
                            </button>
                            <button onClick={handleSave}
                                className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-md bg-green-600">
                                <Save className="w-4 h-4" />
                                Save
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showTypePicker && <TypePickerModal onSelect={addField} onClose={() => setShowTypePicker(false)} />}
            {showJson && <JsonModal schema={schema} onClose={() => setShowJson(false)} />}
            {showPreviewModal && <LivePreviewModal schema={schema} onClose={() => setShowPreviewModal(false)} />}
            <SavedToast show={savedToast} />
        </div>
    );
}
