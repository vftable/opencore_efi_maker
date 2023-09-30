export interface Root {
	ACPI: ACPI;
	Kernel: Kernel;
	UEFI: UEFI;
}

export interface ACPI {
	Add: {
		Comment: string;
		Enabled: boolean;
		Path: string;
	}[];
	Patch: {
		Base: string;
		BaseSkip: number;
		Comment: string;
		Count: number;
		Enabled: boolean;
		Find: Buffer;
		Limit: number;
		Mask: Buffer;
		OemTableId: Buffer;
		Replace: Buffer;
		ReplaceMask: Buffer;
		Skip: number;
		TableLength: number;
		TableSignature: Buffer;
	}[];
	Quirks: {
		[key: string]: boolean;
	};
}

export interface Kernel {
	Add: {
		Arch: string;
		BundlePath: string;
		Comment: string;
		Enabled: boolean;
		ExecutablePath: string;
		MaxKernel: string;
		MinKernel: string;
		PlistPath: string;
	}[];
}

export interface UEFI {
	Drivers: {
		Arguments: string;
		Comment: string;
		Enabled: boolean;
		LoadEarly: boolean;
		Path: string;
	}[];
}

export interface KextInfo {
	BuildMachineOSBuild: string;
	CFBundleDevelopmentRegion: string;
	CFBundleExecutable: string;
	CFBundleIdentifier: string;
	CFBundleInfoDictionaryVersion: string;
	CFBundleName: string;
	CFBundlePackageType: string;
	CFBundleShortVersionString: string;
	CFBundleSignature: string;
	CFBundleSupportedPlatforms: string[];
	CFBundleVersion: string;
	DTCompiler: string;
	DTPlatformBuild: string;
	DTPlatformName: string;
	DTPlatformVersion: string;
	DTSDKBuild: string;
	DTSDKName: string;
	DTXcode: string;
	DTXcodeBuild: string;
	IOKitPersonalities: {
		[key: string]: {
			CFBundleIdentifier: string;
			IOClass: string;
			IOMatchCategory: string;
			IOProviderClass: string;
			IOResourceMatch: string;
		};
	};
	LSMinimumSystemVersion: string;
	NSHumanReadableCopyright: string;
	OSBundleCompatibleVersion: string;
	OSBundleLibraries: {
		[key: string]: string;
	};
	OSBundleLibraries_x86_64: {
		[key: string]: string;
	};
	OSBundleRequired: string;
}

export interface Release {
	url: string;
	assets_url: string;
	upload_url: string;
	html_url: string;
	id: number;
	author: Author;
	node_id: string;
	tag_name: string;
	target_commitish: string;
	name: string;
	draft: boolean;
	prerelease: boolean;
	created_at: string;
	published_at: string;
	assets: Asset[];
	tarball_url: string;
	zipball_url: string;
	body: string;
	reactions: Reactions;
}

export interface Author {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;
}

export interface Asset {
	url: string;
	id: number;
	node_id: string;
	name: string;
	label: string;
	uploader: Uploader;
	content_type: string;
	state: string;
	size: number;
	download_count: number;
	created_at: string;
	updated_at: string;
	browser_download_url: string;
}

export interface Uploader {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;
}

export interface Reactions {
	url: string;
	total_count: number;
	"+1": number;
	"-1": number;
	laugh: number;
	hooray: number;
	confused: number;
	heart: number;
	rocket: number;
	eyes: number;
}
