// noteNode.js
// Purpose: a free-text annotation on the canvas, not part of pipeline data flow.
// Inputs: none.
// Output: none.

import { useState } from 'react';
import { BaseNode } from './BaseNode';

export const NoteNode = ({ id, data }) => {
  const [note, setNote] = useState(data?.note || '');

  return (
    <BaseNode id={id} title="Note">
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Leave a note..." />
    </BaseNode>
  );
}
