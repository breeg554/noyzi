import { getRouteApi } from "@tanstack/react-router";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button.tsx";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible.tsx";
import { Slider } from "#/components/ui/slider.tsx";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group.tsx";
import { playBoop } from "#/lib/click-sound.ts";
import {
	DEFAULT_GALLERY_OPTIONS,
	type GalleryOptions,
	isDefaultGalleryOptions,
	MAX_COLORS,
	MIN_COLORS,
	ROUNDED,
	resolveGalleryOptions,
	toGallerySearch,
} from "#/lib/gallery-options.ts";
import { cn } from "#/lib/utils.ts";

const route = getRouteApi("/");

interface ControlProps {
	options: GalleryOptions;
	update: (patch: Partial<GalleryOptions>) => void;
}

export function GalleryToolbar() {
	const search = route.useSearch();
	const navigate = route.useNavigate();
	const options = resolveGalleryOptions(search);
	const isDefault = isDefaultGalleryOptions(options);

	const update = (patch: Partial<GalleryOptions>) => {
		navigate({
			search: toGallerySearch({ ...options, ...patch }),
			replace: true,
			resetScroll: false,
		});
	};

	return (
		<>
			<div className="hidden flex-wrap items-center gap-x-4 gap-y-2 md:flex">
				<ControlLabel label="colors">
					<ColorsControl options={options} update={update} />
				</ControlLabel>
				<Separator />
				<ControlLabel label="vignette">
					<VignetteControl options={options} update={update} />
				</ControlLabel>
				<Separator />

				<ControlLabel label="rounded">
					<RoundedControl options={options} update={update} />
				</ControlLabel>

				<ResetButton disabled={isDefault} update={update} />
			</div>

			<Collapsible className="contents md:hidden">
				<CollapsibleTrigger asChild>
					<Button
						variant="ghost"
						size="xs"
						sound="boop"
						className="text-muted-foreground data-[state=open]:text-foreground"
					>
						<SlidersHorizontal />
						filters
						{!isDefault && (
							<span aria-hidden className="size-1.5 rounded-full bg-primary" />
						)}
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent className="basis-full">
					<div className="flex flex-col gap-3 px-0.5 pt-3 pb-1">
						<MobileRow label="colors">
							<ColorsControl options={options} update={update} />
						</MobileRow>
						<MobileRow label="vignette">
							<VignetteControl options={options} update={update} />
						</MobileRow>
						<MobileRow label="rounded">
							<RoundedControl options={options} update={update} />
						</MobileRow>
						<div className="flex justify-end">
							<ResetButton disabled={isDefault} update={update} />
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</>
	);
}

function ColorsControl({ options, update }: ControlProps) {
	return (
		<div className="flex items-center gap-2">
			<Slider
				value={[options.colors]}
				min={MIN_COLORS}
				max={MAX_COLORS}
				step={1}
				onValueChange={([colors]) => {
					if (colors !== undefined && colors !== options.colors) {
						playBoop();
						update({ colors });
					}
				}}
				className="w-32 md:w-20"
				aria-label="Number of colors"
			/>
			<span className="w-3 text-right text-[11px] text-muted-foreground tabular-nums">
				{options.colors}
			</span>
		</div>
	);
}

function RoundedControl({ options, update }: ControlProps) {
	return (
		<ToggleGroup
			type="single"
			size="xs"
			value={options.rounded}
			onValueChange={(rounded) => {
				if (rounded) {
					playBoop();
					update({ rounded: rounded as GalleryOptions["rounded"] });
				}
			}}
			aria-label="Corner radius"
		>
			{ROUNDED.map((rounded) => (
				<ToggleGroupItem key={rounded} value={rounded}>
					{rounded}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}

function VignetteControl({ options, update }: ControlProps) {
	return (
		<ValueSlider
			value={options.vignette}
			min={0}
			max={0.3}
			step={0.02}
			ariaLabel="Vignette strength"
			onChange={(vignette) => update({ vignette })}
		/>
	);
}

function ValueSlider({
	value,
	min,
	max,
	step,
	ariaLabel,
	onChange,
}: {
	value: number;
	min: number;
	max: number;
	step: number;
	ariaLabel: string;
	onChange: (value: number) => void;
}) {
	return (
		<div className="flex items-center gap-2">
			<Slider
				value={[value]}
				min={min}
				max={max}
				step={step}
				onValueChange={([next]) => {
					if (next !== undefined && next !== value) {
						playBoop();
						onChange(next);
					}
				}}
				className="w-24 md:w-16"
				aria-label={ariaLabel}
			/>
			<span className="w-6 text-right text-[11px] text-muted-foreground tabular-nums">
				{value.toFixed(2).replace(/^0/, "").replace(/0$/, "")}
			</span>
		</div>
	);
}

function ResetButton({
	disabled,
	update,
}: {
	disabled: boolean;
	update: ControlProps["update"];
}) {
	return (
		<Button
			variant="ghost"
			size="xs"
			sound="boop"
			aria-label="Reset options"
			disabled={disabled}
			className="text-muted-foreground disabled:opacity-30"
			onClick={() => update(DEFAULT_GALLERY_OPTIONS)}
		>
			<RotateCcw />
			reset
		</Button>
	);
}

function ControlLabel({
	label,
	className,
	children,
}: {
	label: string;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div className={cn("flex items-center gap-2", className)}>
			<span className="text-[11px] text-muted-foreground leading-none">
				{label}
			</span>
			{children}
		</div>
	);
}

function MobileRow({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-3">
			<span className="text-[11px] text-muted-foreground leading-none">
				{label}
			</span>
			{children}
		</div>
	);
}

function Separator() {
	return <div aria-hidden className="h-4 w-px bg-border" />;
}
