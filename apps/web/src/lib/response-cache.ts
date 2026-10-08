export function preventHtmlCaching(response: Response): Response {
	const contentType = response.headers
		.get("Content-Type")
		?.split(";")[0]
		?.trim()
		.toLowerCase();
	if (contentType !== "text/html") return response;
	const headers = new Headers(response.headers);
	headers.set("Cache-Control", "no-store");
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
