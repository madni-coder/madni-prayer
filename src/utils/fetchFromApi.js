const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const fetchFromApi = async (endpoint, method = "GET", payload) => {
	const url = `${baseUrl}${endpoint}`;

	let options;
	if (method && method.toUpperCase() !== "GET") {
		options = {
			method: method.toUpperCase(),
			headers: { "Content-Type": "application/json" },
			body: payload !== undefined ? JSON.stringify(payload) : undefined,
		};
	}

	const res = await fetch(url, options);

	if (!res.ok) {
		throw new Error(`API call to ${url} failed with status ${res.status}`);
	}

	return res;
};

export default fetchFromApi;
