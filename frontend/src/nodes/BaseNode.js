// BaseNode.js
// Shared node shell: wrapper, title header, auto-spaced handles, body slot.

import { Handle, Position } from 'reactflow';

const spacedTop = (index, total) => `${((index + 1) / (total + 1)) * 100}%`;

export const BaseNode = ({ id, title, inputs = [], outputs = [], children }) => {
  return (
    <div style={{ width: 200, minHeight: 80, border: '1px solid black' }}>
      <div>
        <span>{title}</span>
      </div>
      <div>{children}</div>
      {inputs.map((input, i) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={`${id}-${input.id}`}
          style={{ top: spacedTop(i, inputs.length), ...input.style }}
        />
      ))}
      {outputs.map((output, i) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={`${id}-${output.id}`}
          style={{ top: spacedTop(i, outputs.length), ...output.style }}
        />
      ))}
    </div>
  );
};
