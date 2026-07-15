import type { GradientField, GradientSpec } from "../generate.ts";
import type { RasterOptions } from "./raster.ts";
import { toSvgDataUri } from "./svg.ts";

const VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
out vec2 vUv;

void main() {
	vUv = aPosition * 0.5 + 0.5;
	gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

struct GradientField {
	vec2 center;
	vec2 radius;
	vec2 direction;
	float phase;
	float speed;
	float strength;
};

uniform sampler2D uArtwork;
uniform vec2 uResolution;
uniform vec2 uArtworkSize;
uniform vec2 uFlowDirection;
uniform vec4 uMotionSeed;
uniform float uTime;
uniform float uIntroduction;
uniform float uStrength;
uniform int uFieldCount;
uniform GradientField uFields[4];

in vec2 vUv;
out vec4 outColor;

vec2 coverUv(vec2 uv) {
	float viewportAspect = uResolution.x / uResolution.y;
	float artworkAspect = uArtworkSize.x / uArtworkSize.y;
	vec2 scale = vec2(1.0);

	if (viewportAspect > artworkAspect) {
		scale.y = artworkAspect / viewportAspect;
	} else {
		scale.x = viewportAspect / artworkAspect;
	}

	return (uv - 0.5) * scale + 0.5;
}

mat2 rotation(float angle) {
	float sine = sin(angle);
	float cosine = cos(angle);
	return mat2(cosine, -sine, sine, cosine);
}

vec2 mirroredUv(vec2 uv) {
	vec2 wrapped = mod(uv, 2.0);
	return 1.0 - abs(wrapped - 1.0);
}

float randomValue(float value) {
	float seed = dot(uMotionSeed, vec4(41.37, 73.91, 113.57, 157.31));
	return fract(sin(value * 127.1 + seed) * 43758.5453);
}

float smoothRandom(float value) {
	float lower = floor(value);
	float blend = fract(value);
	blend = blend * blend * (3.0 - 2.0 * blend);
	return mix(randomValue(lower), randomValue(lower + 1.0), blend);
}

vec2 evolvingFlowDirection() {
	float mediumTime = uTime * mix(0.018, 0.032, uMotionSeed.x)
		+ uMotionSeed.y * 19.0;
	float longTime = uTime * mix(0.0045, 0.009, uMotionSeed.z)
		+ uMotionSeed.w * 31.0;
	float randomTurn = (smoothRandom(mediumTime) * 2.0 - 1.0) * 0.52
		+ (smoothRandom(longTime + 47.0) * 2.0 - 1.0) * 0.3;
	float breathingTurn = sin(
		uTime * mix(0.012, 0.021, uMotionSeed.w)
			+ uMotionSeed.x * 6.2831853
	) * 0.12;
	return rotation(randomTurn + breathingTurn) * uFlowDirection;
}

vec2 broadWarp(vec2 uv, float amount, vec2 flowDirection) {
	vec2 perpendicular = vec2(-flowDirection.y, flowDirection.x);
	vec2 centered = uv - 0.5;
	vec2 position = vec2(
		dot(centered, flowDirection),
		dot(centered, perpendicular)
	);
	float currentTime = uTime * mix(0.41, 0.58, uMotionSeed.y);
	float phase = uMotionSeed.z * 6.2831853;
	float mutationA = smoothRandom(
		uTime * mix(0.006, 0.011, uMotionSeed.z) + 211.0
	);
	float mutationB = smoothRandom(
		uTime * mix(0.004, 0.008, uMotionSeed.x) + 307.0
	);
	float sweepPhase = position.y * mix(
		3.25,
		5.05,
		uMotionSeed.x * 0.55 + mutationA * 0.45
	) + position.x * mix(
		0.22,
		0.72,
		uMotionSeed.w * 0.58 + mutationB * 0.42
	);
	float sweep = sin(
		sweepPhase - currentTime * mix(0.64, 0.96, uMotionSeed.z) + phase
	) - sin(sweepPhase + phase);
	float sweepEnvelope = 0.72 + smoothRandom(
		uTime * mix(0.014, 0.024, uMotionSeed.y) + 83.0
	) * 0.38;
	position.x += sweep * 0.057 * sweepEnvelope * amount;
	float billowPhase = position.x * mix(
		2.65,
		4.05,
		uMotionSeed.w * 0.62 + mutationB * 0.38
	) - position.y * mix(0.2, 0.61, mutationA);
	float billow = sin(
		billowPhase + currentTime * mix(0.38, 0.69, uMotionSeed.y) - phase * 0.71
	) - sin(billowPhase - phase * 0.71);
	float billowEnvelope = 0.68 + smoothRandom(
		uTime * mix(0.009, 0.017, uMotionSeed.z) + 131.0
	) * 0.44;
	position.y += billow * 0.033 * billowEnvelope * amount;
	float foldPhase = position.y * mix(
		1.95,
		3.45,
		uMotionSeed.z * 0.52 + mutationB * 0.48
	) + position.x * mix(0.16, 0.52, uMotionSeed.y);
	float fold = cos(
		foldPhase + currentTime * mix(0.2, 0.43, uMotionSeed.x) + phase * 1.37
	) - cos(foldPhase + phase * 1.37);
	position.x += fold * mix(0.017, 0.033, mutationB) * amount;
	float crossPhase = position.x * 1.73 - position.y * 2.19;
	float crossCurrent = sin(
		crossPhase - currentTime * mix(0.17, 0.31, uMotionSeed.w) - phase * 0.43
	) - sin(crossPhase - phase * 0.43);
	position -= flowDirection
		* crossCurrent
		* mix(0.007, 0.019, mutationA)
		* amount;
	position += vec2(
		(sin(currentTime * mix(0.29, 0.47, uMotionSeed.x) + phase)
			- sin(phase)) * 0.038,
		(sin(currentTime * mix(0.21, 0.36, uMotionSeed.z) - phase)
			+ sin(phase)) * 0.025
	) * amount;
	return 0.5 + flowDirection * position.x + perpendicular * position.y;
}

vec2 vortexWarp(
	vec2 uv,
	GradientField field,
	float amount,
	vec2 flowDirection
) {
	float fieldTime = uTime * field.speed;
	float wanderRate = mix(0.055, 0.105, uMotionSeed.y);
	vec2 center = field.center + vec2(
		sin(fieldTime * wanderRate + field.phase) - sin(field.phase),
		cos(fieldTime * wanderRate * 0.73 - field.phase)
			- cos(-field.phase)
	) * 0.036 * amount;
	vec2 randomWander = vec2(
		smoothRandom(
			uTime * mix(0.009, 0.016, uMotionSeed.x)
				+ field.phase * 4.17
				+ 239.0
		),
		smoothRandom(
			uTime * mix(0.006, 0.013, uMotionSeed.z)
				- field.phase * 5.31
				+ 353.0
		)
	) - 0.5;
	center += randomWander * 0.07 * amount;
	vec2 delta = uv - center;
	float radius = max(max(field.radius.x, field.radius.y), 0.28);
	radius *= mix(0.82, 1.22, smoothRandom(
		uTime * mix(0.005, 0.011, uMotionSeed.w)
			+ field.phase * 3.73
			+ 419.0
	));
	float influence = exp(-dot(delta, delta) / (radius * radius) * 1.18);
	float primary = sin(fieldTime * 0.43 + field.phase) - sin(field.phase);
	float secondary = cos(fieldTime * 0.263 - field.phase)
		- cos(-field.phase);
	float longMutation = sin(fieldTime * 0.087 + field.phase * 0.37)
		- sin(field.phase * 0.37);
	float polarity = mix(0.72, 1.18, smoothRandom(
		abs(fieldTime) * mix(0.018, 0.031, uMotionSeed.w)
			+ field.phase * 2.7
	));
	float mutationStrength = mix(0.76, 1.28, smoothRandom(
		uTime * mix(0.006, 0.012, uMotionSeed.x)
			+ field.phase * 6.19
			+ 487.0
	));
	float directionScale = 0.86
		+ abs(dot(field.direction, flowDirection)) * 0.14;
	float angle = (primary + secondary * 0.42 + longMutation * 0.34)
		* field.strength
		* polarity
		* mutationStrength
		* directionScale
		* influence
		* amount;
	return center + rotation(angle) * delta;
}

void main() {
	vec2 coveredUv = coverUv(vUv);
	float amount = uStrength * uIntroduction;
	vec2 flowDirection = evolvingFlowDirection();
	vec2 warpedUv = broadWarp(coveredUv, amount, flowDirection);

	for (int index = 0; index < 4; index++) {
		if (index >= uFieldCount) {
			break;
		}
		warpedUv = vortexWarp(
			warpedUv,
			uFields[index],
			amount,
			flowDirection
		);
	}

	outColor = vec4(texture(uArtwork, mirroredUv(warpedUv)).rgb, 1.0);
}`;

interface FieldUniforms {
	center: WebGLUniformLocation;
	radius: WebGLUniformLocation;
	direction: WebGLUniformLocation;
	phase: WebGLUniformLocation;
	speed: WebGLUniformLocation;
	strength: WebGLUniformLocation;
}

interface AnimatedField {
	center: [number, number];
	radius: [number, number];
	direction: [number, number];
	phase: number;
	speed: number;
	strength: number;
}

type MotionSeed = [number, number, number, number];

const INTRODUCTION_DURATION = 1.4;

function introductionProgress(value: number): number {
	const progress = Math.min(1, Math.max(0, value / INTRODUCTION_DURATION));
	return progress * progress * (3 - 2 * progress);
}

function acceleratedTime(value: number): number {
	const elapsed = Math.max(0, value);
	if (elapsed >= INTRODUCTION_DURATION) {
		return elapsed - INTRODUCTION_DURATION / 2;
	}
	const progress = elapsed / INTRODUCTION_DURATION;
	return (
		INTRODUCTION_DURATION *
		(progress * progress * progress - 0.5 * progress ** 4)
	);
}

interface AnimatedGradientRenderer {
	destroy(): void;
	render(time: number): void;
	resize(): boolean;
}

interface AnimatedGradientUniforms {
	artwork: WebGLUniformLocation;
	artworkTexture: WebGLUniformLocation;
	fieldCount: WebGLUniformLocation;
	fields: FieldUniforms[];
	flow: WebGLUniformLocation;
	introduction: WebGLUniformLocation;
	motion: WebGLUniformLocation;
	resolution: WebGLUniformLocation;
	strength: WebGLUniformLocation;
	time: WebGLUniformLocation;
}

interface AnimatedGradientResources {
	activeState: AnimatedGradientState | null;
	buffer: WebGLBuffer;
	context: WebGL2RenderingContext;
	position: number;
	program: WebGLProgram;
	uniforms: AnimatedGradientUniforms;
}

interface AnimatedGradientState {
	artworkSize: [number, number];
	direction: [number, number];
	fields: AnimatedField[];
	motion: MotionSeed;
	speed: number;
	strength: number;
	texture: WebGLTexture;
}

interface AnimatedGradientSurfaceRenderer {
	destroy(): void;
	render(time: number, width: number, height: number, viewportY?: number): void;
}

export interface AnimatedCanvasOptions extends RasterOptions {
	maxPixelRatio?: number;
	speed?: number;
	strength?: number;
}

/** Supported motion ranges for animated canvas renderers. */
export const ANIMATION_RANGES = {
	speed: { min: 0, max: 10 },
	strength: { min: 0, max: 3 },
} as const;

export interface AnimatedCanvas extends AnimatedGradientRenderer {
	canvas: HTMLCanvasElement;
}

export interface AnimatedCanvasGroup {
	destroy(): void;
	register(
		spec: GradientSpec,
		canvas: HTMLCanvasElement,
		options?: AnimatedCanvasOptions,
	): Promise<AnimatedCanvas | null>;
}

function validateAnimatedCanvasOptions(options: AnimatedCanvasOptions): void {
	const speed = options.speed ?? 1;
	const strength = options.strength ?? 1.2;
	for (const [name, value, range] of [
		["speed", speed, ANIMATION_RANGES.speed],
		["strength", strength, ANIMATION_RANGES.strength],
	] as const) {
		if (!Number.isFinite(value) || value < range.min || value > range.max) {
			throw new RangeError(
				`${name} must be a finite number between ${range.min} and ${range.max}`,
			);
		}
	}
}

function compileShader(
	context: WebGL2RenderingContext,
	type: number,
	source: string,
): WebGLShader | null {
	const shader = context.createShader(type);
	if (!shader) {
		return null;
	}

	context.shaderSource(shader, source);
	context.compileShader(shader);
	if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
		context.deleteShader(shader);
		return null;
	}

	return shader;
}

function createProgram(context: WebGL2RenderingContext): WebGLProgram | null {
	const vertexShader = compileShader(
		context,
		context.VERTEX_SHADER,
		VERTEX_SHADER,
	);
	const fragmentShader = compileShader(
		context,
		context.FRAGMENT_SHADER,
		FRAGMENT_SHADER,
	);
	if (!vertexShader || !fragmentShader) {
		if (vertexShader) context.deleteShader(vertexShader);
		if (fragmentShader) context.deleteShader(fragmentShader);
		return null;
	}

	const program = context.createProgram();
	if (!program) {
		context.deleteShader(vertexShader);
		context.deleteShader(fragmentShader);
		return null;
	}

	context.attachShader(program, vertexShader);
	context.attachShader(program, fragmentShader);
	context.linkProgram(program);
	context.deleteShader(vertexShader);
	context.deleteShader(fragmentShader);

	if (!context.getProgramParameter(program, context.LINK_STATUS)) {
		context.deleteProgram(program);
		return null;
	}

	return program;
}

function uniform(
	context: WebGL2RenderingContext,
	program: WebGLProgram,
	name: string,
): WebGLUniformLocation | null {
	return context.getUniformLocation(program, name);
}

function getFieldUniforms(
	context: WebGL2RenderingContext,
	program: WebGLProgram,
	index: number,
): FieldUniforms | null {
	const center = uniform(context, program, `uFields[${index}].center`);
	const radius = uniform(context, program, `uFields[${index}].radius`);
	const direction = uniform(context, program, `uFields[${index}].direction`);
	const phase = uniform(context, program, `uFields[${index}].phase`);
	const speed = uniform(context, program, `uFields[${index}].speed`);
	const strength = uniform(context, program, `uFields[${index}].strength`);

	if (!center || !radius || !direction || !phase || !speed || !strength) {
		return null;
	}

	return { center, direction, phase, radius, speed, strength };
}

function extent(field: GradientField): [number, number] {
	let x = 0.36;
	let y = 0.36;

	for (const point of field.points) {
		x = Math.max(x, Math.abs(point.x));
		y = Math.max(y, Math.abs(point.y));
	}

	return [x + field.feather, y + field.feather];
}

function fieldDirection(field: GradientField): [number, number] {
	const point = field.points[0];
	const x = point?.x ?? 1;
	const y = point?.y ?? 0;
	const length = Math.hypot(x, y) || 1;
	return [x / length, y / length];
}

function motionKey(spec: GradientSpec): string {
	return [
		spec.seed,
		...spec.palette.map((color) => color.hex),
		...spec.fields.map((field) => `${field.x}:${field.y}:${field.feather}`),
	].join("|");
}

function motionHash(key: string): number {
	let hash = 2166136261;
	for (let index = 0; index < key.length; index++) {
		hash ^= key.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	hash ^= hash >>> 16;
	hash = Math.imul(hash, 0x85ebca6b);
	hash ^= hash >>> 13;
	hash = Math.imul(hash, 0xc2b2ae35);
	hash ^= hash >>> 16;
	return hash >>> 0;
}

function motionSeed(spec: GradientSpec): MotionSeed {
	const key = motionKey(spec);
	return [0, 1, 2, 3].map(
		(index) => motionHash(`${key}|motion:${index}`) / 4294967296,
	) as MotionSeed;
}

function flowDirection(spec: GradientSpec): [number, number] {
	const unsigned = motionHash(motionKey(spec));
	const angle =
		(unsigned / 4294967296) * Math.PI * 2 + spec.palette.length * 2.399963;
	return [Math.cos(angle), Math.sin(angle)];
}

function animatedField(
	field: GradientField,
	index: number,
	seed: MotionSeed,
): AnimatedField {
	const phaseMotion = seed[index % seed.length] ?? 0;
	const variationMotion = seed[(index + 1) % seed.length] ?? 0;
	const directionMotion = seed[(index + 2) % seed.length] ?? 0;
	const strengthMotion = seed[(index + 3) % seed.length] ?? 0;
	const phaseSeed = Math.abs(
		field.x * 12.9898 + field.y * 78.233 + index * 37.719 + phaseMotion * 53.17,
	);
	const phase = (phaseSeed - Math.floor(phaseSeed)) * Math.PI * 2;
	const variation = Math.abs(
		Math.sin(phase * 1.73 + variationMotion * Math.PI * 2),
	);
	const direction = Math.sin(phase + directionMotion * 11.41) >= 0 ? 1 : -1;

	return {
		center: [field.x, 1 - field.y],
		direction: fieldDirection(field),
		phase,
		radius: extent(field),
		speed: (0.46 + variation * 0.42) * direction,
		strength: 0.14 + field.feather * 0.22 + strengthMotion * 0.035,
	};
}

function makeTexture(
	context: WebGL2RenderingContext,
	source: TexImageSource,
): WebGLTexture | null {
	const texture = context.createTexture();
	if (!texture) {
		return null;
	}

	context.bindTexture(context.TEXTURE_2D, texture);
	context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, true);
	context.texParameteri(
		context.TEXTURE_2D,
		context.TEXTURE_MIN_FILTER,
		context.LINEAR,
	);
	context.texParameteri(
		context.TEXTURE_2D,
		context.TEXTURE_MAG_FILTER,
		context.LINEAR,
	);
	context.texParameteri(
		context.TEXTURE_2D,
		context.TEXTURE_WRAP_S,
		context.CLAMP_TO_EDGE,
	);
	context.texParameteri(
		context.TEXTURE_2D,
		context.TEXTURE_WRAP_T,
		context.CLAMP_TO_EDGE,
	);
	context.texImage2D(
		context.TEXTURE_2D,
		0,
		context.RGBA,
		context.RGBA,
		context.UNSIGNED_BYTE,
		source,
	);
	return texture;
}

function loadImage(source: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error("Failed to load gradient SVG"));
		image.src = source;
	});
}

function canvasPixelSize(
	canvas: HTMLCanvasElement,
	maxPixelRatio: number,
): [number, number] {
	const bounds = canvas.getBoundingClientRect?.() ?? {
		height: 0,
		width: 0,
	};
	const dpr = Math.min(
		typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
		Math.max(0.5, maxPixelRatio),
	);
	return [
		Math.max(
			1,
			bounds.width > 0 ? Math.round(bounds.width * dpr) : canvas.width,
		),
		Math.max(
			1,
			bounds.height > 0 ? Math.round(bounds.height * dpr) : canvas.height,
		),
	];
}

function resizeCanvas(
	canvas: HTMLCanvasElement,
	maxPixelRatio: number,
): boolean {
	const [width, height] = canvasPixelSize(canvas, maxPixelRatio);
	const changed = canvas.width !== width || canvas.height !== height;
	if (changed) {
		canvas.width = width;
		canvas.height = height;
	}
	return changed;
}

function textureSize(
	artworkWidth: number,
	artworkHeight: number,
	viewportWidth: number,
	viewportHeight: number,
): [number, number] {
	const artworkAspect = artworkWidth / artworkHeight;
	const viewportAspect = viewportWidth / viewportHeight;
	if (viewportAspect > artworkAspect) {
		return [
			Math.max(1, viewportWidth),
			Math.max(1, Math.round(viewportWidth / artworkAspect)),
		];
	}
	return [
		Math.max(1, Math.round(viewportHeight * artworkAspect)),
		Math.max(1, viewportHeight),
	];
}

function downsampleTextureSource(
	image: HTMLImageElement,
	width: number,
	height: number,
): TexImageSource {
	if (
		typeof document === "undefined" ||
		(image.naturalWidth === width && image.naturalHeight === height)
	) {
		return image;
	}
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d", { alpha: false });
	if (!context) {
		return image;
	}
	context.drawImage(image, 0, 0, width, height);
	return canvas;
}

function createAnimatedGradientResources(
	context: WebGL2RenderingContext,
): AnimatedGradientResources | null {
	const program = createProgram(context);
	if (!program) {
		return null;
	}

	const position = context.getAttribLocation(program, "aPosition");
	const artworkTexture = uniform(context, program, "uArtwork");
	const resolution = uniform(context, program, "uResolution");
	const artwork = uniform(context, program, "uArtworkSize");
	const flow = uniform(context, program, "uFlowDirection");
	const motion = uniform(context, program, "uMotionSeed");
	const time = uniform(context, program, "uTime");
	const introduction = uniform(context, program, "uIntroduction");
	const strength = uniform(context, program, "uStrength");
	const fieldCount = uniform(context, program, "uFieldCount");
	const fields = Array.from({ length: 4 }, (_, index) =>
		getFieldUniforms(context, program, index),
	);

	if (
		position < 0 ||
		!artworkTexture ||
		!resolution ||
		!artwork ||
		!flow ||
		!motion ||
		!time ||
		!introduction ||
		!strength ||
		!fieldCount ||
		fields.some((field) => !field)
	) {
		context.deleteProgram(program);
		return null;
	}

	const buffer = context.createBuffer();
	if (!buffer) {
		context.deleteProgram(program);
		return null;
	}
	context.bindBuffer(context.ARRAY_BUFFER, buffer);
	context.bufferData(
		context.ARRAY_BUFFER,
		new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
		context.STATIC_DRAW,
	);

	return {
		activeState: null,
		buffer,
		context,
		position,
		program,
		uniforms: {
			artwork,
			artworkTexture,
			fieldCount,
			fields: fields as FieldUniforms[],
			flow,
			introduction,
			motion,
			resolution,
			strength,
			time,
		},
	};
}

function destroyAnimatedGradientResources(
	resources: AnimatedGradientResources,
): void {
	resources.context.deleteBuffer(resources.buffer);
	resources.context.deleteProgram(resources.program);
	resources.activeState = null;
}

function activateAnimatedGradientResources(
	resources: AnimatedGradientResources,
	state: AnimatedGradientState,
): void {
	const { context, uniforms } = resources;
	context.useProgram(resources.program);
	context.activeTexture(context.TEXTURE0);
	context.bindTexture(context.TEXTURE_2D, state.texture);
	context.bindBuffer(context.ARRAY_BUFFER, resources.buffer);
	context.enableVertexAttribArray(resources.position);
	context.vertexAttribPointer(
		resources.position,
		2,
		context.FLOAT,
		false,
		0,
		0,
	);

	if (resources.activeState === state) {
		return;
	}
	resources.activeState = state;
	context.uniform1i(uniforms.artworkTexture, 0);
	context.uniform2f(
		uniforms.artwork,
		state.artworkSize[0],
		state.artworkSize[1],
	);
	context.uniform2f(uniforms.flow, state.direction[0], state.direction[1]);
	context.uniform4f(uniforms.motion, ...state.motion);
	context.uniform1f(uniforms.strength, state.strength);
	context.uniform1i(uniforms.fieldCount, state.fields.length);

	state.fields.forEach((field, index) => {
		const locations = uniforms.fields[index] as FieldUniforms;
		context.uniform2f(locations.center, field.center[0], field.center[1]);
		context.uniform2f(locations.radius, field.radius[0], field.radius[1]);
		context.uniform2f(
			locations.direction,
			field.direction[0],
			-field.direction[1],
		);
		context.uniform1f(locations.phase, field.phase);
		context.uniform1f(locations.speed, field.speed);
		context.uniform1f(locations.strength, field.strength);
	});
}

function createAnimatedGradientSurfaceRenderer(
	resources: AnimatedGradientResources,
	textureSource: TexImageSource,
	spec: GradientSpec,
	artworkSize: [number, number],
	speed: number,
	strength: number,
): AnimatedGradientSurfaceRenderer | null {
	const texture = makeTexture(resources.context, textureSource);
	if (!texture) {
		return null;
	}
	const seededMotion = motionSeed(spec);
	const state: AnimatedGradientState = {
		artworkSize,
		direction: flowDirection(spec),
		fields: spec.fields.map((field, index) =>
			animatedField(field, index, seededMotion),
		),
		motion: seededMotion,
		speed,
		strength,
		texture,
	};

	return {
		destroy: () => {
			if (resources.activeState === state) {
				resources.activeState = null;
			}
			resources.context.deleteTexture(texture);
		},
		render: (value, width, height, viewportY = 0) => {
			activateAnimatedGradientResources(resources, state);
			const elapsed = Number.isFinite(value) ? Math.max(0, value) : 0;
			resources.context.viewport(0, viewportY, width, height);
			resources.context.uniform2f(resources.uniforms.resolution, width, height);
			resources.context.uniform1f(
				resources.uniforms.time,
				acceleratedTime(elapsed) * state.speed,
			);
			resources.context.uniform1f(
				resources.uniforms.introduction,
				introductionProgress(elapsed),
			);
			resources.context.drawArrays(resources.context.TRIANGLES, 0, 6);
		},
	};
}

function createAnimatedGradientRenderer(
	canvas: HTMLCanvasElement,
	textureSource: TexImageSource,
	spec: GradientSpec,
	artworkSize: [number, number],
	speed: number,
	strength: number,
	maxPixelRatio: number,
): AnimatedGradientRenderer | null {
	const context = canvas.getContext("webgl2", {
		alpha: false,
		antialias: false,
		depth: false,
		powerPreference: "low-power",
		preserveDrawingBuffer: false,
		stencil: false,
	});
	if (!context) {
		return null;
	}

	const resources = createAnimatedGradientResources(context);
	if (!resources) {
		return null;
	}
	const surfaceRenderer = createAnimatedGradientSurfaceRenderer(
		resources,
		textureSource,
		spec,
		artworkSize,
		speed,
		strength,
	);
	if (!surfaceRenderer) {
		destroyAnimatedGradientResources(resources);
		return null;
	}

	return {
		destroy: () => {
			surfaceRenderer.destroy();
			destroyAnimatedGradientResources(resources);
		},
		render: (value) =>
			surfaceRenderer.render(value, canvas.width, canvas.height),
		resize: () => resizeCanvas(canvas, maxPixelRatio),
	};
}

/** Creates an animated renderer for an existing canvas. Browser-only. */
export async function drawToAnimatedCanvas(
	spec: GradientSpec,
	canvas: HTMLCanvasElement,
	options: AnimatedCanvasOptions = {},
): Promise<AnimatedCanvas | null> {
	validateAnimatedCanvasOptions(options);
	if (typeof Image === "undefined") {
		throw new Error("drawToAnimatedCanvas requires a browser environment");
	}
	const {
		width = canvas.width || 1000,
		height = canvas.height || 1000,
		maxPixelRatio = 2,
		speed = 1,
		strength = 1.2,
	} = options;
	resizeCanvas(canvas, maxPixelRatio);
	const [textureWidth, textureHeight] = textureSize(
		width,
		height,
		canvas.width,
		canvas.height,
	);
	const image = await loadImage(toSvgDataUri(spec, { width, height }));
	const textureSource = downsampleTextureSource(
		image,
		textureWidth,
		textureHeight,
	);
	const renderer = createAnimatedGradientRenderer(
		canvas,
		textureSource,
		spec,
		[width, height],
		speed,
		strength,
		maxPixelRatio,
	);
	if (!renderer) {
		return null;
	}
	renderer.resize();
	renderer.render(0);
	return { canvas, ...renderer };
}

/** Creates a canvas and its animated renderer. Browser-only. */
export async function toAnimatedCanvas(
	spec: GradientSpec,
	options: AnimatedCanvasOptions = {},
): Promise<AnimatedCanvas | null> {
	if (typeof document === "undefined") {
		throw new Error("toAnimatedCanvas requires a browser environment");
	}
	const { width = 1000, height = 1000, scale = 1 } = options;
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(width * scale);
	canvas.height = Math.round(height * scale);
	return drawToAnimatedCanvas(spec, canvas, options);
}

/** Creates a multi-canvas animated renderer backed by one shared WebGL 2 context. */
export function createAnimatedCanvasGroup(): AnimatedCanvasGroup | null {
	if (typeof document === "undefined") {
		throw new Error("createAnimatedCanvasGroup requires a browser environment");
	}
	const surface = document.createElement("canvas");
	surface.width = 1;
	surface.height = 1;
	const context = surface.getContext("webgl2", {
		alpha: false,
		antialias: false,
		depth: false,
		powerPreference: "low-power",
		preserveDrawingBuffer: false,
		stencil: false,
	});
	if (!context) {
		return null;
	}
	const resources = createAnimatedGradientResources(context);
	if (!resources) {
		context.getExtension("WEBGL_lose_context")?.loseContext();
		return null;
	}

	const entries = new Set<AnimatedCanvas>();
	let destroyed = false;
	const growSurface = (width: number, height: number): void => {
		const nextWidth = Math.max(surface.width, width);
		const nextHeight = Math.max(surface.height, height);
		if (surface.width === nextWidth && surface.height === nextHeight) {
			return;
		}
		surface.width = nextWidth;
		surface.height = nextHeight;
		resources.activeState = null;
	};

	return {
		destroy: () => {
			if (destroyed) {
				return;
			}
			destroyed = true;
			for (const entry of [...entries]) {
				entry.destroy();
			}
			entries.clear();
			destroyAnimatedGradientResources(resources);
			context.getExtension("WEBGL_lose_context")?.loseContext();
		},
		register: async (
			spec: GradientSpec,
			canvas: HTMLCanvasElement,
			options: AnimatedCanvasOptions = {},
		) => {
			validateAnimatedCanvasOptions(options);
			if (destroyed) {
				return null;
			}
			const target = canvas.getContext("2d", { alpha: false });
			if (!target) {
				return null;
			}
			const {
				width = canvas.width || 1000,
				height = canvas.height || 1000,
				maxPixelRatio = 2,
				speed = 1,
				strength = 1.2,
			} = options;
			resizeCanvas(canvas, maxPixelRatio);
			const [textureWidth, textureHeight] = textureSize(
				width,
				height,
				canvas.width,
				canvas.height,
			);
			const image = await loadImage(toSvgDataUri(spec, { width, height }));
			if (destroyed) {
				return null;
			}
			const textureSource = downsampleTextureSource(
				image,
				textureWidth,
				textureHeight,
			);
			const renderer = createAnimatedGradientSurfaceRenderer(
				resources,
				textureSource,
				spec,
				[width, height],
				speed,
				strength,
			);
			if (!renderer) {
				return null;
			}

			let entry: AnimatedCanvas;
			let entryDestroyed = false;
			const render = (time: number): void => {
				if (entryDestroyed || destroyed) {
					return;
				}
				growSurface(canvas.width, canvas.height);
				renderer.render(
					time,
					canvas.width,
					canvas.height,
					surface.height - canvas.height,
				);
				target.drawImage(
					surface,
					0,
					0,
					canvas.width,
					canvas.height,
					0,
					0,
					canvas.width,
					canvas.height,
				);
			};
			entry = {
				canvas,
				destroy: () => {
					if (entryDestroyed) {
						return;
					}
					entryDestroyed = true;
					entries.delete(entry);
					renderer.destroy();
				},
				render,
				resize: () => {
					return resizeCanvas(canvas, maxPixelRatio);
				},
			};
			entries.add(entry);
			render(0);
			return entry;
		},
	};
}
