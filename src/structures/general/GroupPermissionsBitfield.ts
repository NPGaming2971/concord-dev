import { BitField, BitFieldResolvable, PermissionFlagsBits } from 'discord.js';
import type { GroupPermissionsString } from '../../typings';
import type { GroupPermissionsFlagBits } from '../../typings/enums';

export class GroupPermissionsBitfield extends BitField<GroupPermissionsString, bigint> {
	static All = Object.values(PermissionFlagsBits).reduce((all, p) => all | p, 0n);

	static override Flags: typeof GroupPermissionsFlagBits = {
		Administrator: 1n << 0n,
		KickChannels: 1n << 1n,
		KickMembers: 1n << 2n,
		BanChannels: 1n << 3n,
		BanMembers: 1n << 4n,
		ManageMembers: 1n << 5n,
		ManageUsers: 1n << 6n,
		ManageRoles: 1n << 7n,
		ManageMessages: 1n << 8n,
		ManageRequests: 1n << 9n,
		ManageAppearances: 1n << 10n
	};

	override missing(bits: BitFieldResolvable<GroupPermissionsString, bigint>, checkAdmin = true) {
		return checkAdmin && this.has(GroupPermissionsBitfield.Flags.Administrator) ? [] : super.missing(bits);
	}

	override toArray() {
		return super.toArray(false);
	}
	override has(permission: BitFieldResolvable<GroupPermissionsString, bigint>, checkAdmin = true) {
		return (checkAdmin && super.has(GroupPermissionsBitfield.Flags.Administrator)) || super.has(permission);
	}
	override any(permission: BitFieldResolvable<GroupPermissionsString, bigint>, checkAdmin = true) {
		return (checkAdmin && super.has(GroupPermissionsBitfield.Flags.Administrator)) || super.any(permission);
	}
}