let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let swooshBuffer: AudioBuffer | null = null;

function getNoiseBuffer(context: AudioContext): AudioBuffer {
	if (!noiseBuffer) {
		const length = Math.ceil(context.sampleRate * 0.03);
		noiseBuffer = context.createBuffer(1, length, context.sampleRate);
		const data = noiseBuffer.getChannelData(0);
		for (let i = 0; i < length; i++) {
			data[i] = Math.random() * 2 - 1;
		}
	}
	return noiseBuffer;
}

function getSwooshBuffer(context: AudioContext): AudioBuffer {
	if (!swooshBuffer) {
		const length = Math.ceil(context.sampleRate * 0.35);
		swooshBuffer = context.createBuffer(1, length, context.sampleRate);
		const data = swooshBuffer.getChannelData(0);
		for (let i = 0; i < length; i++) {
			data[i] = Math.random() * 2 - 1;
		}
	}
	return swooshBuffer;
}

interface ThockOptions {
	/** Body start frequency in Hz. */
	body: number;
	/** Frequency the body settles to. */
	settle: number;
	/** First overtone in Hz (~4x body, like a marimba bar). */
	overtone: number;
	/** Second, inharmonic partial in Hz (~10x body). Gives the "knock". */
	knock: number;
	/** Body volume. */
	gain: number;
	/** Body decay in seconds. */
	decay: number;
	/** Bandpass center for the impact noise. */
	noiseCenter: number;
}

/**
 * Soft, woody "thock" synthesized with the Web Audio API — no audio assets
 * needed. Wood-block-inspired: a short low body, two inharmonic partials
 * (roughly the 1:4:10 ratios of a struck wooden bar) and a bandpassed
 * noise transient for the impact.
 */
function playThock({
	body,
	settle,
	overtone,
	knock,
	gain,
	decay,
	noiseCenter,
}: ThockOptions) {
	if (typeof window === "undefined") {
		return;
	}
	ctx ??= new AudioContext();
	if (ctx.state === "suspended") {
		void ctx.resume();
	}

	const now = ctx.currentTime;

	// Low woody body with a slight pitch settle. Dry, short decay.
	const bodyOsc = ctx.createOscillator();
	const bodyGain = ctx.createGain();
	bodyOsc.type = "sine";
	bodyOsc.frequency.setValueAtTime(body, now);
	bodyOsc.frequency.exponentialRampToValueAtTime(settle, now + decay * 0.55);
	bodyGain.gain.setValueAtTime(gain, now);
	bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
	bodyOsc.connect(bodyGain).connect(ctx.destination);
	bodyOsc.start(now);
	bodyOsc.stop(now + decay + 0.01);

	// First overtone (~4x), the marimba-like ring.
	const overtoneOsc = ctx.createOscillator();
	const overtoneGain = ctx.createGain();
	overtoneOsc.type = "sine";
	overtoneOsc.frequency.setValueAtTime(overtone, now);
	overtoneGain.gain.setValueAtTime(gain * 0.2, now);
	overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + decay * 0.35);
	overtoneOsc.connect(overtoneGain).connect(ctx.destination);
	overtoneOsc.start(now);
	overtoneOsc.stop(now + decay * 0.4);

	// Second, inharmonic partial (~10x). Very quiet and very short — this
	// is what reads as "wood" instead of "tone".
	const knockOsc = ctx.createOscillator();
	const knockGain = ctx.createGain();
	knockOsc.type = "sine";
	knockOsc.frequency.setValueAtTime(knock, now);
	knockGain.gain.setValueAtTime(gain * 0.09, now);
	knockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
	knockOsc.connect(knockGain).connect(ctx.destination);
	knockOsc.start(now);
	knockOsc.stop(now + 0.035);

	// Impact transient: bandpassed knock of noise (hollow, not hissy).
	const noise = ctx.createBufferSource();
	noise.buffer = getNoiseBuffer(ctx);
	const noiseFilter = ctx.createBiquadFilter();
	noiseFilter.type = "bandpass";
	noiseFilter.frequency.setValueAtTime(noiseCenter, now);
	noiseFilter.Q.setValueAtTime(1.2, now);
	const noiseGain = ctx.createGain();
	noiseGain.gain.setValueAtTime(gain * 0.55, now);
	noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
	noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
	noise.start(now);
	noise.stop(now + 0.03);
}

/** The standard button click. */
export function playClick() {
	playThock({
		body: 240,
		settle: 215,
		overtone: 960,
		knock: 2200,
		gain: 0.1,
		decay: 0.1,
		noiseCenter: 1400,
	});
}

/** Deeper variant, used for heavier actions like downloads. */
export function playDeepClick() {
	playThock({
		body: 105,
		settle: 90,
		overtone: 420,
		knock: 1050,
		gain: 0.2,
		decay: 0.17,
		noiseCenter: 750,
	});
}

/**
 * Bright, glassy "ping" for the theme toggle. Deliberately nothing like the
 * woody thocks: a quick upward sine chirp with a faint shimmer partial and
 * no noise impact — light and airy instead of deep.
 */
export function playToggle() {
	if (typeof window === "undefined") {
		return;
	}
	ctx ??= new AudioContext();
	if (ctx.state === "suspended") {
		void ctx.resume();
	}

	const now = ctx.currentTime;

	// Main chirp: fast upward slide, reads as a light "blip".
	const chirp = ctx.createOscillator();
	const chirpGain = ctx.createGain();
	chirp.type = "sine";
	chirp.frequency.setValueAtTime(620, now);
	chirp.frequency.exponentialRampToValueAtTime(940, now + 0.06);
	chirpGain.gain.setValueAtTime(0.05, now);
	chirpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
	chirp.connect(chirpGain).connect(ctx.destination);
	chirp.start(now);
	chirp.stop(now + 0.15);

	// Faint shimmer partial on top for a glassy sparkle.
	const shimmer = ctx.createOscillator();
	const shimmerGain = ctx.createGain();
	shimmer.type = "sine";
	shimmer.frequency.setValueAtTime(1880, now);
	shimmerGain.gain.setValueAtTime(0.016, now);
	shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
	shimmer.connect(shimmerGain).connect(ctx.destination);
	shimmer.start(now);
	shimmer.stop(now + 0.08);
}

/**
 * Playful, cartoonish two-note "boo-dup" for the filters toggle. Nothing
 * like the other sounds: two round triangle-wave notes hopping up a fifth
 * with a tiny pitch bounce — reads as a cheerful "open the toybox".
 */
export function playBoop() {
	if (typeof window === "undefined") {
		return;
	}
	ctx ??= new AudioContext();
	if (ctx.state === "suspended") {
		void ctx.resume();
	}

	const now = ctx.currentTime;

	const note = (
		frequency: number,
		start: number,
		duration: number,
		gain: number,
	) => {
		if (!ctx) {
			return;
		}
		const osc = ctx.createOscillator();
		const env = ctx.createGain();
		osc.type = "triangle";
		// Small upward bend into each note for the "bouncy" feel.
		osc.frequency.setValueAtTime(frequency * 0.82, start);
		osc.frequency.exponentialRampToValueAtTime(frequency, start + 0.035);
		env.gain.setValueAtTime(0.0001, start);
		env.gain.exponentialRampToValueAtTime(gain, start + 0.015);
		env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
		osc.connect(env).connect(ctx.destination);
		osc.start(start);
		osc.stop(start + duration + 0.02);
	};

	// "boo" then "dup!" — up a fifth, second note slightly louder.
	note(262, now, 0.09, 0.016);
	note(392, now + 0.085, 0.13, 0.022);
}

interface SwooshOptions {
	/** Bandpass start frequency in Hz. */ from: number;
	/** Bandpass end frequency in Hz. */
	to: number;
	/** Total length in seconds. */
	duration: number;
	/** Peak volume. */
	gain: number;
}

/**
 * Soft "ssssh" swoosh: bandpassed noise with a filter sweep and a smooth
 * attack/decay envelope. Sweep direction/pitch distinguishes the variants.
 */
function playSwoosh({ from, to, duration, gain }: SwooshOptions) {
	if (typeof window === "undefined") {
		return;
	}
	ctx ??= new AudioContext();
	if (ctx.state === "suspended") {
		void ctx.resume();
	}

	const now = ctx.currentTime;

	const noise = ctx.createBufferSource();
	noise.buffer = getSwooshBuffer(ctx);

	const filter = ctx.createBiquadFilter();
	filter.type = "bandpass";
	filter.Q.setValueAtTime(0.9, now);
	filter.frequency.setValueAtTime(from, now);
	filter.frequency.exponentialRampToValueAtTime(to, now + duration * 0.8);

	const envelope = ctx.createGain();
	envelope.gain.setValueAtTime(0.0001, now);
	envelope.gain.exponentialRampToValueAtTime(gain, now + duration * 0.25);
	envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

	noise.connect(filter).connect(envelope).connect(ctx.destination);
	noise.start(now);
	noise.stop(now + duration + 0.02);
}

/** Nav "Home": upward ssssh — brighter, opening. */
export function playNavHome() {
	playSwoosh({ from: 800, to: 3200, duration: 0.28, gain: 0.09 });
}

/** Nav "Docs": downward ssssh — darker, settling. */
export function playNavDocs() {
	playSwoosh({ from: 2600, to: 650, duration: 0.24, gain: 0.09 });
}
