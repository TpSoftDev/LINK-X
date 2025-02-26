import type { Node } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import {
  type Decoration,
  DecorationSet,
  type EditorView,
} from 'prosemirror-view';
import { createRoot } from 'react-dom/client';

import { Suggestion as PreviewSuggestion } from '@/components/suggestion';
import { BlockKind } from '@/components/block';

// Define backend API endpoint
const API_URL = 'http://localhost:8080/suggestions';

export interface UISuggestion {
  id: string;
  originalText: string;
  suggestedText: string;
  selectionStart: number;
  selectionEnd: number;
}

interface Position {
  start: number;
  end: number;
}

async function fetchSuggestions(documentId: string): Promise<UISuggestion[]> {
  try {
    const response = await fetch(`${API_URL}?documentId=${documentId}`, {
      headers: {
        'X-User-Id': getUserId(),
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching suggestions: ${response.statusText}`);
    }

    const suggestions = await response.json();
    return suggestions;
  } catch (error) {
    console.error('Failed to load suggestions:', error);
    return [];
  }
}

function getUserId(): string {
  return 'user-123';
}

function findPositionsInDoc(doc: Node, searchText: string): Position | null {
  let positions: { start: number; end: number } | null = null;

  doc.nodesBetween(0, doc.content.size, (node, pos) => {
    if (node.isText && node.text) {
      const index = node.text.indexOf(searchText);

      if (index !== -1) {
        positions = {
          start: pos + index,
          end: pos + index + searchText.length,
        };

        return false;
      }
    }

    return true;
  });

  return positions;
}

export async function projectWithPositions(doc: Node, documentId: string): Promise<UISuggestion[]> {
  const suggestions = await fetchSuggestions(documentId);

  return suggestions.map((suggestion) => {
    const positions = findPositionsInDoc(doc, suggestion.originalText);

    if (!positions) {
      return { ...suggestion, selectionStart: 0, selectionEnd: 0 };
    }

    return { ...suggestion, selectionStart: positions.start, selectionEnd: positions.end };
  });
}

export function createSuggestionWidget(
  suggestion: UISuggestion,
  view: EditorView,
  blockKind: BlockKind = 'text',
): { dom: HTMLElement; destroy: () => void } {
  const dom = document.createElement('span');
  const root = createRoot(dom);

  dom.addEventListener('mousedown', (event) => {
    event.preventDefault();
    view.dom.blur();
  });

  const onApply = () => {
    const { state, dispatch } = view;

    const decorationTransaction = state.tr;
    const currentState = suggestionsPluginKey.getState(state);
    const currentDecorations = currentState?.decorations;

    if (currentDecorations) {
      const newDecorations = DecorationSet.create(
        state.doc,
        currentDecorations.find().filter((decoration: Decoration) => {
          return decoration.spec.suggestionId !== suggestion.id;
        }),
      );

      decorationTransaction.setMeta(suggestionsPluginKey, {
        decorations: newDecorations,
        selected: null,
      });
      dispatch(decorationTransaction);
    }

    const textTransaction = view.state.tr.replaceWith(
      suggestion.selectionStart,
      suggestion.selectionEnd,
      state.schema.text(suggestion.suggestedText),
    );

    textTransaction.setMeta('no-debounce', true);

    dispatch(textTransaction);
  };

  root.render(
    <PreviewSuggestion
      suggestion={suggestion}
      onApply={onApply}
      blockKind={blockKind}
    />,
  );

  return {
    dom,
    destroy: () => {
      setTimeout(() => {
        root.unmount();
      }, 0);
    },
  };
}

export const suggestionsPluginKey = new PluginKey('suggestions');
export const suggestionsPlugin = new Plugin({
  key: suggestionsPluginKey,
  state: {
    init() {
      return { decorations: DecorationSet.empty, selected: null };
    },
    apply(tr, state) {
      const newDecorations = tr.getMeta(suggestionsPluginKey);
      if (newDecorations) return newDecorations;

      return {
        decorations: state.decorations.map(tr.mapping, tr.doc),
        selected: state.selected,
      };
    },
  },
  props: {
    decorations(state) {
      return this.getState(state)?.decorations ?? DecorationSet.empty;
    },
  },
});