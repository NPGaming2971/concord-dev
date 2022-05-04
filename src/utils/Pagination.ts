export interface Pagination<T> {
	pages: T[][];
	currentPage: number;
}

type PaginationOptions = {
	splitInto?: number;
	pages?: any[];
	startingPage?: number;
};

export class Pagination<T> implements Pagination<T> {
	constructor(options: PaginationOptions = {}) {
		const { splitInto } = options;

		this.pages = [];
		this.currentPage = options.startingPage ?? 0;

		this.renderChunks(options.pages, splitInto);
	}

	public previousPage() {
		this.currentPage--;
		return this.getCurrentPage();
	}

	public firstPage() {
		this.currentPage = 0;
		return this.getCurrentPage();
	}

	public getPage(page: number) {
		return this.pages[page];
	}

	public nextPage() {
		this.currentPage++;
		return this.getCurrentPage();
	}

	private getCurrentPage() {
		return this.getPage(this.currentPage);
	}

	private renderChunks(array: T[] = [], splitInto: number = 1) {

		if (!splitInto) throw new Error('Can not have a page size of zero.');

		for (let i = 0; i < array.length; i += splitInto) {
			const chunk = array.slice(i, i + splitInto);
			this.pages.push(chunk);
		}
	}
}
