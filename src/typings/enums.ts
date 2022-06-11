export enum Events {
	GroupMemberAdd = 'groupMemberAdd',
	GroupMemberRemove = 'groupMemberRemove',
	GroupCreate = 'groupCreate',
	GroupDelete = 'groupDelete',
	GroupUpdate = 'groupUpdate'
}
export enum SettingCategory {
	Appearances = 'Appearances'
}

export enum BanType {
	User = 'user',
	Guild = 'guild',
	Global = 'global'
}

export declare const GroupPermissionsFlagBits: {
	readonly KickChannels: bigint;
	readonly BanChannels: bigint;
	readonly ManageUsers: bigint;
	readonly ManageAppearances: bigint;
	readonly ManageMembers: bigint;
	readonly Administrator: bigint;
	readonly ManageRequests: bigint;
	readonly ManageRoles: bigint;
	readonly KickMembers: bigint;
	readonly BanMembers: bigint;
	readonly ManageMessages: bigint;
};

export enum SettingType {
	String = 'string',
	Choices = 'choices',
	Boolean = 'boolean'
}

export enum RequestType {
	Connect = 'Connect'
}

export enum RequestState {
	Pending = 'Pending',
	Accepted = 'Accepted',
	Denied = 'Denied'
}

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
