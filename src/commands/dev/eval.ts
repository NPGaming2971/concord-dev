import { ActionRowBuilder, TextInputBuilder } from "@discordjs/builders";
import {
	ApplicationCommandOptionType,
	ChatInputCommandInteraction,
	EmbedBuilder,
	Formatters,
	ModalBuilder,
	ModalSubmitInteraction,
	TextInputStyle,
} from "discord.js";
import { Command } from "../../structures/";
import { inspect } from "node:util";
import fetch from "node-fetch";
import { Constants } from "../../typings/constants";
import { Time } from "../../typings/enums";
export class EvalCommand extends Command {
	constructor() {
		super({
			data: {
				name: "eval",
				description: "Evaluates code.",
				options: [
					{
						name: "async-mode",
						type: ApplicationCommandOptionType.Boolean,
						description: "Whether to enable async mode (allow you to use top level await).",
					},
				],
			},
			preconditions: {
				elevatedPermissions: true,
			},
			restraints: {
				global: false
			}
		});
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		const asyncMode = interaction.options.getBoolean("async-mode") ?? true;
		const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

		const textField = new TextInputBuilder()
			.setPlaceholder("Your code here.")
			.setRequired(true)
			.setLabel("Code field" + (asyncMode ? " (Async Mode)" : ""))
			.setCustomId("concord:eval/codeInput")
			.setStyle(TextInputStyle.Paragraph);

		const codeModal = new ModalBuilder()
			.setComponents(new ActionRowBuilder<TextInputBuilder>().setComponents(textField))
			.setTitle("Concord: Eval")
			.setCustomId("concord:eval/modal");

		interaction.showModal(codeModal);
		function clean(text: string) {
			return typeof text === "string"
				? text
						.replace(/`/g, "`" + String.fromCharCode(8203))
						.replace(/@/g, "@" + String.fromCharCode(8203))
				: text;
		}

		const filter = (m: ModalSubmitInteraction) =>
			m.user.id === interaction.user.id && m.customId === "concord:eval/modal";

		try {
			const modalInteraction = await interaction.awaitModalSubmit({ time: Time.Second * 999, filter });

			const codeString = modalInteraction.fields.getTextInputValue("concord:eval/codeInput");
			await modalInteraction.deferReply();
			try {
				const executionStart = new Date().getTime();
				let evaled = asyncMode
					? await new AsyncFunction("interaction", "require", `return ${codeString}`)(
							modalInteraction,
							require
					  )
					: new Function("interaction", "require", `return ${codeString}`)(
							modalInteraction,
							require
					  );
				const executionEnd = new Date().getTime();
				const returnType = typeof evaled;
				if (typeof evaled !== "string") evaled = inspect(evaled);
				if (clean(evaled).length >= 3984) {
					fetch("https://www.toptal.com/developers/hastebin/documents", {
						method: "POST",
						body: clean(evaled),
					})
						.then((res) => res.json())
						.then((json: any) => {
							modalInteraction.editReply(
								`Response longer than 4000 characters.\n[View Full](<https://www.toptal.com/developers/hastebin/${json.key}>)`
							);
						})
						.catch((err) => modalInteraction.editReply(err));
				} else {
					const embed = new EmbedBuilder()
						.setDescription(`📤 **Output**\n${Formatters.codeBlock("js", clean(evaled))}`)
						.addFields(
							{
								name: "Input",
								value: Formatters.codeBlock("js", codeString),
							},
							{
								name: "Type",
								value: returnType,
								inline: true,
							},
							{
								name: "Time taken",
								value: `${executionEnd - executionStart}ms`,
								inline: true,
							}
						)
						.setColor(Constants.DEFAULT_COLOR);
					modalInteraction.editReply({
						embeds: [embed],
					});
				}
			} catch (error: any) {
				modalInteraction.editReply({
					embeds: [
						new EmbedBuilder()
							.setDescription(`⚠ **Error**\n${Formatters.codeBlock("js", error.stack)}`)
							.addFields({
								name: "Input",
								value: Formatters.codeBlock("js", codeString),
							}),
					],
				});
			}
		} catch (err) {
			console.log(err);
		}
	}
}
