import { chunk, groupBy, isNumber, isString } from 'lodash';
import { Util } from './Util';

export interface Pagination<T> {
	pages: T[][];
	currentIndex: number;
}

type PaginationOptions<T> = {
	groupBy: string | number;
	pages?: T[];
	startingPage?: number;
};

export class Pagination<T> implements Pagination<T> {
	constructor(options: PaginationOptions<T>) {
		const { groupBy } = options;

		this.pages = [];
		this.currentIndex = options.startingPage ?? 0;

		if (isNumber(groupBy)) {
			this.renderChunks(options.pages, groupBy);
		} else if (isString(groupBy)) {
			this.groupByProperty(options.pages, groupBy);
		}

		Util.updateIndex(this);
		Util.renderRow(this);
	}

	public get maxPagesIndex() {
		return this.pages.length - 1;
	}

	private groupByProperty(array: T[] = [], propertyKey: string) {
		this.pages = Object.values(groupBy(array, propertyKey));

		return;
	}

	public previousPage() {
		this.currentIndex--;
		if (this.currentIndex < 0) this.currentIndex = this.maxPagesIndex;
		return this.getCurrentPage();
	}

	public firstPage() {
		this.currentIndex = 0;
		return this.getCurrentPage();
	}

	public getPage(page: number) {
		return this.pages[page];
	}

	public getIndex() {
		return [this.currentIndex, this.maxPagesIndex].map((i) => i + 1);
	}

	public setPage(page: number) {
		this.currentIndex = page;
	}

	public lastPage() {
		this.currentIndex = this.maxPagesIndex;
		return this.getCurrentPage();
	}

	public nextPage() {
		this.currentIndex++;
		if (this.currentIndex > this.maxPagesIndex) this.currentIndex = 0;
		return this.getCurrentPage();
	}

	public getCurrentPage() {
		return this.getPage(this.currentIndex);
	}

	private renderChunks(array: T[] = [], chunkSize: number = 1) {
		if (chunkSize < 0) throw new Error('Can not have a page size of zero or negative number.');

		this.pages = chunk(array, chunkSize);
	}
}
