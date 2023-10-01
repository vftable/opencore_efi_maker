import path from "path";
import fs from "fs";

import { logger } from "./index";

export default class ACPIPatcher {
	patches: { [key: string]: { path: string; [key: string]: any } };

	constructor() {
		this.patches = {
			nvidiaTuringPatch: {
				path: "SSDT-GPU-SPOOF.dslpatch",
				gpu: {
					pciPath: String,
					deviceId: Buffer,
					model: String,
				},
			},
		};
	}

	async applyPatch(patchWithData: {
		patch: { path: string; [key: string]: any };
		data: any;
	}): Promise<string | null | undefined> {
		const parseSelectors: (data: any, selectors: string[]) => any = (
			data: any,
			selectors: string[]
		) => {
			const dereferencedSelectors = [...selectors];

			const [baseSelector, accessorSelector] = dereferencedSelectors;
			const base = data[baseSelector];

			dereferencedSelectors.shift();

			if (dereferencedSelectors.length > 1) {
				return parseSelectors(base, dereferencedSelectors);
			} else {
				return base[accessorSelector];
			}
		};

		const patchPath = path.join(
			process.cwd(),
			"files",
			"acpi",
			"patches",
			patchWithData.patch.path
		);

		if (!fs.existsSync(patchPath)) {
			logger.error(
				`Patch ${logger.bold(
					patchWithData.patch.path
				)} does not exist at path!`,
				`ACPIPatcher`
			);
			return null;
		}

		const rawPatch = fs.readFileSync(patchPath, "utf8");
		const matches = Array.from(rawPatch.matchAll(/{ (.*?) }/g));

		const rawSelectors = [];

		var patchResult = rawPatch;

		for (const [match, rawSelector] of matches) {
			const selectors = rawSelector.split(`->`);
			const selectedData = parseSelectors(patchWithData.data, selectors);

			rawSelectors.push(rawSelector);

			if (!selectedData) {
				logger.error(
					`Patch ${logger.bold(
						patchWithData.patch.path
					)} has no data for selector ${logger.bold(rawSelector)}!`,
					`ACPIPatcher`
				);
				return null;
			}

			var replacement = selectedData;

			switch (parseSelectors(patchWithData.patch, selectors)) {
				case String: {
					replacement = <string>selectedData;
					break;
				}

				case Number: {
					replacement = `0x${`${<number>selectedData < 16 ? `0` : ``}${(<number>selectedData).toString(16)}`.toUpperCase()}`;
					break;
				}

				case Buffer: {
					replacement = (
						Array.from(<Buffer>selectedData).map(
							(byte) =>
								`0x${`${byte < 16 ? `0` : ``}${byte.toString(
									16
								)}`.toUpperCase()}`
						) as string[]
					).join(`, `);
					break;
				}
			}

			patchResult = patchResult.replaceAll(match, replacement);

			logger.success(
				`Patched selector ${logger.bold(rawSelector)} in file ${logger.bold(
					patchWithData.patch.path
				)} with data ${logger.bold(replacement)} successfully!`,
				`ACPIPatcher`
			);
		}

		return patchResult;
	}
}
