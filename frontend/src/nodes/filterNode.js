// filterNode.js
// Purpose: splits an incoming collection into two streams based on a condition.
// Input: items (left handle) — the collection to filter.
// Outputs: pass, fail (right handles) — items that satisfy/fail the condition.

import { useState } from 'react';
import { BaseNode } from './BaseNode';

export const FilterNode = ({ id, data }) => {
  const [condition, setCondition] = useState(data?.condition || '');

  return (
    <BaseNode id={id} title="Filter" inputs={[{ id: 'items' }]} outputs={[{ id: 'pass' }, { id: 'fail' }]}>
      <label>
        Condition:
        <input type="text" value={condition} onChange={(e) => setCondition(e.target.value)} />
      </label>
    </BaseNode>
  );
}
