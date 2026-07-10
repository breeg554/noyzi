import { generate, toSvgDataUri } from "@meshy/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

const seeds = [
	"dawn",
	"meadow",
	"dusk",
	"olive",
	"iris",
	"sand",
	"lagoon",
	"ember",
];

function Home() {
	return (
		<main className="min-h-screen bg-slate-950 p-8">
			<h1 className="text-2xl font-semibold text-white">Hello World</h1>
			<div className="mt-8 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
				{seeds.map((seed) => (
					<div
						key={seed}
						className="aspect-[3/4] rounded-2xl bg-cover"
						style={{
							backgroundImage: `url("${toSvgDataUri(generate(seed))}")`,
						}}
						title={seed}
					/>
				))}
			</div>
		</main>
	);
}
