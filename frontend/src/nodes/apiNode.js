// apiNode.js
// Purpose: makes an HTTP request to an external URL.
// Input: url (left handle) — the request URL.
// Output: response (right handle) — the HTTP response body.

import { useState } from 'react';
import { BaseNode } from './BaseNode';

export const APINode = ({ id, data }) => {
  const [method, setMethod] = useState(data?.method || 'GET');
  const [timeout, setTimeout] = useState(data?.timeout || '5000');

  return (
    <BaseNode id={id} title="API" inputs={[{ id: 'url' }]} outputs={[{ id: 'response' }]}>
      <label>
        Method:
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
        </select>
      </label>
      <label>
        Timeout (ms):
        <input type="text" value={timeout} onChange={(e) => setTimeout(e.target.value)} />
      </label>
    </BaseNode>
  );
}
