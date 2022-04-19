export type CommandAndEventLoadOptions = {
	errorOnNoMatches?: boolean;
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
    };
};

export type NonNullObject = {} & object;