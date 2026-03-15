"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import {
    Plus, Minus, X, ChevronDown, CheckCircle, AlertCircle,
    Upload, Calendar, Clock, ArrowLeft
} from "lucide-react";
import AnimatedLooader from "../../../components/animatedLooader";

// ─── Static Mock Schemas (same as in admin builder) ───────────────────────────
const MOCK_SCHEMAS = {
    "eid-milad-2026": {
        page_title: "Eid Milad-un-Nabi Program 2026",
        page_slug: "eid-milad-2026",
        description: "Join us for the annual Eid Milad-un-Nabi celebration. Fill in your details below to register and participate in the event.",
        submit_label: "Register Now",
        color: "#7c3aed",
        isActive: true,
        fields: [
            { id: "f1", key: "full_name", label: "Full Name", type: "text", placeholder: "Enter your full name", required: true, helperText: "As per your CNIC" },
            { id: "f2", key: "age", label: "Age", type: "number", placeholder: "Your age", min: 5, max: 120, required: true },
            { id: "f3", key: "gender", label: "Gender", type: "radio", options: ["Male", "Female"], required: true },
            { id: "f4", key: "city", label: "City", type: "dropdown", options: ["Karachi", "Lahore", "Islamabad", "Quetta", "Peshawar", "Other"], required: false, placeholder: "Select your city" },
            { id: "f5", key: "contact", label: "Contact Number", type: "phone", placeholder: "03xx-xxxxxxx", required: true },
            { id: "f6", key: "email", label: "Email Address", type: "email", placeholder: "you@example.com", required: false, helperText: "We'll send confirmation here" },
            {
                id: "f7", key: "section_sep", type: "divider"
            },
            { id: "fh2", key: "attend_section", type: "heading", text: "Attendance Preferences", size: "h3" },
            { id: "f8", key: "program_session", label: "Preferred Session", type: "radio", options: ["Morning (9:00 AM)", "Evening (6:00 PM)", "Both"], required: true },
            { id: "f9", key: "food_pref", label: "Food Preference", type: "checkboxGroup", options: ["Vegetarian", "Non-Vegetarian", "No Preference"], required: false },
            { id: "f10", key: "event_address", label: "Event Address", type: "address", required: false },
            { id: "f11", key: "languages", label: "Languages Known", type: "array", itemType: "text", placeholder: "Add a language" },
            {
                id: "f12", key: "event_rules_btn", label: "📋 View Event Rules", type: "button",
                action: "popup", helperText: "Click to read before registering",
                popupTitle: "Event Rules & Guidelines",
                popupContent: "1. Please arrive 15 minutes early.\n2. Dress modestly — Islamic attire preferred.\n3. Phones on silent during the program.\n4. Children must be accompanied by a guardian.\n5. Follow all instructions from the volunteers."
            },
            {
                id: "f13", key: "reminder_btn", label: "🔔 Set Reminder", type: "button",
                action: "toast", toastMessage: "Reminder set! Event is on Friday, 15th March 2026 at 6:00 PM.", toastType: "success"
            },
            { id: "f14", key: "accept_terms", label: "I agree to the event rules and guidelines", type: "checkbox", required: true },
        ],
    },
    "juma-khitab-registration": {
        page_title: "Juma Khitab — Volunteer Registration",
        page_slug: "juma-khitab-registration",
        description: "Sign up to volunteer for the Friday Juma Khitab. We need enthusiastic volunteers to help organize.",
        submit_label: "Sign Up as Volunteer",
        color: "#0284c7",
        isActive: true,
        fields: [
            { id: "f1", key: "full_name", label: "Full Name", type: "text", placeholder: "Your full name", required: true },
            { id: "f2", key: "contact", label: "Phone Number", type: "phone", placeholder: "03xx-xxxxxxx", required: true },
            { id: "f3", key: "role", label: "Preferred Role", type: "dropdown", options: ["Crowd Management", "Mic / Audio", "Food Distribution", "Parking", "Other"], required: true, placeholder: "Choose a role" },
            { id: "f4", key: "experience", label: "Previous Experience", type: "textarea", placeholder: "Briefly describe any relevant volunteer experience", required: false },
            { id: "f5", key: "availability", label: "Day of Availability", type: "checkboxGroup", options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], required: true },
            { id: "f6", key: "confirm", label: "I confirm I am available and committed to volunteer", type: "checkbox", required: true },
        ],
    },
    "monthly-ijtima-2026": {
        page_title: "Monthly Ijtima — March 2026",
        page_slug: "monthly-ijtima-2026",
        description: "Register to attend the monthly gathering.",
        submit_label: "Register",
        color: "#059669",
        isActive: false,
        fields: [
            { id: "f1", key: "name", label: "Your Name", type: "text", required: true, placeholder: "Full name" },
            { id: "f2", key: "phone", label: "Phone", type: "phone", required: true, placeholder: "Phone number" },
        ],
    },
};

// ─── Individual Field Renderers ───────────────────────────────────────────────

function TextField({ field, value, onChange }) {
    const inputType = field.type === "phone" ? "tel" : (field.type ?? "text");
    return (
        <input
            id={field.id}
            type={inputType}
            value={value || ""}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2.5 border border-base-300 bg-base-200 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            style={{ "--tw-ring-color": "#7c3aed" }}
        />
    );
}

function TextareaField({ field, value, onChange }) {
    return (
        <textarea
            id={field.id}
            value={value || ""}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className="w-full px-4 py-2.5 border border-base-300 bg-base-200 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition resize-none"
        />
    );
}

function NumberField({ field, value, onChange }) {
    return (
        <input
            id={field.id}
            type="number"
            value={value ?? ""}
            onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder={field.placeholder}
            required={field.required}
            min={field.min}
            max={field.max}
            className="w-full px-4 py-2.5 border border-base-300 bg-base-200 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
        />
    );
}

function DropdownField({ field, value, onChange }) {
    return (
        <div className="relative">
            <select
                id={field.id}
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                required={field.required}
                className="w-full px-4 py-2.5 border border-base-300 bg-base-200 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition appearance-none"
            >
                <option value="">{field.placeholder || "— Select —"}</option>
                {(field.options || []).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-80 pointer-events-none" />
        </div>
    );
}

function RadioField({ field, value, onChange }) {
    return (
        <div className="flex flex-wrap gap-3">
            {(field.options || []).map(opt => (
                <label key={opt}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition text-sm font-medium ${value === opt ? "border-transparent text-primary-content bg-primary" : "border-base-300 text-white font-bold hover:border-base-200"}`}>
                    <input
                        type="radio"
                        name={field.key}
                        value={opt}
                        required={field.required}
                        checked={value === opt}
                        onChange={() => onChange(opt)}
                        className="sr-only"
                    />
                    {value === opt ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-base-300 flex-shrink-0" />}
                    {opt}
                </label>
            ))}
        </div>
    );
}

function CheckboxField({ field, value, onChange }) {
    return (
        <label className="flex items-start gap-3 cursor-pointer group">
            <div onClick={() => onChange(!value)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition ${value ? "border-transparent bg-primary" : "border-white group-hover:border-white"}`}>
                {value && <CheckCircle className="w-3.5 h-3.5 text-primary-content" />}
            </div>
            <span className="text-sm font-bold text-white leading-snug">{field.label}</span>
        </label>
    );
}

function CheckboxGroupField({ field, value = [], onChange }) {
    const toggle = (opt) => {
        const current = Array.isArray(value) ? value : [];
        onChange(current.includes(opt) ? current.filter(v => v !== opt) : [...current, opt]);
    };
    return (
        <div className="flex flex-wrap gap-2">
            {(field.options || []).map(opt => {
                const checked = Array.isArray(value) && value.includes(opt);
                return (
                    <label key={opt}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer transition text-sm font-medium ${checked ? "border-transparent text-primary-content bg-primary" : "border-white text-white font-bold hover:border-white"}`}>
                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(opt)} />
                        {opt}
                    </label>
                );
            })}
        </div>
    );
}

function ArrayField({ field, value = [], onChange }) {
    const items = Array.isArray(value) ? value : [];
    const add = () => onChange([...items, ""]);
    const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
    const update = (i, val) => {
        const next = [...items];
        next[i] = val;
        onChange(next);
    };
    return (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input
                        type={field.itemType || "text"}
                        value={item}
                        onChange={e => update(i, e.target.value)}
                        placeholder={field.placeholder || `Item ${i + 1}`}
                        className="flex-1 px-3 py-2 border border-base-300 bg-base-200 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                    <button type="button" onClick={() => remove(i)}
                        className="p-2 text-white font-bold hover:text-red-400 hover:bg-red-50 rounded-lg transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button type="button" onClick={add}
                className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-focus transition">
                <Plus className="w-4 h-4" />
                {field.placeholder ? `Add ${field.label}` : "Add item"}
            </button>
        </div>
    );
}

function AddressField({ field, value = {}, onChange }) {
    return (
        <div className="space-y-3">
            <input
                type="text"
                value={value.locality || ""}
                onChange={e => onChange({ ...value, locality: e.target.value })}
                placeholder="Locality / Area"
                className="w-full px-4 py-2.5 border border-base-300 bg-base-200 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
            <input
                type="text"
                value={value.city || ""}
                onChange={e => onChange({ ...value, city: e.target.value })}
                placeholder="City"
                className="w-full px-4 py-2.5 border border-base-300 bg-base-200 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
        </div>
    );
}

function MasjidField({ field, value = {}, onChange }) {
    return (
        <div className="space-y-3">
            <input
                type="text"
                value={value.masjidName || ""}
                onChange={e => onChange({ ...value, masjidName: e.target.value })}
                placeholder="Name of Masjid"
                className="w-full px-4 py-2.5 border border-base-300 bg-base-200 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
            <input
                type="text"
                value={value.locality || ""}
                onChange={e => onChange({ ...value, locality: e.target.value })}
                placeholder="Locality / Area"
                className="w-full px-4 py-2.5 border border-base-300 bg-base-200 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
            <input
                type="text"
                value={value.city || ""}
                onChange={e => onChange({ ...value, city: e.target.value })}
                placeholder="City"
                className="w-full px-4 py-2.5 border border-base-300 bg-base-200 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
        </div>
    );
}

function ButtonField({ field, color }) {
    const [popupOpen, setPopupOpen] = useState(false);

    const handleClick = () => {
        if (field.action === "toast") {
            const type = field.toastType || "success";
            const msg = field.toastMessage || "Action triggered";
            if (type === "success") toast.success(msg);
            else if (type === "error") toast.error(msg);
            else if (type === "warning") toast.warning(msg);
            else toast.info(msg);
        } else {
            setPopupOpen(true);
        }
    };

    return (
        <>
            <button type="button" onClick={handleClick}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-primary-content rounded-xl hover:opacity-90 active:scale-95 transition shadow-sm bg-primary">
                {field.label}
            </button>
            {field.helperText && (
                <p className="text-xs font-bold text-white mt-1">{field.helperText}</p>
            )}

            {/* Popup Modal */}
            {popupOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">{field.popupTitle || "Information"}</h3>
                            <button onClick={() => setPopupOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                            {field.popupContent}
                        </div>
                        <button onClick={() => setPopupOpen(false)}
                            className="mt-5 w-full py-2 text-sm font-semibold text-primary-content rounded-xl transition hover:opacity-90 bg-primary">
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

function FieldWrapper({ field, value, onChange }) {
    if (field.type === "divider") {
        return <hr className="border-gray-200 my-2" />;
    }
    if (field.type === "heading") {
        const Tag = field.size || "h3";
        const classes = {
            h1: "text-2xl font-bold text-white",
            h2: "text-xl font-bold text-white",
            h3: "text-base font-bold text-white",
            p: "text-sm font-bold text-white",
        };
        return <Tag className={classes[field.size || "h3"]}>{field.text}</Tag>;
    }
    if (field.type === "button") {
        return <ButtonField field={field} />;
    }

    const renderInput = () => {
        switch (field.type) {
            case "textarea":
                // Treat legacy/incorrect textarea fields named 'name' as single-line text inputs
                if (/name/i.test(field.label || "") || /name/i.test(field.key || "")) {
                    return <TextField field={{ ...field, type: "text" }} value={value} onChange={onChange} />;
                }
                return <TextareaField field={field} value={value} onChange={onChange} />;
            case "notes":
                return <TextareaField field={field} value={value} onChange={onChange} />;
            case "number": return <NumberField field={field} value={value} onChange={onChange} />;
            case "email": return <TextField field={{ ...field, type: "email" }} value={value} onChange={onChange} />;
            case "phone": return <TextField field={{ ...field, type: "tel" }} value={value} onChange={onChange} />;
            case "dropdown": return <DropdownField field={field} value={value} onChange={onChange} />;
            case "radio": return <RadioField field={field} value={value} onChange={onChange} />;
            case "checkbox": return <CheckboxField field={field} value={value} onChange={onChange} />;
            case "checkboxGroup": return <CheckboxGroupField field={field} value={value} onChange={onChange} />;
            case "array": return <ArrayField field={field} value={value} onChange={onChange} />;
            case "address": return <AddressField field={field} value={value} onChange={onChange} />;
            case "masjid": return <MasjidField field={field} value={value} onChange={onChange} />;
            case "image": return (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-base-300 bg-base-200 rounded-xl cursor-pointer hover:border-primary transition text-white">
                    <Upload className="w-6 h-6 mb-1 opacity-70" />
                    <span className="text-xs opacity-70">Click to upload image</span>
                    <input type="file" accept="image/*" className="sr-only" />
                </label>
            );
            default: return <TextField field={field} value={value} onChange={onChange} />;
        }
    };

    return (
        <div className="space-y-1.5">
            {field.type !== "checkbox" && (
                <label htmlFor={field.id} className="flex items-center gap-1.5 text-sm font-bold text-white">
                    {field.label}
                    {field.required && <span className="text-red-500 text-base leading-none">*</span>}
                </label>
            )}
            {renderInput()}
            {field.helperText && field.type !== "button" && (
                <p className="text-xs font-bold text-white">{field.helperText}</p>
            )}
        </div>
    );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ schema, onReset }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-base-200">
            <div className="max-w-md w-full text-center space-y-5 bg-base-100 p-8 rounded-2xl shadow-xl border border-base-300">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg bg-primary">
                    <CheckCircle className="w-10 h-10 text-primary-content" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold mt-4 text-base-content">Registration Complete!</h2>
                    <p className="opacity-70 mt-2">
                        Your registration for <strong>{schema.page_title}</strong> has been received. We'll contact you soon.
                    </p>
                </div>
                <button onClick={onReset}
                    className="px-6 py-3 font-semibold rounded-xl hover:opacity-90 transition shadow-md w-full mt-4 bg-primary text-primary-content">
                    Submit Another Response
                </button>
            </div>
        </div>
    );
}

// ─── Draft / Not Found Screen ─────────────────────────────────────────────────
function NotFoundScreen({ slug, isDraft }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="max-w-md w-full text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
                    {isDraft ? <Clock className="w-8 h-8 text-gray-500" /> : <AlertCircle className="w-8 h-8 text-gray-500" />}
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                    {isDraft ? "This Page is Not Live Yet" : "Page Not Found"}
                </h2>
                <p className="text-gray-500 text-sm">
                    {isDraft
                        ? "This event page is currently in Draft mode. Please check back later."
                        : `No event page found for "${slug}". The link may be incorrect.`}
                </p>
            </div>
        </div>
    );
}

// ─── Main Public Event Page ───────────────────────────────────────────────────
export default function DynamicEventPage() {
    const params = useParams();
    const slug = params?.slug || "";

    const [schema, setSchema] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);
    // prevent a very brief "Not Found" flash while client data hydrates
    const [showNotFound, setShowNotFound] = useState(false);
    // whether we've attempted to load the event from the API at least once
    const [attemptedFetch, setAttemptedFetch] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!slug) return;
        const controller = new AbortController();
        setLoading(true);
        setAttemptedFetch(true);
        import("axios").then((axios) => {
            axios.default.get(`/api/events/${slug}`, { signal: controller.signal })
                .then((res) => {
                    if (res.data?.event) {
                        const ev = res.data.event;
                        setSchema({
                            page_title: ev.title,
                            page_slug: ev.slug,
                            description: ev.description,
                            submit_label: ev.submit_label,
                            color: ev.theme_color,
                            isActive: ev.is_active,
                            fields: ev.schema_fields || []
                        });
                    } else {
                        // fallback or not found, keeping MOCK_SCHEMAS for visual fail-safe
                        setSchema(MOCK_SCHEMAS[slug] || null);
                    }
                })
                .catch((err) => {
                    if (err?.code === "ERR_CANCELED" || err?.name === "AbortError") return;
                    console.error("Failed to load schema:", err);
                    setSchema(MOCK_SCHEMAS[slug] || null);
                })
                .finally(() => {
                    setLoading(false);
                });
        });
        return () => { controller.abort(); };
    }, [slug]);

    // Check localStorage to see if this device/browser already registered for this event
    useEffect(() => {
        if (!slug) return;
        try {
            const key = `registered_event_${slug}`;
            const stored = typeof window !== "undefined" ? localStorage.getItem(key) : null;
            if (stored) setAlreadyRegistered(true);
        } catch (err) {
            console.warn("localStorage unavailable", err);
        }
    }, [slug]);

    // Delay showing the NotFound screen slightly so we don't flash it.
    // Only show NotFound after we've actually attempted a fetch.
    useEffect(() => {
        let t;
        // Wait a bit longer before showing the NotFound screen to avoid
        // a brief flash while the client data hydrates / the API responds.
        if (attemptedFetch && !loading && !schema) {
            t = setTimeout(() => setShowNotFound(true), 800);
        } else {
            setShowNotFound(false);
        }
        return () => clearTimeout(t);
    }, [loading, schema, attemptedFetch]);

    const setField = (key, val) => {
        setFormData(prev => ({ ...prev, [key]: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const axios = (await import("axios")).default;
            await axios.post(`/api/events/${slug}/submit`, { formData });
            console.log("Form submitted successfully.");
            // persist registration locally so the same browser cannot re-submit for same event
            try {
                const key = `registered_event_${slug}`;
                localStorage.setItem(key, JSON.stringify({ time: Date.now(), data: formData }));
                setAlreadyRegistered(true);
            } catch (err) {
                console.warn("Failed to persist registration locally:", err);
            }
            toast.success(`Registration received for ${schema?.page_title || "this event"}`);
            setFormData({});
            // wait for toast to show, then navigate back to events listing
            setTimeout(() => router.push('/events'), 2000);
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Failed to submit form. Please try again.");
            setTimeout(() => router.push('/events'), 2000);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="flex items-center justify-center">
                    <AnimatedLooader message="Loading event..." />
                </div>
            </div>
        );
    }

    // Avoid flashing the NotFound screen for a very short moment during
    // client-side navigation/hydration — keep showing the loader until the
    // small delay passes (see showNotFound state/effect above).
    if (!schema && !showNotFound) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="flex items-center justify-center">
                    <AnimatedLooader message="Loading event..." />
                </div>
            </div>
        );
    }

    if (!schema) return <NotFoundScreen slug={slug} isDraft={false} />;
    if (!schema.isActive) return <NotFoundScreen slug={slug} isDraft={true} />;

    return (
        <main className="min-h-screen bg-base-100 flex flex-col font-sans text-base-content">
            {/* Page Title Bar */}
            <div className="bg-base-100 px-4 py-5">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <Link href="/events" className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-base-200 text-base-content transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-base-content">Event Registration</h1>
                </div>
            </div>

            {/* Event Announcement Card */}
            <div className="max-w-xl mx-auto px-4 pt-4">
                <div className="flex items-center gap-4 px-4 py-4 bg-primary text-primary-content rounded-xl shadow-md">
                    <div className="flex-shrink-0 w-11 h-11 rounded-full bg-primary-content/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-base font-bold leading-tight">{schema.page_title}</div>
                        {schema.description && (
                            <div className="text-sm opacity-90 mt-0.5 line-clamp-1">{schema.description}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="max-w-xl mx-auto px-4 py-8">
                {alreadyRegistered ? (
                    <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden p-6 text-center">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg bg-primary">
                            <CheckCircle className="w-10 h-10 text-primary-content" />
                        </div>
                        <h2 className="text-2xl font-bold mt-4 text-base-content">You are already registered</h2>
                        <p className="opacity-70 mt-2">
                            Our records show you've already submitted a registration for <strong>{schema.page_title}</strong>.
                        </p>
                        <div className="mt-5 flex gap-3 justify-center">
                            <Link href="/events" className="px-6 py-3 font-semibold rounded-xl hover:opacity-90 transition shadow-md bg-primary text-primary-content">Back to Events</Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}
                        className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden text-base-content">
                        {/* Progress indicator */}
                        <div className="h-1 w-full bg-base-300">
                            <div className="h-full transition-all duration-500 bg-primary"
                                style={{
                                    width: `${Math.min(100, (Object.keys(formData).filter(k => formData[k] !== "" && formData[k] !== undefined && formData[k] !== false && !(Array.isArray(formData[k]) && formData[k].length === 0)).length / Math.max(1, schema.fields.filter(f => !["divider", "heading"].includes(f.type)).length)) * 100)}%`
                                }} />
                        </div>

                        <div className="p-6 space-y-6">
                            {schema.fields.map(field => (
                                <FieldWrapper
                                    key={field.id}
                                    field={field}
                                    value={formData[field.key]}
                                    onChange={val => setField(field.key, val)}
                                />
                            ))}

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3.5 text-primary-content font-bold rounded-xl hover:opacity-90 active:scale-[0.99] transition shadow-md disabled:opacity-70 flex items-center justify-center gap-2 text-base bg-primary">
                                    {submitting ? (
                                        <AnimatedLooader className="inline-block" message="Submitting..." />
                                    ) : (
                                        schema.submit_label || "Submit"
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </main>
    );
}
