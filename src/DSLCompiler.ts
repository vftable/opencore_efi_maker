import path from "path";
import childProcess from "child_process";

import { logger } from "./index";

export default class DSLCompiler {
	compilerPath: string;

	constructor() {
		this.compilerPath = path.join(
			process.cwd(),
			"files",
			"iasl",
			process.platform.toString() === "win32"
				? "iasl-win32.exe"
				: process.platform.toString() === "darwin"
				? "iasl-darwin"
				: "iasl-linux"
		);
	}

	async execute(path: string): Promise<number> {
		const proc = childProcess.spawn(this.compilerPath, [path]);

		proc.stdout.setEncoding("utf8");
		proc.stdout.on("data", (data) => {
			logger.verbose(data.toString(), `DSLCompiler`);
		});

		return new Promise<number>((resolve) => {
			proc.on("close", (code) => {
				resolve(code ?? 0);
			});
		});
	}
}
