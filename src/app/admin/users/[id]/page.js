// Allow dynamic params so IDs not present at build-time still work
export const dynamicParams = true;

export async function generateStaticParams() {
    const placeholder = [{ id: "__placeholder" }];
    try {
        const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://raahehidayat.vercel.app").replace(/\/$/, "");
        const res = await fetch(`${base}/api/auth/users`, { cache: "no-store" });
        if (!res.ok) return placeholder;
        const json = await res.json();
        const users = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        return users.length > 0 ? users.map((u) => ({ id: String(u.id) })) : placeholder;
    } catch {
        return placeholder;
    }
}

import prisma from '../../../../lib/prisma';
import { notFound } from 'next/navigation';

export default async function Page({ params }) {
    // In Next.js params can be a Promise in some runtime setups — await it.
    const resolved = await params;
    const id = resolved?.id;

    if (!id) return notFound();

    // fetch user by id from DB (server-side)
    let user;
    try {
        const intId = Number(id);
        user = await prisma.user.findUnique({ where: { id: intId } });
    } catch (err) {
        console.error('Error fetching user:', err);
        user = null;
    }

    if (!user) return notFound();

    return (
        <div className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-black">User Details</h1>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <h2 className="text-sm text-gray-500">Full name</h2>
                        <p className="mt-1 text-lg font-medium text-black">{user.fullName || '—'}</p>
                    </div>
                    <div>
                        <h2 className="text-sm text-gray-500">Email</h2>
                        <p className="mt-1 text-lg text-black">{user.email}</p>
                    </div>
                    <div>
                        <h2 className="text-sm text-gray-500">Gender</h2>
                        <p className="mt-1 text-lg text-black">{user.gender || '—'}</p>
                    </div>
                    <div>
                        <h2 className="text-sm text-gray-500">Mobile</h2>
                        <p className="mt-1 text-lg text-black">{user.mobile || '—'}</p>
                    </div>
                    <div>
                        <h2 className="text-sm text-gray-500">Password</h2>
                        <p className="mt-1 text-lg font-mono text-black">{user.password || '—'}</p>
                    </div>
                    <div className="sm:col-span-2">
                        <h2 className="text-sm text-gray-500">Address</h2>
                        <p className="mt-1 text-black">{user.address || '—'}</p>
                    </div>
                    <div className="sm:col-span-2">
                        <h2 className="text-sm text-gray-500">Area Masjid</h2>
                        <p className="mt-1 text-black">{user.areaMasjid || '—'}</p>
                    </div>
                </div>

                <div className="mt-6 border-t pt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">Created: {user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}</div>
                    <a href="/admin/users" className="px-3 py-2 bg-cyan-500 text-black rounded">Back to users</a>
                </div>
            </div>
        </div>
    );
}
