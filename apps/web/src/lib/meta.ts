const defaults = {
	title: "Noyzi",
	description:
		"Deterministic mesh gradients from any seed. Same seed, same gradient — every time.",
	url: "https://noyzi.dev",
	image: "https://noyzi.dev/og.png",
};

const jsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebSite",
			name: defaults.title,
			url: defaults.url,
			description: defaults.description,
		},
		{
			"@type": "SoftwareApplication",
			name: defaults.title,
			url: defaults.url,
			description: defaults.description,
			applicationCategory: "DeveloperApplication",
			operatingSystem: "Any",
			offers: {
				"@type": "Offer",
				price: "0",
				priceCurrency: "USD",
			},
		},
	],
};

type MetaOptions = {
	title?: string;
	description?: string;
	path?: string;
};

export function createMeta(options?: MetaOptions) {
	const title = options?.title ?? defaults.title;
	const description = options?.description ?? defaults.description;
	const url =
		options?.path && options.path !== "/"
			? `${defaults.url}${options.path}`
			: defaults.url;

	return {
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title },
			{ name: "description", content: description },
			{ property: "og:type", content: "website" },
			{ property: "og:site_name", content: defaults.title },
			{ property: "og:locale", content: "en_US" },
			{ property: "og:title", content: title },
			{ property: "og:description", content: description },
			{ property: "og:url", content: url },
			{ property: "og:image", content: defaults.image },
			{ property: "og:image:width", content: "1200" },
			{ property: "og:image:height", content: "629" },
			{ property: "og:image:alt", content: "Noyzi mesh gradient preview" },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
			{ name: "twitter:image", content: defaults.image },
			{ "script:ld+json": jsonLd },
		],
		links: options?.path ? [{ rel: "canonical", href: url }] : [],
	};
}
