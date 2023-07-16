import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Note } from "../Note";

@Injectable({
	providedIn: "root",
})
export class NoteService {
	private apiUrl = "http://localhost:5000/notes";

	constructor(private http: HttpClient) {}

	getNotes(): Observable<Note[]> {
		return this.http.get<Note[]>(this.apiUrl);
	}

	deleteNote(note: Note): Observable<Note> {
		const url = `${this.apiUrl}/${note.id}`;
		return this.http.delete<Note>(url);
	}
}
