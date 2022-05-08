export enum Error {
	NO_TYPE_SPECIFIED = 'You did not specify application command type.',
	PRECONDITION_VALIDATION_FAILED = 'Preconditions are not met.',
	ELEVATED_PERMISSION_REQUIRED = 'Access denied.',
	MISSING_USER_PERMISSIONS = 'You do not have the required permissions to execute this command. Expected permissions: {{ permissions }}',
	MISSING_CLIENT_PERMISSIONS = 'I do not have the required permissions to execute this command. Expected permissions: {{ permissions }}',
	CHANNEL_TYPE_PRECONDITIONS_FAILED = 'You can not use this command in this channel. Expected channel types: {{ channelTypes }}',
	DISALLOWED_LOCATION = 'You can not use this command in this channel/guild.'
}

export declare const GroupPermissionsFlagBits: {
	readonly KickChannels: bigint
	readonly BanChannels: bigint;
	readonly ManageUsers: bigint
	readonly ManageAppearances: bigint;
	readonly ManageMembers: bigint;
	readonly Administrator: bigint;
	readonly ManageRequests: bigint
	readonly ManageRoles: bigint;
	readonly KickMembers: bigint;
	readonly BanMembers: bigint;
	readonly ManageMessages: bigint;
};

export enum GroupStatusType {
	Public = 'public',
	Private = 'private',
	Restricted = 'restricted',
	Protected = 'protected'
}

export enum Time {
	Millisecond = 1,
	Second = Millisecond * 1000,
	Minute = Second * 60,
	Hour = Minute * 60,
	Day = Hour * 24,
	Week = Day * 7,
	Month = Day * 30
}
