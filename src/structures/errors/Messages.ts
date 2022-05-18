'use strict';

const { register } = require('./ConcordError');

const Messages = {
	NO_TYPE_SPECIFIED: 'You did not specify application command type.',
	PRECONDITION_VALIDATION_FAILED: 'Preconditions are not met.',
	ELEVATED_PERMISSION_REQUIRED: 'Access denied.',
	MISSING_USER_PERMISSIONS: 'You do not have the required permissions to execute this command. Expected permissions: {{ permissions }}',
	MISSING_CLIENT_PERMISSIONS: 'I do not have the required permissions to execute this command. Expected permissions: {{ permissions }}',
	CHANNEL_TYPE_PRECONDITIONS_FAILED: 'You can not use this command in this channel. Expected channel types: {{ channelTypes }}',
	DISALLOWED_LOCATION: 'You can not use this command in this channel/guild.',
	EMPTY_COMMAND_FILE: (name: string) => `The file ${name} has no exported structure.`,
	CHANNEL_UNREGISTERED: 'The owner must be a valid user.',
	INVALID_OWNER: 'The owner must be a valid user.',
	THIS_MESSAGE_IS_ORPHANED: "This message doesn't have a parent id."
};

for (const [name, message] of Object.entries(Messages)) register(name, message);
