'use client';

import { defaultMarkdownSerializer } from 'prosemirror-markdown';
import { DOMParser, type Node } from 'prosemirror-model';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { renderToString } from 'react-dom/server';

import { Markdown } from '@/components/markdown';
import { documentSchema } from './config';
import { createSuggestionWidget, type UISuggestion, projectWithPositions } from './suggestions';

// ✅ Parses markdown content into a ProseMirror document
export const buildDocumentFromContent = (content: string) => {
  const parser = DOMParser.fromSchema(documentSchema);
  const stringFromMarkdown = renderToString(<Markdown>{content}</Markdown>);
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = stringFromMarkdown;
  return parser.parse(tempContainer);
};

// ✅ Converts ProseMirror document back to markdown content
export const buildContentFromDocument = (document: Node) => {
  return defaultMarkdownSerializer.serialize(document);
};

// ✅ Creates decorations dynamically by fetching suggestions from the backend
export const createDecorations = async (
  documentId: string,
  view: EditorView,
) => {
  try {
    // Fetch suggestions from the backend for a specific document ID
    const suggestions = await fetchSuggestions(documentId);

    // Map suggestions to positions within the document
    const mappedSuggestions = await projectWithPositions(view.state.doc, suggestions);

    const decorations: Array<Decoration> = [];

    // Loop through each mapped suggestion and create the corresponding decorations
    for (const suggestion of mappedSuggestions) {
      if (
        typeof suggestion.selectionStart !== 'number' ||
        typeof suggestion.selectionEnd !== 'number' ||
        suggestion.selectionStart >= suggestion.selectionEnd
      ) {
        console.warn('Skipping invalid suggestion:', suggestion);
        continue;
      }

      // Inline decoration for suggestion highlight
      decorations.push(
        Decoration.inline(
          suggestion.selectionStart,
          suggestion.selectionEnd,
          { class: 'suggestion-highlight' },
          { suggestionId: suggestion.id, type: 'highlight' },
        ),
      );

      // Widget decoration for suggestion interaction
      const widget = createSuggestionWidget(suggestion, view);
      if (!widget || !widget.dom) {
        console.warn('Skipping widget creation for:', suggestion);
        continue;
      }

      decorations.push(
        Decoration.widget(
          suggestion.selectionStart,
          () => widget.dom,
          { suggestionId: suggestion.id, type: 'widget' },
        ),
      );
    }

    return DecorationSet.create(view.state.doc, decorations);
  } catch (error) {
    console.error('Error creating decorations:', error);
    return DecorationSet.empty;
  }
};

// Function to fetch suggestions from the backend
const fetchSuggestions = async (documentId: string): Promise<UISuggestion[]> => {
  try {
    const response = await fetch(`/suggestions?documentId=${documentId}`, {
      method: 'GET',
      headers: {
        'X-User-Id': 'current-user-id', // Replace with actual user ID from session/auth
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching suggestions: ${response.statusText}`);
    }

    const suggestions = await response.json();
    return suggestions; // Assuming the backend returns an array of suggestions
  } catch (error) {
    console.error('Error fetching suggestions from backend:', error);
    return []; // Return an empty array if an error occurs
  }
};