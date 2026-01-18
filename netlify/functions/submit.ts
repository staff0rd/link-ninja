type SubmitPayload = {
	filename: string;
	content: string;
};

export default async (req: Request) => {
	if (req.method !== "POST") {
		return new Response(JSON.stringify({ error: "Method not allowed" }), {
			status: 405,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Check API secret
	const apiSecret = process.env.API_SECRET;
	const clientSecret = req.headers.get("x-api-secret");

	if (!apiSecret || clientSecret !== apiSecret) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const githubPat = process.env.GITHUB_PAT;
	const repoPath = process.env.REPO_PATH;

	if (!githubPat || !repoPath) {
		return new Response(
			JSON.stringify({ error: "GitHub configuration not found" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	const [owner, repo, path] = repoPath.split("/");

	try {
		const payload: SubmitPayload = await req.json();
		const { filename, content } = payload;

		if (!filename || !content) {
			return new Response(
				JSON.stringify({ error: "Missing filename or content" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Get current content to get SHA (if file exists)
		let sha: string | undefined;
		try {
			const response = await fetch(
				`https://api.github.com/repos/${owner}/${repo}/contents/${path}/${filename}`,
				{
					headers: {
						Authorization: `Bearer ${githubPat}`,
						"Content-Type": "application/json",
					},
				},
			);
			if (response.ok) {
				const fileData = await response.json();
				sha = fileData.sha;
			}
		} catch {
			console.log("File doesn't exist yet, creating new one");
		}

		// Create/update file in GitHub
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/contents/${path}/${filename}`,
			{
				method: "PUT",
				headers: {
					Authorization: `Bearer ${githubPat}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					message: `Add ${filename}`,
					content: Buffer.from(content).toString("base64"),
					...(sha ? { sha } : {}),
				}),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			return new Response(
				JSON.stringify({
					error: `GitHub API error: ${response.statusText}`,
					details: errorText,
				}),
				{
					status: response.status,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const result = await response.json();
		return new Response(
			JSON.stringify({
				success: true,
				filename,
				url: result.content?.html_url,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Failed to submit:", error);
		return new Response(
			JSON.stringify({
				error:
					error instanceof Error ? error.message : "An unknown error occurred",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
