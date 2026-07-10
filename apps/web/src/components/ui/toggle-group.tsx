import { cva, type VariantProps } from "class-variance-authority";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "#/lib/utils.ts";

const toggleGroupItemVariants = cva(
	"inline-flex items-center justify-center gap-1 whitespace-nowrap font-medium text-muted-foreground transition-all outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm dark:data-[state=on]:bg-input/60 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
	{
		variants: {
			size: {
				default: "h-7 rounded-md px-2.5 text-xs",
				xs: "h-5 rounded-[5px] px-1.5 text-[11px]",
			},
		},
		defaultVariants: {
			size: "default",
		},
	},
);

const ToggleGroupContext = React.createContext<
	VariantProps<typeof toggleGroupItemVariants>
>({ size: "default" });

function ToggleGroup({
	className,
	size,
	children,
	...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
	VariantProps<typeof toggleGroupItemVariants>) {
	return (
		<ToggleGroupPrimitive.Root
			data-slot="toggle-group"
			className={cn(
				"inline-flex w-fit items-center gap-0.5 rounded-md bg-muted p-0.5",
				className,
			)}
			{...props}
		>
			<ToggleGroupContext.Provider value={{ size }}>
				{children}
			</ToggleGroupContext.Provider>
		</ToggleGroupPrimitive.Root>
	);
}

function ToggleGroupItem({
	className,
	children,
	size,
	...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
	VariantProps<typeof toggleGroupItemVariants>) {
	const context = React.useContext(ToggleGroupContext);

	return (
		<ToggleGroupPrimitive.Item
			data-slot="toggle-group-item"
			className={cn(
				toggleGroupItemVariants({ size: size ?? context.size }),
				className,
			)}
			{...props}
		>
			{children}
		</ToggleGroupPrimitive.Item>
	);
}

export { ToggleGroup, ToggleGroupItem };
