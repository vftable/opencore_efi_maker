import path from "path";
import fs from "fs";
import superagent from "superagent";

export class Recovery {
	async getSession(): Promise<string> {
		const response = await superagent
			.get(`http://osrecovery.apple.com`)
			.set("User-Agent", "InternetRecovery/1.0");

		return response.headers["set-cookie"][0];
	}

	async getImageInfo(options: {
		cid: string;
		sn: string;
		bid: string;
		k: string;
		os: string;
		fg: string;
	}): Promise<{
		AP: string;
		AU: string;
		AH: string;
		AT: string;
		CU: string;
		CH: string;
		CT: string;
	}> {
		const serializedOptions = Object.entries(options)
			.map((entries) => entries.join(`=`))
			.join(`\n`);

		const session = await this.getSession();

		const response = await superagent
			.post(`http://osrecovery.apple.com/InstallationPayload/RecoveryImage`)
			.send(serializedOptions)
			.type("text/plain")
			.set("User-Agent", "InternetRecovery/1.0")
			.set("Host", "osrecovery.apple.com")
			.set("Content-Length", serializedOptions.length.toString())
			.set("Cookie", session);

		return Object.fromEntries(
			response.text
				.trim()
				.split(`\n`)
				.map((entries) => entries.split(`: `))
		);
	}

	async downloadMacOSRecovery(
		version: string,
		to: string,
		callback: () => void
	) {
		var options = {
			cid: "3076CE439155BA14",
			sn: "...",
			bid: "Mac-00BE6ED71E35EB86",
			k: "4BE523BB136EB12B1758C70DB43BDD485EBCB6A457854245F9E9FF0587FB790C",
			os: "latest",
			fg: "B2E6AA07DB9088BE5BDB38DB2EA824FDDFB6C3AC5272203B32D89F9D8E3528DC",
		};

		switch (version) {
			case "sonoma": {
				break;
			}

			case "ventura": {
				break;
			}

			case "monterey": {
				options.bid = "Mac-FFE5EF870D7BA81A";
				break;
			}

			case "big_sur": {
				options.bid = "Mac-42FD25EABCABB274";
				break;
			}

			case "catalina": {
				options.bid = "Mac-00BE6ED71E35EB86";
				break;
			}
		}

		const {
			AU: baseSystemDmgUrl,
			AT: baseSystemDmgSignature,
			CU: baseSystemChunklistUrl,
			CT: baseSystemChunklistSignature,
		} = await this.getImageInfo(options);

		await new Promise<void>((resolve) =>
			superagent
				.get(baseSystemChunklistUrl)
				.set("User-Agent", "InternetRecovery/1.0")
				.set("Cookie", ["AssetToken", baseSystemChunklistSignature].join(`=`))
				.pipe(fs.createWriteStream(path.join(to, "BaseSystem.chunklist")))
				.on("close", resolve)
		);

        await new Promise<void>((resolve) =>
			superagent
				.get(baseSystemDmgUrl)
				.set("User-Agent", "InternetRecovery/1.0")
				.set("Cookie", ["AssetToken", baseSystemDmgSignature].join(`=`))
				.pipe(fs.createWriteStream(path.join(to, "BaseSystem.dmg")))
				.on("close", resolve)
		);

		callback();
	}
}
