import gradient from "gradient-string";
import ansis from "ansis";

import type { Arguments } from "./types";

export default class Logger {
	args: Arguments;

	constructor(args: Arguments) {
		this.args = args;
	}

	formatDate(date: Date) {
		return `${(date.getHours() + "").padStart(2, "0")}:${(
			date.getMinutes() + ""
		).padStart(2, "0")}:${(date.getSeconds() + "").padStart(2, "0")}.${(
			date.getMilliseconds() + ""
		).padStart(3, "0")}`;
	}

	clear() {
		console.clear();
	}

	newline() {
		console.log();
	}

	info(message: any, context?: string) {
		console.log(`[${this.formatDate(new Date())}] [*]` + ` ${context ? `[${context}] ` : ``}${message}`);
	}

	verbose(message: any, context?: string) {
		if (this.args.verbose)
			console.log(`[${this.formatDate(new Date())}] [$]` + ` ${context ? `[${context}] ` : ``}${message}`);
	}

	success(message: any, context?: string) {
		console.log(
			gradient.pastel(`[${this.formatDate(new Date())}] [+]`) + ` ${context ? `[${context}] ` : ``}${message}`
		);
	}

	error(message: any, context?: string) {
		console.log(
			gradient.morning(`[${this.formatDate(new Date())}] [-]`) + ` ${context ? `[${context}] ` : ``}${message}`
		);
	}

	bold(message: any) {
		return ansis.bold(message);
	}
}
