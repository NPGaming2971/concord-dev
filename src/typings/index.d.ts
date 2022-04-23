export type CommandAndEventLoadOptions = {
	errorOnNoMatches?: boolean;
	errorOnEmptyFile?: boolean;
};

export type CommandLoadOptions = {
	/**
	 * The command folder path to load.
	 */
	path: Partial<{
		commands: string;
		events: string;
	}>;
	options?: {
		extensions?: string[]
        subfolderDepth?: number;
        deploy?: boolean;
		errorOnNoMatches?: boolean;
		errorOnEmptyFile?: boolean;
    };
};

export type NonNullObject = {} & object;