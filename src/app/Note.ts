import { Tag } from "./components/popup-note/popup-note.component";

export interface Note {
	id?: number;
	title: string;
	tags: string[];
	content: string;
}
