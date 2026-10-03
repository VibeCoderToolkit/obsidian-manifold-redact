'use strict';

/*
 * Manifold Redaction
 *
 * Wraps the selected passage in <mark class="redacted">, which the Manifold
 * theme draws as a bar with the text knocked out, the way a reviewing officer
 * blacks out a passage.
 *
 * Run it again on the same passage to lift the bar.
 *
 * The words stay in the file. This is a document marking, not encryption: the
 * plain text is still there for search, sync, export and anyone who opens the
 * file. If a passage really must not be read, delete it.
 */

const { Plugin, Notice } = require('obsidian');

const OPEN = '<mark class="redacted">';
const CLOSE = '</mark>';

class ManifoldRedaction extends Plugin {
  onload() {
    /* Bindable from Settings, Hotkeys as "Manifold Redaction: Toggle redaction". */
    this.addCommand({
      id: 'toggle-redaction',
      name: 'Toggle redaction on the selection',
      editorCallback: (editor) => this.toggle(editor),
    });

    /* Right-click menu, shown only when something is selected. */
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor) => {
        if (!editor.getSelection()) return;
        menu.addItem((item) =>
          item
            .setTitle('Redact selection')
            .setIcon('eye-off')
            .onClick(() => this.toggle(editor))
        );
      })
    );
  }

  /** Selection as document offsets, always low to high. */
  bounds(editor) {
    const from = editor.posToOffset(editor.getCursor('from'));
    const to = editor.posToOffset(editor.getCursor('to'));
    return from <= to ? [from, to] : [to, from];
  }

  toggle(editor) {
    const [from, to] = this.bounds(editor);
    if (from === to) {
      new Notice('Select the passage to redact first.');
      return;
    }

    const doc = editor.getValue();
    const selected = doc.slice(from, to);

    /* Already redacted, markers included: lift it. */
    if (selected.startsWith(OPEN) && selected.endsWith(CLOSE)) {
      this.replace(
        editor,
        doc.slice(from + OPEN.length, to - CLOSE.length),
        from,
        to
      );
      return;
    }

    /* Selected from inside a redaction: lift that whole one. */
    const span = this.enclosingSpan(doc, from, to);
    if (span) {
      this.replace(
        editor,
        doc.slice(span[0] + OPEN.length, span[1]),
        span[0],
        span[1] + CLOSE.length
      );
      return;
    }

    /* Otherwise cover it. */
    editor.replaceSelection(OPEN + editor.getSelection() + CLOSE);
  }

  replace(editor, text, from, to) {
    editor.replaceRange(text, editor.offsetToPos(from), editor.offsetToPos(to));
  }

  /**
   * The redaction surrounding this selection, as [openStart, closeStart], or
   * null when the selection is not enclosed by exactly one pair of markers.
   */
  enclosingSpan(doc, from, to) {
    const open = doc.lastIndexOf(OPEN, from);
    if (open === -1) return null;

    const close = doc.indexOf(CLOSE, to);
    if (close === -1) return null;

    /* Reject a pair that straddles another redaction, which would mean the
       selection crosses a boundary. */
    if (doc.slice(open + OPEN.length, from).indexOf(CLOSE) !== -1) return null;
    if (doc.slice(to, close).indexOf(OPEN) !== -1) return null;

    return [open, close];
  }
}

module.exports = ManifoldRedaction;
