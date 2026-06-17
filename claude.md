# VectorShift Frontend Assessment — Claude Code Instructions

## Project Overview
A React Flow-based pipeline builder. Users drag nodes onto a canvas, connect them,
and submit the pipeline to a FastAPI backend for validation.

**Stack:**
- Frontend: React (Create React App), React Flow v11.8.3
- Backend: Python, FastAPI
- Frontend: `cd frontend && npm start` → localhost:3000
- Backend: `cd backend && uvicorn main:app --reload` → localhost:8000

---

## File Map — Read These Before Touching Anything

```
/backend/
  main.py                  ← FastAPI app; edit for Part 4

/frontend/src/
  nodes/
    inputNode.js           ← Input node (has source handle on right)
    llmNode.js             ← LLM node (2 target handles left, 1 source right)
    outputNode.js          ← Output node (has target handle on left)
    textNode.js            ← Text node (source handle right; Part 3 target)
  App.js                   ← root component
  ui.js                    ← main React Flow canvas
  store.js                 ← Zustand store (nodes, edges, actions)
  toolbar.js               ← node palette sidebar
  draggableNode.js         ← makes toolbar nodes draggable
  submit.js                ← submit button; edit for Part 4
  index.css                ← global styles
```

---

## Existing Code Patterns — Understand Before Refactoring

### Current node pattern (all 4 nodes follow this exactly):
```jsx
export const SomeNode = ({ id, data }) => {
  return (
    <div style={{width: 200, height: 80, border: '1px solid black'}}>
      <div><span>Title</span></div>
      <div>/* body content */</div>
      <Handle type="source|target" position={Position.Left|Right} id={`${id}-handlename`} />
    </div>
  );
}
```

- All nodes use **inline styles only** — no CSS classes
- Fixed `width: 200, height: 80` on every node
- Handle IDs follow the pattern `${id}-handlename`
- Imported from `'reactflow'` (v11) — never `'@xyflow/react'`

### Store shape (store.js — Zustand, standalone install):
```js
// Zustand IS a standalone dependency here (imported via `create` from 'zustand')
// Do NOT use useReactFlow() to access nodes/edges — use the store directly

import { useStore } from './store';
const nodes = useStore((state) => state.nodes);
const edges = useStore((state) => state.edges);
```

**Available store actions:**
- `getNodeID(type)` — generates unique node ID
- `addNode(node)` — adds a node to canvas
- `onNodesChange`, `onEdgesChange`, `onConnect` — wired to React Flow
- `updateNodeField(nodeId, fieldName, fieldValue)` — updates a node's data field

### Submit button (submit.js — currently does nothing):
```jsx
export const SubmitButton = () => {
  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <button type="submit">Submit</button>
    </div>
  );
}
```

---

## Part 1: Node Abstraction

**Goal:** Eliminate the duplicated wrapper div, title, and handle logic across all node files.

### Build `src/nodes/BaseNode.js`:
```jsx
// BaseNode accepts:
{
  id,          // string — from React Flow (required)
  data,        // object — from React Flow (required)
  title,       // string — displayed in node header
  inputs,      // array of { id, label, style? } — rendered as target Handles on left
  outputs,     // array of { id, label, style? } — rendered as source Handles on right
  children,    // JSX — node body (fields, selects, text, etc.)
}
```

### After building BaseNode:
1. Migrate all 4 existing nodes to use it
2. Verify all 4 still render and connect correctly before proceeding
3. Create 5 new nodes using BaseNode — each must be ~15 lines max

### Handle ID convention — do not change:
Keep existing pattern: `id` prop on each Handle must be `${id}-handlename`

### Do not:
- Put per-node wrapper divs, border styles, or title spans outside BaseNode
- Build the 5 new nodes before migrating the original 4

---

## Part 2: Styling

**Approach:** Plain CSS only. Use `index.css` for globals, add CSS classes to BaseNode.
Do not install Tailwind, MUI, or any component library.

**Replace all inline `style={{...}}` props with CSS classes** — starting with BaseNode,
which will cascade styles to all nodes automatically.

**Target aesthetic:** Dark canvas, clean node cards with a colored header bar,
subtle border, visible handle dots.

**Minimum scope:**
- Canvas background + React Flow controls
- Node card (wrapper, header, body)
- Handle dots (left vs right visually distinct)
- Toolbar sidebar
- Submit button
- Alert/result display (Part 4)

---

## Part 3: Text Node — Dynamic Behavior

Edit `textNode.js` only. Two behaviors:

### 1. Auto-resize
- Switch the `<input type="text">` to a `<textarea>`
- Remove the fixed `width: 200, height: 80` from this node
- Grow width/height dynamically based on content:
```jsx
const [size, setSize] = useState({ width: 200, height: 80 });
// Recalculate on every onChange based on text length/line count
```

### 2. Dynamic variable handles
- Parse textarea content on every `onChange`:
```js
const VAR_REGEX = /\{\{(\s*[a-zA-Z_][a-zA-Z0-9_]*\s*)\}\}/g;
const extractVars = (text) => {
  const matches = [];
  let match;
  while ((match = VAR_REGEX.exec(text)) !== null) {
    const name = match[1].trim();
    if (!matches.includes(name)) matches.push(name);
  }
  return matches;
};
```
- Store extracted variable names in state: `const [variables, setVariables] = useState([])`
- Render one `<Handle type="target" position={Position.Left} id={varName} />` per variable
- Handles appear/disappear live as user types
- Default text is `'{{input}}'` — so one handle should render on mount

### Edge cases:
- Same variable twice → one handle only (deduplicate)
- `{{}}` or invalid JS identifier → skip
- Variable deleted from text → handle disappears immediately

---

## Part 4: Backend Integration

### Frontend — update `submit.js`:
```jsx
import { useStore } from './store';

export const SubmitButton = () => {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:8000/pipelines/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });
      const data = await response.json();
      alert(
        `Pipeline Summary\n\nNodes: ${data.num_nodes}\nEdges: ${data.num_edges}\nValid DAG: ${data.is_dag ? 'Yes ✓' : 'No ✗'}`
      );
    } catch (err) {
      alert('Error: Could not reach backend. Is it running on port 8000?');
    }
  };

  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <button type="button" onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

### Backend — update `main.py`:

**Current state of main.py — has two bugs that must be fixed:**
```python
from fastapi import FastAPI, Form

app = FastAPI()

@app.get('/')
def read_root():
    return {'Ping': 'Pong'}

@app.get('/pipelines/parse')          # BUG 1: must be @app.post
def parse_pipeline(pipeline: str = Form(...)):  # BUG 2: Form() won't work, needs Pydantic model
    return {'status': 'parsed'}
```

**Bug 1:** `@app.get` → must become `@app.post`
The frontend sends a POST request with a JSON body. GET requests cannot have a body — this endpoint will never receive data as a GET.

**Bug 2:** `pipeline: str = Form(...)` → must be replaced with a Pydantic `BaseModel`
`Form(...)` expects HTML form-encoded data (`application/x-www-form-urlencoded`). The frontend sends JSON (`application/json`). These are incompatible — FastAPI will reject every request.

**Keep** the `read_root` GET endpoint untouched — it is a working health check.

**Step 1 — Add CORS first (do this before anything else):**
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Step 2 — Add the endpoint:**
```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
from collections import defaultdict

class Pipeline(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

@app.post('/pipelines/parse')
def parse_pipeline(pipeline: Pipeline):
    nodes = pipeline.nodes
    edges = pipeline.edges

    def check_is_dag(nodes, edges):
        graph = defaultdict(list)
        for edge in edges:
            graph[edge['source']].append(edge['target'])
        visited, rec_stack = set(), set()
        def dfs(node):
            visited.add(node)
            rec_stack.add(node)
            for neighbor in graph[node]:
                if neighbor not in visited:
                    if dfs(neighbor): return True
                elif neighbor in rec_stack:
                    return True
            rec_stack.remove(node)
            return False
        return not any(dfs(n['id']) for n in nodes if n['id'] not in visited)

    return {
        'num_nodes': len(nodes),
        'num_edges': len(edges),
        'is_dag': check_is_dag(nodes, edges)
    }
```

---

## Hard Rules — Never Violate

1. **React Flow v11 only** — import from `'reactflow'`, never `'@xyflow/react'`
2. **Access nodes/edges from `useStore`** — not `useReactFlow()`. The store is Zustand standalone.
3. **All Handle `id` props must be unique per node** — duplicates break connections silently
4. **Never mutate node/edge state directly** — use store actions
5. **CORS must be added to main.py before testing Part 4** — do it first or fetch will fail
6. **Do not eject CRA**
7. **Migrate original 4 nodes before creating 5 new ones**

---

## Execution Order

1. Read all files in `src/nodes/` + `store.js` + `submit.js` before writing anything
2. Build `BaseNode.js`
3. Migrate 4 existing nodes → verify they render
4. Add 5 new nodes using BaseNode
5. Apply CSS styling across all components
6. Implement Text node auto-resize + variable handles
7. Add CORS to `main.py` + implement `/pipelines/parse`
8. Update `submit.js` with fetch + alert
9. End-to-end test: build pipeline → submit → verify alert shows correct values

---

## Teaching & Communication Requirements — Non-Negotiable

### Explain everything you do
Before writing any code, explain:
- **What** you are about to build
- **Why** this approach was chosen over alternatives
- **How** it works conceptually, not just what the code says

The user knows React.js. Explanations should be peer-level — skip basics like
"useState stores state", but do explain things like why BaseNode uses children
as a prop instead of a render prop, or why the DAG check uses rec_stack
separately from visited.

After writing code, briefly explain:
- What the key decisions were
- What could go wrong and why you handled it the way you did
- What the user should visually see change after this step

### Never silently make a decision
If there are two reasonable ways to do something, name both, explain the tradeoff,
then say which one you're going with and why.

Example: "I could handle auto-resize by measuring scrollHeight or by calculating
character count. I'm using scrollHeight because it handles line breaks correctly
without needing font metrics."

---

## Phased Execution — Strictly Follow This Order

Complete one phase fully before starting the next.
After each phase, stop and tell the user:
- What was built
- What they should see in the browser right now
- What the next phase will do

---

### Phase 1 — Read and Understand (no code written)
- Read every file in `src/nodes/`, `store.js`, `submit.js`, `ui.js`, `App.js`
- Summarize what each file does in 1-2 sentences
- Identify all the duplicated code across the 4 node files
- Explain the plan for BaseNode before writing a single line
- Wait for user confirmation before proceeding

### Phase 2 — Build BaseNode abstraction
- Create `src/nodes/BaseNode.js`
- Explain the prop design decisions before writing
- Migrate all 4 existing nodes to use BaseNode
- Verify each migrated node matches its original behavior exactly
- Stop and confirm with user before adding new nodes

### Phase 3 — Add 5 new nodes
- Create 5 new nodes using BaseNode
- Each should demonstrate a different combination of inputs/outputs/body content
- Show how little code each one requires vs the original pattern
- Explain what each new node does and why it demonstrates the abstraction well

### Phase 4 — Styling
- Explain the CSS approach before writing any styles
- Style BaseNode first — this cascades to all nodes automatically
- Then style: canvas, toolbar, handles, submit button
- Explain each major visual decision (color choices, layout, spacing)
- Stop and confirm user is happy with the look before proceeding

### Phase 5 — Text Node dynamic behavior
- Explain how auto-resize will work before implementing
- Explain how variable handle extraction works (regex, deduplication, React state)
- Implement both behaviors
- Walk through the regex pattern so the user understands it:
  `/\{\{(\s*[a-zA-Z_][a-zA-Z0-9_]*\s*)\}\}/g`
  - `\{\{` and `\}\}` — literal double curly braces
  - `\s*` — optional whitespace inside
  - `[a-zA-Z_]` — variable must start with a letter or underscore
  - `[a-zA-Z0-9_]*` — followed by letters, digits, or underscores
  - `g` flag — find ALL matches in the string, not just the first

### Phase 6 — Backend endpoint
- Explain what a DAG is and why pipelines must be DAGs before writing any code
- Explain the DFS cycle detection algorithm step by step before implementing
- Add CORS middleware first, then the endpoint
- Show the request/response shape clearly

### Phase 7 — Frontend submit integration
- Explain how useStore is used to access nodes/edges
- Implement the fetch call and alert
- Explain why `type="button"` is used instead of `type="submit"`

### Phase 8 — End-to-end test
- Walk the user through building a test pipeline
- Submit it and verify the alert shows correct values
- Test an invalid pipeline (with a loop) and verify is_dag returns false
- Summarize everything that was built across all phases