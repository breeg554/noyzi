import * as v1 from "@noyzi/core-v1";

export interface ImageRenderer {
	generate: typeof v1.generate;
	seedHash: typeof v1.seedHash;
	toSvg: typeof v1.toSvg;
}

export const IMAGE_VERSIONS = {
	v1,
} satisfies Record<string, ImageRenderer>;

export type ImageVersion = keyof typeof IMAGE_VERSIONS;

export const LATEST_IMAGE_VERSION: ImageVersion = "v1";

export function isImageVersion(value: string): value is ImageVersion {
	return Object.hasOwn(IMAGE_VERSIONS, value);
}
