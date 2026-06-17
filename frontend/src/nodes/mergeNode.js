// mergeNode.js
// Purpose: combines up to three input values into one, joined by a separator.
// Inputs: a, b, c (left handles) — the values to combine.
// Output: combined (right handle) — the joined result.

import { useState } from 'react';
import { BaseNode } from './BaseNode';

export const MergeNode = ({ id, data }) => {
  const [separator, setSeparator] = useState(data?.separator || ', ');

  return (
    <BaseNode
      id={id}
      title="Merge"
      inputs={[{ id: 'a' }, { id: 'b' }, { id: 'c' }]}
      outputs={[{ id: 'combined' }]}
    >
      <label>
        Separator:
        <input type="text" value={separator} onChange={(e) => setSeparator(e.target.value)} />
      </label>
    </BaseNode>
  );
}
