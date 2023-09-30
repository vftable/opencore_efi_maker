import url from "url";
import path from "path";
import gradient from "gradient-string";
import fs from "fs";
import plist from "plist";
import inquirer from "inquirer";
import superagent from "superagent";
import unzipper from "unzipper";

import type { Root, Release, KextInfo } from "./types";
import { Logger } from "./logger";
import { Recovery } from "./recovery";

const logger = new Logger();
const recovery = new Recovery();

const sleep = (milliseconds: number) =>
	new Promise((_) => setTimeout(_, milliseconds));

const getLatestRelease = async (username: string, repository: string) =>
	(
		await superagent
			.get(
				`https://api.github.com/repos/${username}/${repository}/releases/latest`
			)
			.set("User-Agent", "superagent/node")
			.type("json")
	).body as any as Release;

const downloadFileFromRepository = (
	username: string,
	repository: string,
	branch: string,
	path: string[]
) =>
	superagent.get(
		`https://github.com/${username}/${repository}/raw/${branch}/${path.join(
			"/"
		)}`
	);

const downloadKextWithAcidantheraFormat = async (
	username: string,
	name: string,
	variant: string
) => {
	const latestKextRelease = await getLatestRelease(username, name);

	const { name: kextAssetName, browser_download_url: kextAssetDownloadUrl } =
		latestKextRelease.assets.find(
			(asset) =>
				asset.name.toLowerCase() ===
				`${name}-${latestKextRelease.tag_name}-${variant}.zip`.toLowerCase()
		)!;

	await new Promise<void>((resolve) =>
		superagent
			.get(kextAssetDownloadUrl)
			.pipe(
				unzipper.Extract({
					path: path.join(process.cwd(), "output", "EFI", "OC", "Kexts"),
				})
			)
			.on("close", resolve)
	);

	logger.success(`Downloaded ${name}.kext successfully! (${kextAssetName})`);
};

const downloadKextFromRepository = async (
	name: string,
	username: string,
	repository: string,
	variant: string
) => {
	const latestKextRelease = await getLatestRelease(username, repository);

	const { name: kextAssetName, browser_download_url: kextAssetDownloadUrl } =
		latestKextRelease.assets.find(
			(asset) =>
				asset.name.toLowerCase() ===
					`${name}-${latestKextRelease.tag_name}-${variant}.zip`.toLowerCase() ||
				asset.name.includes(name)
		)!;

	await new Promise<void>((resolve) =>
		superagent
			.get(kextAssetDownloadUrl)
			.pipe(
				unzipper.Extract({
					path: path.join(process.cwd(), "output", "EFI", "OC", "Kexts"),
				})
			)
			.on("close", resolve)
	);

	logger.success(`Downloaded ${name}.kext successfully! (${kextAssetName})`);
};

async function main() {
	logger.clear();

	console.log(
		gradient.morning(`
    █▀█ █▀█ █▀▀ █▄░█ █▀▀ █▀█ █▀█ █▀▀   █▀▀ █▀▀ █   █▀▄▀█ ▄▀█ █▄▀ █▀▀ █▀█
    █▄█ █▀▀ ██▄ █░▀█ █▄▄ █▄█ █▀▄ ██▄   ██▄ █▀░ █   █░▀░█ █▀█ █░█ ██▄ █▀▄

               █▀▄▀█ ▄▀█ █▀▄ █▀▀   █▄▄ █▄█   █░█ █▀▀ ▀█▀ ▄▀█ █▄▄ █░░ █▀▀
               █░▀░█ █▀█ █▄▀ ██▄   █▄█ ░█░   ▀▄▀ █▀░ ░█░ █▀█ █▄█ █▄▄ ██▄
    

    /// welcome (｡･ω･)ﾉﾞ ///
    /// ts rewrite v2 ///
    
    `)
	);

	const template: Root = plist.parse(
		fs.readFileSync(path.join(process.cwd(), "files", "template.plist"), "utf8")
	) as unknown as Root;

	const config: Root = template;

	const { opencoreVariant }: { opencoreVariant: string } =
		await inquirer.prompt([
			{
				type: "list",
				name: "opencoreVariant",
				message:
					"Please select the variant of OpenCore you would like to download:",
				choices: [
					{
						name: "Release",
						value: "RELEASE",
					},
					{
						name: "Debug",
						value: "DEBUG",
					},
				],
			},
		]);

	const latestOpencoreRelease = await getLatestRelease(
		"acidanthera",
		"OpenCorePkg"
	);

	const {
		name: opencoreAssetName,
		browser_download_url: opencoreAssetDownloadUrl,
	} = latestOpencoreRelease.assets.find(
		(asset) =>
			asset.name ===
			`OpenCore-${latestOpencoreRelease.name}-${opencoreVariant}.zip`
	)!;

	await new Promise<void>((resolve) =>
		superagent
			.get(opencoreAssetDownloadUrl)
			.pipe(
				unzipper.Extract({
					path: path.join(process.cwd(), "files", "opencore"),
				})
			)
			.on("close", resolve)
	);

	logger.success(
		`Downloaded OpenCore ${latestOpencoreRelease.name} (${opencoreAssetName}) successfully!`
	);

	if (fs.existsSync(path.join(process.cwd(), "output")))
		fs.rmSync(path.join(process.cwd(), "output"), {
			recursive: true,
			force: true,
		});

	fs.mkdirSync(path.join(process.cwd(), "output"));

	logger.newline();

	const { targetArchitecture }: { targetArchitecture: string } =
		await inquirer.prompt([
			{
				type: "list",
				name: "targetArchitecture",
				message: "Please select the target system's architecture:",
				choices: [
					{
						name: "x64",
						value: "X64",
					},
					{
						name: "x86",
						value: "IA32",
					},
				],
			},
		]);

	fs.cpSync(
		path.join(process.cwd(), "files", "opencore", targetArchitecture),
		path.join(process.cwd(), "output"),
		{ recursive: true }
	);

	logger.success(`Copied EFI folder to /output successfully!`);

	for (const driver of fs.readdirSync(
		path.join(process.cwd(), "output", "EFI", "OC", "Drivers")
	)) {
		if (
			driver != "OpenCanopy.efi" &&
			driver != "OpenRuntime.efi" &&
			driver != "HfsPlus.efi" &&
			driver != "HfsPlus32.efi"
		)
			fs.rmSync(
				path.join(process.cwd(), "output", "EFI", "OC", "Drivers", driver)
			);
	}

	fs.rmSync(path.join(process.cwd(), "output", "EFI", "OC", "Tools"), {
		recursive: true,
		force: true,
	});

	const hfsPlusDriverFileName =
		targetArchitecture === "X64" ? "HfsPlus.efi" : "HfsPlus32.efi";

	downloadFileFromRepository("acidanthera", "OcBinaryData", "master", [
		"Drivers",
		hfsPlusDriverFileName,
	]).pipe(
		fs.createWriteStream(
			path.join(
				__dirname,
				"..",
				"output",
				"EFI",
				"OC",
				"Drivers",
				hfsPlusDriverFileName
			)
		)
	);

	logger.success(`Downloaded ${hfsPlusDriverFileName} successfully!`);

	config.UEFI.Drivers = [];

	for (const driver of fs.readdirSync(
		path.join(process.cwd(), "output", "EFI", "OC", "Drivers")
	)) {
		config.UEFI.Drivers.push({
			Arguments: ``,
			Comment: driver,
			Enabled: true,
			LoadEarly: false,
			Path: driver,
		});
	}

	logger.newline();

	const { targetPlatform }: { targetPlatform: string } = await inquirer.prompt([
		{
			type: "list",
			name: "targetPlatform",
			message: "Please select the target system's platform:",
			choices: [
				{
					name: "AMD (Desktop)",
					value: "amd_desktop",
				},
				{
					name: "AMD (Laptop)",
					value: "amd_laptop",
				},
				new inquirer.Separator(),
				{
					name: "Intel (Desktop - Skylake and newer)",
					value: "intel_desktop_new",
				},
				{
					name: "Intel (Desktop - Broadwell and older)",
					value: "intel_desktop_old",
				},
				new inquirer.Separator(),
				{
					name: "Intel (Laptop - Skylake and newer)",
					value: "intel_laptop_new",
				},
				{
					name: "Intel (Laptop - Broadwell and older)",
					value: "intel_laptop_old",
				},
			],
			pageSize: 9,
		},
	]);

	if (fs.existsSync(path.join(process.cwd(), "output", "EFI", "OC", "ACPI")))
		fs.rmSync(path.join(process.cwd(), "output", "EFI", "OC", "ACPI"), {
			recursive: true,
			force: true,
		});

	fs.mkdirSync(path.join(process.cwd(), "output", "EFI", "OC", "ACPI"));

	config.ACPI.Add = [];

	for (const ssdt of fs.readdirSync(
		path.join(process.cwd(), "files", "acpi", targetPlatform)
	)) {
		fs.copyFileSync(
			path.join(process.cwd(), "files", "acpi", targetPlatform, ssdt),
			path.join(process.cwd(), "output", "EFI", "OC", "ACPI", ssdt)
		);

		config.ACPI.Add.push({
			Comment: ssdt,
			Enabled: true,
			Path: ssdt,
		});

		logger.success(`Linked ${ssdt} successfully!`);
	}

	logger.newline();

	const platformCategories = {
		amd_desktop: "amd",
		amd_laptop: "amd",

		intel_desktop_new: "intel",
		intel_desktop_old: "intel",

		intel_laptop_new: "intel",
		intel_laptop_old: "intel",
	};

	const computerTypes = {
		amd_desktop: "desktop",
		amd_laptop: "laptop",

		intel_desktop_new: "desktop",
		intel_desktop_old: "desktop",

		intel_laptop_new: "laptop",
		intel_laptop_old: "laptop",
	};

	const platformCategory =
		platformCategories[targetPlatform as keyof typeof platformCategories];

	const computerType =
		computerTypes[targetPlatform as keyof typeof computerTypes];

	if (fs.existsSync(path.join(process.cwd(), "output", "EFI", "OC", "Kexts")))
		fs.rmSync(path.join(process.cwd(), "output", "EFI", "OC", "Kexts"), {
			recursive: true,
			force: true,
		});

	fs.mkdirSync(path.join(process.cwd(), "output", "EFI", "OC", "Kexts"));

	const { macOSVersion }: { macOSVersion: string } = await inquirer.prompt([
		{
			type: "list",
			name: "macOSVersion",
			message:
				"Please select the version of macOS you plan to install on the target system:",
			choices: [
				{
					name: "macOS 14 (Sonoma)",
					value: "sonoma",
				},
				{
					name: "macOS 13 (Ventura)",
					value: "ventura",
				},
				{
					name: "macOS 12 (Monterey)",
					value: "monterey",
				},
				{
					name: "macOS 11 (Big Sur)",
					value: "big_sur",
				},
				new inquirer.Separator(),
				{
					name: "macOS 10.15 (Catalina)",
					value: "catalina",
				},
			],
			pageSize: 6,
		},
	]);

	if (
		fs.existsSync(path.join(process.cwd(), "output", "com.apple.recovery.boot"))
	)
		fs.rmSync(path.join(process.cwd(), "output", "com.apple.recovery.boot"), {
			recursive: true,
			force: true,
		});

	fs.mkdirSync(path.join(process.cwd(), "output", "com.apple.recovery.boot"));

	logger.success(`Downloading...`);

	await new Promise<void>(
		async (resolve) =>
			await recovery.downloadMacOSRecovery(
				macOSVersion,
				path.join(process.cwd(), "output", "com.apple.recovery.boot"),
				() => {
					logger.success(`Downloaded macOS BaseSystem.dmg successfully!`);
					resolve();
				}
			)
	);

	logger.newline();

	const { downloadNVMEFix }: { downloadNVMEFix: boolean } =
		await inquirer.prompt([
			{
				type: "confirm",
				name: "downloadNVMEFix",
				message: "Does the target system have a NVME drive?",
			},
		]);

	var downloadNootedRed = false;
	var downloadVoodooRMI = false;

	if (platformCategory === "amd") {
		const { isRadeonIntegrated }: { isRadeonIntegrated: boolean } =
			await inquirer.prompt([
				{
					type: "confirm",
					name: "isRadeonIntegrated",
					message: "Does the target system have a Radeon Vega iGPU?",
				},
			]);

		downloadNootedRed = isRadeonIntegrated;
	}

	if (computerType === "laptop") {
		const { isSynapticsHID }: { isSynapticsHID: boolean } =
			await inquirer.prompt([
				{
					type: "confirm",
					name: "isSynapticsHID",
					message: "Does the target system have a Synaptics trackpad?",
				},
			]);

		downloadVoodooRMI = isSynapticsHID;
	}

	logger.newline();

	await downloadKextWithAcidantheraFormat(
		"acidanthera",
		"Lilu",
		opencoreVariant
	);

	await downloadKextWithAcidantheraFormat(
		"vftable",
		"VirtualSMC",
		opencoreVariant
	);

	await downloadKextWithAcidantheraFormat(
		"acidanthera",
		"AppleALC",
		opencoreVariant
	);

	await downloadKextFromRepository(
		"USBToolBox",
		"USBToolBox",
		"kext",
		opencoreVariant
	);

	if (platformCategory === "amd") {
		await downloadKextFromRepository(
			"SMCAMDProcessor",
			"trulyspinach",
			"SMCAMDProcessor",
			opencoreVariant
		);

		await downloadKextFromRepository(
			"AMDRyzenCPUPowerManagement",
			"trulyspinach",
			"SMCAMDProcessor",
			opencoreVariant
		);
	}

	if (downloadNVMEFix) {
		await downloadKextWithAcidantheraFormat(
			"acidanthera",
			"NVMEFix",
			opencoreVariant
		);
	}

	if (downloadNootedRed) {
		await downloadKextWithAcidantheraFormat(
			"vftable",
			"NootedRed",
			opencoreVariant
		);
	} else {
		await downloadKextWithAcidantheraFormat(
			"acidanthera",
			"WhateverGreen",
			opencoreVariant
		);
	}

	if (computerType === "laptop") {
		await downloadKextWithAcidantheraFormat(
			"1Revenger1",
			"ECEnabler",
			opencoreVariant
		);

		await downloadKextFromRepository(
			"VoodooPS2Controller",
			"acidanthera",
			"VoodooPS2",
			opencoreVariant
		);

		/*

		await downloadKextFromRepository(
			"VoodooI2C",
			"VoodooI2C",
			"VoodooI2C"
		);

		*/

		if (downloadVoodooRMI) {
			await downloadKextWithAcidantheraFormat(
				"vftable",
				"VoodooRMI",
				opencoreVariant
			);
		} else {
			await downloadKextWithAcidantheraFormat(
				"vftable",
				"VoodooSMBus",
				opencoreVariant
			);
		}
	}

	await sleep(2500);

	logger.newline();

	const expectedKexts = [
		"Lilu.kext",
		"VirtualSMC.kext",
		platformCategory === "intel" ? "SMCProcessor.kext" : "",
		platformCategory === "amd" ? "SMCAMDProcessor.kext" : "",
		platformCategory === "amd" ? "AMDRyzenCPUPowerManagement.kext" : "",
		computerType === "laptop" ? "SMCBatteryManager.kext" : "",
		computerType === "laptop" ? "ECEnabler.kext" : "",
		downloadNootedRed ? "NootedRed.kext" : "WhateverGreen.kext",
		"AppleALC.kext",
		"USBToolBox.kext",
		"UTBDefault.kext",
		computerType === "laptop" ? "VoodooPS2Controller.kext" : "",
		// computerType === "laptop" ? "VoodooI2C.kext" : "",
		computerType === "laptop" ? "VoodooSMBus.kext" : "",
		computerType === "laptop" && downloadVoodooRMI ? "VoodooRMI.kext" : "",
	].filter((kext) => kext != "");

	for (const kext of fs.readdirSync(
		path.join(process.cwd(), "output", "EFI", "OC", "Kexts")
	)) {
		try {
			if (!expectedKexts.includes(kext))
				fs.rmSync(
					path.join(process.cwd(), "output", "EFI", "OC", "Kexts", kext),
					{
						recursive: true,
						force: true,
					}
				);
		} catch (error) {
			console.log(error);
			logger.error(`Whoops! Something failed: ${error}`);
		}
	}

	logger.success("Cleaned up Kexts!");

	logger.newline();

	config.Kernel.Add = [];

	const walkKext = (kextPath: string, kextName: string) => {
		try {
			const infoPlist = plist.parse(
				fs.readFileSync(path.join(kextPath, "Contents", "Info.plist"), "utf8")
			) as unknown as KextInfo;

			if (
				!config.Kernel.Add.find((kext) => kext.BundlePath.includes(kextName))
			) {
				config.Kernel.Add.push({
					Arch: "Any",
					BundlePath: kextName,
					Comment: kextName,
					Enabled: true,
					ExecutablePath: infoPlist.CFBundleExecutable
						? `Contents/MacOS/${infoPlist.CFBundleExecutable}`
						: ``,
					MaxKernel: ``,
					MinKernel: ``,
					PlistPath: `Contents/Info.plist`,
				});

				logger.success(`Linked ${kextName} successfully!`);

				if (fs.existsSync(path.join(kextPath, "Contents", "PlugIns"))) {
					for (const kextPlugin of fs.readdirSync(
						path.join(kextPath, "Contents", "PlugIns")
					)) {
						walkKext(
							path.join(kextPath, "Contents", "PlugIns", kextPlugin),
							kextPlugin
						);
					}
				}
			}
		} catch (error) {
			console.log(error);
			logger.error(`Whoops! Something failed: ${error}`);
		}
	};

	for (const kext of expectedKexts) {
		walkKext(
			path.join(process.cwd(), "output", "EFI", "OC", "Kexts", kext),
			kext
		);
	}

	logger.newline();

	fs.writeFileSync(
		path.join(process.cwd(), "output", "EFI", "OC", "config.plist"),
		plist.build(<any>config),
		"utf-8"
	);
	logger.success(
		"Your built EFI has been written to the /output folder! Thanks for using 💖"
	);

	logger.newline();

	await sleep(10000);
	process.exit();
}

main();
