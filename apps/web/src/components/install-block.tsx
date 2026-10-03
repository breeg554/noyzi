import { useState } from "react";
import { CodeBlock } from "#/components/code-block.tsx";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group.tsx";
import { analytics } from "#/lib/analytics.ts";

const PACKAGE_MANAGERS = ["npm", "pnpm", "bun"] as const;

type PackageManager = (typeof PACKAGE_MANAGERS)[number];

const COMMANDS: Record<PackageManager, string> = {
	npm: "npm install",
	pnpm: "pnpm add",
	bun: "bun add",
};

export function InstallBlock({
	packages,
	className,
}: {
	packages: string;
	className?: string;
}) {
	const [pm, setPm] = useState<PackageManager>("npm");

	return (
		<CodeBlock
			className={className}
			onCopy={() => analytics.installCommandCopied(pm, packages)}
			lang="bash"
			code={`${COMMANDS[pm]} ${packages}`}
			label={
				<ToggleGroup
					type="single"
					size="xs"
					value={pm}
					onValueChange={(value) => {
						if (value && value !== pm) {
							setPm(value as PackageManager);
							analytics.packageManagerSelected(value);
						}
					}}
					aria-label="Package manager"
					className="-ml-2.5"
				>
					{PACKAGE_MANAGERS.map((manager) => (
						<ToggleGroupItem
							key={manager}
							value={manager}
							className="font-mono"
						>
							{manager}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			}
		/>
	);
}
