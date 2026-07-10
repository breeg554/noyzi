import { MeshyGradient } from "@meshy/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

const users = [
	"dawn@example.com",
	"meadow@example.com",
	"dusk@example.com",
	"olive@example.com",
	"iris@example.com",
	"sand@example.com",
	"lagoon@example.com",
	"ember@example.com",
];

function Home() {
	return (
		<main className="min-h-screen bg-slate-950 p-8">
			<h1 className="text-2xl font-semibold text-white">Hello World</h1>
			<div className="mt-8 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
				{users.map((user) => (
					<MeshyGradient
						key={user}
						seed={user}
						className="aspect-[3/4] rounded-2xl"
						title={user}
					/>
				))}
			</div>
		</main>
	);
}
