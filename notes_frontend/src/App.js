import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

// Backend API base URL
const API_BASE =
  process.env.REACT_APP_NOTES_API || "http://localhost:8000";

// Utilities for API
async function fetchNotes(search = "") {
  const url = search
    ? `${API_BASE}/notes?search=${encodeURIComponent(search)}`
    : `${API_BASE}/notes`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch notes");
  return await response.json();
}
async function createNote({ title, content }) {
  const response = await fetch(`${API_BASE}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  if (!response.ok)
    throw new Error("Failed to create note: " + (await response.text()));
  return await response.json();
}
async function updateNote(id, { title, content }) {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  if (!response.ok)
    throw new Error("Failed to update note: " + (await response.text()));
  return await response.json();
}
async function deleteNote(id) {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: "DELETE",
  });
  if (!response.ok)
    throw new Error("Failed to delete note: " + (await response.text()));
  return true;
}
async function fetchNote(id) {
  const response = await fetch(`${API_BASE}/notes/${id}`);
  if (!response.ok)
    throw new Error("Failed to fetch note: " + (await response.text()));
  return await response.json();
}

// MAIN APP COMPONENT
function App() {
  const [theme, setTheme] = useState("light");
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editor, setEditor] = useState({ title: "", content: "" });
  const [editorMode, setEditorMode] = useState("view"); // or "edit" or "new"
  const [error, setError] = useState("");

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Load notes list
  const reloadNotes = useCallback(
    (currentSearch = search) => {
      setLoading(true);
      fetchNotes(currentSearch)
        .then(setNotes)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    },
    [search]
  );

  useEffect(() => {
    reloadNotes();
    // eslint-disable-next-line
  }, []);

  // Handle search input and reload notes
  function handleSearchInput(e) {
    const value = e.target.value;
    setSearch(value);
    setError("");
    setTimeout(() => {
      fetchNotes(value)
        .then((notes) => setNotes(notes))
        .catch((e) => setError(e.message));
    }, 220);
  }

  // Select a note to view
  function handleSelectNote(note) {
    setSelectedNote(note);
    setEditor(note);
    setEditorMode("view");
    setError("");
  }

  // Start editing
  function handleEditNote(note) {
    setEditor(note);
    setSelectedNote(note);
    setEditorMode("edit");
    setError("");
  }

  // Start adding a new note
  function handleAddNote() {
    setSelectedNote(null);
    setEditor({ title: "", content: "" });
    setEditorMode("new");
    setError("");
  }

  // Save new or edited note
  async function handleSaveNote(e) {
    e.preventDefault();
    setError("");
    try {
      if (editorMode === "new") {
        const newNote = await createNote(editor);
        reloadNotes();
        setSelectedNote(newNote);
        setEditor(newNote);
        setEditorMode("view");
      } else if (editorMode === "edit" && selectedNote) {
        const updated = await updateNote(selectedNote.id, editor);
        reloadNotes();
        setSelectedNote(updated);
        setEditor(updated);
        setEditorMode("view");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  // Delete selected note
  async function handleDeleteNote(noteId) {
    if (
      !window.confirm(
        "Are you sure you want to delete this note? This action cannot be undone."
      )
    )
      return;
    setError("");
    try {
      await deleteNote(noteId);
      reloadNotes();
      setSelectedNote(null);
      setEditorMode("view");
      setEditor({ title: "", content: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Note list sorted by most recently updated
  const sortedNotes = [...notes].sort((a, b) =>
    new Date(b.updated_at) - new Date(a.updated_at)
  );

  return (
    <div className="App">
      <header className="topbar">
        <div className="logo-title">
          <span className="logo">🗒️</span>
          <span className="title">Note Keeper</span>
        </div>
        <div className="topbar-actions">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </header>
      <main className="main-content">
        <section className="sidebar">
          <div className="sidebar-top">
            <button className="add-btn" onClick={handleAddNote} title="Add note">
              ＋ New
            </button>
            <input
              className="search-input"
              type="search"
              placeholder="Search notes…"
              value={search}
              onChange={handleSearchInput}
              aria-label="Search notes"
            />
          </div>
          <div className="notes-list">
            {loading ? (
              <div className="loading-text">Loading…</div>
            ) : sortedNotes.length === 0 ? (
              <div className="no-notes-text">No notes found.</div>
            ) : (
              sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className={
                    "note-list-item" +
                    (selectedNote && note.id === selectedNote.id ? " selected" : "")
                  }
                  onClick={() => handleSelectNote(note)}
                >
                  <div className="note-title">
                    {note.title.length > 30
                      ? note.title.slice(0, 30) + "…"
                      : note.title}
                  </div>
                  <div className="note-date">
                    {new Date(note.updated_at).toLocaleDateString([], {
                      year: "2-digit",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="editor-viewer">
          {error && <div className="error-message">{error}</div>}
          {/* Editor for new or editing state */}
          {(editorMode === "edit" || editorMode === "new") && (
            <form
              className="note-editor-form"
              onSubmit={handleSaveNote}
              autoComplete="off"
            >
              <input
                className="title-input"
                type="text"
                placeholder="Note title"
                value={editor.title}
                required
                maxLength={100}
                onChange={(e) =>
                  setEditor((ed) => ({ ...ed, title: e.target.value }))
                }
              />
              <textarea
                className="content-input"
                placeholder="Write your note here…"
                value={editor.content}
                rows={10}
                minLength={1}
                onChange={(e) =>
                  setEditor((ed) => ({ ...ed, content: e.target.value }))
                }
                required
              />
              <div className="editor-actions">
                <button className="btn-save" type="submit">
                  💾 {editorMode === "new" ? "Create" : "Save"}
                </button>
                {editorMode === "edit" && selectedNote && (
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setEditor(selectedNote);
                      setEditorMode("view");
                      setError("");
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
          {/* View/Read-only display */}
          {editorMode === "view" && selectedNote && (
            <div className="note-viewer">
              <h2>{selectedNote.title}</h2>
              <div className="note-dates">
                <span title="Created date">
                  🕒{" "}
                  {new Date(selectedNote.created_at).toLocaleString([], {
                    year: "2-digit",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span title="Last update" className="last-update">
                  ⏱ Updated{" "}
                  {new Date(selectedNote.updated_at).toLocaleString([], {
                    year: "2-digit",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <pre className="note-content">
                {selectedNote.content || <i>(empty)</i>}
              </pre>
              <div className="viewer-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleEditNote(selectedNote)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteNote(selectedNote.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}
          {/* If nothing selected and not adding new */}
          {!selectedNote && editorMode !== "new" && (
            <div className="empty-state-text">
              Select a note or click <b>＋ New</b> to create a note.
            </div>
          )}
        </section>
      </main>
      <footer className="app-footer">
        <span>
          © {new Date().getFullYear()} Note Keeper. All rights reserved.
        </span>
      </footer>
    </div>
  );
}

export default App;
