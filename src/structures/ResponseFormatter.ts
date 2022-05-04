import { Error } from "../typings/enums";
import { Util } from "../utils/utils";

export class ResponseFormatters {
	public static prepareError(errorId: keyof typeof Error, template?: { [key: string]: string }) {
		return {
			content: template
				? Util.stringTemplateParser(`\`❌\` [${errorId}]\n${Error[errorId]}`, template)
				: `\`❌\` ${Error[errorId]}`,
			ephemeral: true,
		};
	}
}
