export default function pojoHeaders(headers) {
	if (!headers?.entries) return headers;

	const results = {};

	const keyVals = [...headers.entries()];
	keyVals.forEach(([key, val]) => {
		results[key] = val;
	});

	return results;
}
