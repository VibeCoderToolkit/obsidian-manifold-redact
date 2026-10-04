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

const count = (haystack, needle) => haystack.split(needle).length - 1;

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
    const balanced = count(selected, OPEN) === count(selected, CLOSE);

    /* Already redacted, its own markers included: lift it. Only when the
       selection holds exactly one pair, or slicing would unbalance the rest. */
    if (
      balanced &&
      count(selected, OPEN) === 1 &&
      selected.startsWith(OPEN) &&
      selected.endsWith(CLOSE)
    ) {
      this.replace(editor, selected.slice(OPEN.length, selected.length - CLOSE.length), from, to);
      return;
    }

    /* Selected from inside exactly one redaction: lift that whole one. */
    const span = this.enclosingSpan(doc, from, to);
    if (span) {
      this.replace(editor, doc.slice(span[0] + OPEN.length, span[1]), span[0], span[1] + CLOSE.length);
      return;
    }

    /* The selection touches redaction markup but is not one clean pair, so
       wrapping or cutting here would corrupt the note. Refuse and say so. */
    if (count(selected, OPEN) || count(selected, CLOSE)) {
      new Notice('That selection spans more than one redaction. Select a single passage.');
      return;
    }

    /* Otherwise cover it. */
    editor.replaceSelection(OPEN + editor.getSelection() + CLOSE);
  }

  replace(editor, text, from, to) {
    editor.replaceRange(text, editor.offsetToPos(from), editor.offsetToPos(to));
  }

  /**
   * The one redaction surrounding this selection, as [openStart, closeStart],
   * or null when the selection is not enclosed by exactly one pair of markers.
   */
  enclosingSpan(doc, from, to) {
    const open = doc.lastIndexOf(OPEN, from);
    if (open === -1) return null;

    const close = doc.indexOf(CLOSE, to);
    if (close === -1) return null;

    /* The whole region between those two markers must hold one clean pair. */
    const region = doc.slice(open, close + CLOSE.length);
    if (count(region, OPEN) !== 1 || count(region, CLOSE) !== 1) return null;

    return [open, close];
  }
}

module.exports = ManifoldRedaction;
