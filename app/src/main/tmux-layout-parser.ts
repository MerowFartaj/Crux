/**
 * Parses tmux layout strings into a recursive tree structure,
 * then converts to the SplitNode format used by the CRUX renderer.
 *
 * tmux layout format examples:
 *   Single pane:  "b]d4,191x46,0,0,0"
 *   Horizontal:   "b]d4,191x46,0,0{95x46,0,0,0,95x46,96,0,1}"
 *   Vertical:     "b]d4,191x46,0,0[191x23,0,0,0,191x22,0,24,1]"
 *   Nested:       "b]d4,191x46,0,0{95x46,0,0,0,95x46,96,0[95x23,96,0,1,95x22,96,24,2]}"
 *
 * Layout entry:  WxH,X,Y,paneId   (leaf)
 *                WxH,X,Y{...}     (horizontal split - side by side)
 *                WxH,X,Y[...]     (vertical split - stacked)
 */

export interface TmuxLayoutNode {
  width: number;
  height: number;
  x: number;
  y: number;
  paneId?: number;
  direction?: 'h' | 'v';
  children?: TmuxLayoutNode[];
}

export type SplitNode =
  | { type: 'leaf'; tabId: string }
  | { type: 'split'; direction: 'horizontal' | 'vertical'; children: [SplitNode, SplitNode]; sizes: [number, number] };

/**
 * Strip the checksum prefix from a tmux layout string.
 * Layout strings start with a 4-char hex checksum + comma, e.g. "b]d4,"
 */
function stripChecksum(layout: string): string {
  // Match the checksum pattern: 4 hex-ish chars followed by comma
  const match = layout.match(/^[0-9a-f]{4},/i);
  if (match) {
    return layout.slice(match[0].length);
  }
  return layout;
}

/**
 * Parse dimensions "WxH,X,Y" from the start of a string.
 * Returns the parsed values and the remaining string.
 */
function parseDimensions(s: string): { width: number; height: number; x: number; y: number; rest: string } {
  const match = s.match(/^(\d+)x(\d+),(\d+),(\d+)(.*)/);
  if (!match) {
    throw new Error(`Invalid layout dimensions: ${s.slice(0, 30)}`);
  }
  return {
    width: parseInt(match[1], 10),
    height: parseInt(match[2], 10),
    x: parseInt(match[3], 10),
    y: parseInt(match[4], 10),
    rest: match[5],
  };
}

/**
 * Find the matching closing bracket, accounting for nesting.
 */
function findMatchingBracket(s: string, open: string, close: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === open) depth++;
    else if (s[i] === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Split children at the top level (comma-separated), respecting nested brackets.
 */
function splitChildren(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '{' || s[i] === '[') depth++;
    else if (s[i] === '}' || s[i] === ']') depth--;
    else if (s[i] === ',' && depth === 0) {
      parts.push(s.slice(start, i));
      start = i + 1;
    }
  }
  if (start < s.length) {
    parts.push(s.slice(start));
  }
  return parts;
}

/**
 * Recursively parse a tmux layout node.
 */
function parseNode(s: string): TmuxLayoutNode {
  const dim = parseDimensions(s);
  const rest = dim.rest;

  if (rest.startsWith('{')) {
    // Horizontal split (side by side)
    const inner = rest.slice(1);
    const closeIdx = findMatchingBracket(rest, '{', '}');
    if (closeIdx < 0) throw new Error('Unmatched { in layout');
    const childrenStr = rest.slice(1, closeIdx);
    const childParts = splitChildren(childrenStr);
    return {
      width: dim.width,
      height: dim.height,
      x: dim.x,
      y: dim.y,
      direction: 'h',
      children: childParts.map(parseNode),
    };
  }

  if (rest.startsWith('[')) {
    // Vertical split (stacked)
    const closeIdx = findMatchingBracket(rest, '[', ']');
    if (closeIdx < 0) throw new Error('Unmatched [ in layout');
    const childrenStr = rest.slice(1, closeIdx);
    const childParts = splitChildren(childrenStr);
    return {
      width: dim.width,
      height: dim.height,
      x: dim.x,
      y: dim.y,
      direction: 'v',
      children: childParts.map(parseNode),
    };
  }

  // Leaf: rest should be ",<paneId>" or just "<paneId>" after the Y coord
  // Actually, the rest after dimensions for a leaf is ",<paneId>"
  const paneMatch = rest.match(/^,(\d+)/);
  if (paneMatch) {
    return {
      width: dim.width,
      height: dim.height,
      x: dim.x,
      y: dim.y,
      paneId: parseInt(paneMatch[1], 10),
    };
  }

  // Fallback: treat as leaf with unknown pane
  return {
    width: dim.width,
    height: dim.height,
    x: dim.x,
    y: dim.y,
    paneId: -1,
  };
}

/**
 * Convert a TmuxLayoutNode tree to a SplitNode tree.
 *
 * paneToTab maps tmux pane IDs (as strings like "%0") to CRUX tab IDs.
 * If a pane ID is not in the map, a new tab ID is generated and the
 * onNewPane callback is called so the caller can register it.
 */
export function tmuxLayoutToSplitNode(
  node: TmuxLayoutNode,
  paneToTab: Map<string, string>,
  onNewPane?: (paneId: string, tabId: string) => void,
): SplitNode {
  // Leaf node
  if (node.paneId !== undefined && !node.children) {
    const paneKey = `%${node.paneId}`;
    let tabId = paneToTab.get(paneKey);
    if (!tabId) {
      tabId = `tab-${Date.now()}-${node.paneId}`;
      paneToTab.set(paneKey, tabId);
      onNewPane?.(paneKey, tabId);
    }
    return { type: 'leaf', tabId };
  }

  // Split node
  if (node.children && node.children.length > 0 && node.direction) {
    const direction = node.direction === 'h' ? 'horizontal' : 'vertical';
    const childNodes = node.children.map(c => tmuxLayoutToSplitNode(c, paneToTab, onNewPane));

    // Convert N-ary to binary (right-leaning tree)
    if (childNodes.length === 1) {
      return childNodes[0];
    }

    let result = childNodes[childNodes.length - 1];
    for (let i = childNodes.length - 2; i >= 0; i--) {
      const child = node.children[i];
      const sibling = node.children[i + 1] || node.children[node.children.length - 1];

      // Compute sizes from dimensions
      let size1: number, size2: number;
      if (direction === 'horizontal') {
        const totalWidth = child.width + (result === childNodes[childNodes.length - 1]
          ? sibling.width : node.width - child.width);
        size1 = (child.width / (child.width + sibling.width)) * 100;
        size2 = 100 - size1;
      } else {
        size1 = (child.height / (child.height + sibling.height)) * 100;
        size2 = 100 - size1;
      }

      result = {
        type: 'split',
        direction,
        children: [childNodes[i], result] as [SplitNode, SplitNode],
        sizes: [Math.round(size1), Math.round(size2)] as [number, number],
      };
    }
    return result;
  }

  // Fallback: single leaf
  return { type: 'leaf', tabId: 'unknown' };
}

/**
 * Main entry point: parse a full tmux layout string into a SplitNode tree.
 */
export function parseTmuxLayout(
  layoutStr: string,
  paneToTab: Map<string, string>,
  onNewPane?: (paneId: string, tabId: string) => void,
): SplitNode {
  const stripped = stripChecksum(layoutStr);
  const node = parseNode(stripped);
  return tmuxLayoutToSplitNode(node, paneToTab, onNewPane);
}

/**
 * Extract all pane IDs from a tmux layout string.
 */
export function extractPaneIds(layoutStr: string): number[] {
  const stripped = stripChecksum(layoutStr);
  const ids: number[] = [];
  const re = /,(\d+)(?=[,\}\]\s]|$)/g;
  let match: RegExpExecArray | null;
  // Parse the tree properly to get leaf pane IDs
  try {
    const node = parseNode(stripped);
    collectPaneIds(node, ids);
  } catch {
    // Fallback: regex extraction
    while ((match = re.exec(stripped)) !== null) {
      ids.push(parseInt(match[1], 10));
    }
  }
  return ids;
}

function collectPaneIds(node: TmuxLayoutNode, ids: number[]): void {
  if (node.paneId !== undefined && !node.children) {
    ids.push(node.paneId);
  }
  if (node.children) {
    node.children.forEach(c => collectPaneIds(c, ids));
  }
}
