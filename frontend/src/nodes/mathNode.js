// mathNode.js
// Purpose: applies an arithmetic operation to two values.
// Inputs: a, b (left handles) — the two operands.
// Output: result (right handle) — a op b.

import { useState } from 'react';
import { BaseNode } from './BaseNode';

export const MathNode = ({ id, data }) => {
  const [op, setOp] = useState(data?.op || 'add');

  return (
    <BaseNode id={id} title="Math" inputs={[{ id: 'a' }, { id: 'b' }]} outputs={[{ id: 'result' }]}>
      <label>
        Op:
        <select value={op} onChange={(e) => setOp(e.target.value)}>
          <option value="add">a + b</option>
          <option value="subtract">a - b</option>
          <option value="multiply">a * b</option>
        </select>
      </label>
    </BaseNode>
  );
}
