// Shared render/traversal shape for both tree types.
// General trees: kids = children (never null). BSTs: kids = [left, right] (null kept).
export interface RNode { id: number; label: string; kids: (RNode | null)[]; keys?: number[]; color?: 'RED' | 'BLACK' }
export type Mode = "general" | "bst";
export type Algorithm = "inorder" | "preorder" | "postorder" | "levelorder" | "dfs";
export interface Step { id: number; label: string; line: number; note: string }

interface Meta { name: string; short: string; explain: string[]; code: string[]; visitLine: number; time: string; space: string }

const kidsOf = (n: RNode) => n.kids.filter((k): k is RNode => !!k);

export const ALGORITHMS: Record<Mode, Partial<Record<Algorithm, Meta>>> = {
  bst: {
    inorder: {
      name: "Inorder Traversal", short: "Left → Node → Right. On a BST this yields values in sorted order.",
      explain: ["Traverse the left subtree.", "Visit the current node.", "Traverse the right subtree."],
      code: ["function inorder(node):", "    if node is null: return", "    inorder(node.left)", "    visit(node)", "    inorder(node.right)"],
      visitLine: 3, time: "O(n)", space: "O(h) recursion stack",
    },
    preorder: {
      name: "Preorder Traversal", short: "Node → Left → Right. Useful for copying or serializing a tree.",
      explain: ["Visit the current node.", "Traverse the left subtree.", "Traverse the right subtree."],
      code: ["function preorder(node):", "    if node is null: return", "    visit(node)", "    preorder(node.left)", "    preorder(node.right)"],
      visitLine: 2, time: "O(n)", space: "O(h) recursion stack",
    },
    postorder: {
      name: "Postorder Traversal", short: "Left → Right → Node. Children before parents — ideal for deleting a tree.",
      explain: ["Traverse the left subtree.", "Traverse the right subtree.", "Visit the current node."],
      code: ["function postorder(node):", "    if node is null: return", "    postorder(node.left)", "    postorder(node.right)", "    visit(node)"],
      visitLine: 4, time: "O(n)", space: "O(h) recursion stack",
    },
    levelorder: {
      name: "Level Order (BFS)", short: "Visit nodes level by level, left to right, using a queue.",
      explain: ["Put the root in a queue.", "Dequeue a node and visit it.", "Enqueue its left then right child.", "Repeat until the queue is empty."],
      code: ["function levelOrder(root):", "    queue = [root]", "    while queue not empty:", "        node = queue.dequeue()", "        visit(node)", "        enqueue(node.left, node.right)"],
      visitLine: 4, time: "O(n)", space: "O(w) queue, w = widest level",
    },
    dfs: {
      name: "Depth-First Search (DFS)", short: "Iterative DFS with an explicit stack. Convention: push right then left, so it visits in the same order as preorder — but without recursion.",
      explain: ["Push the root onto a stack.", "Pop a node and visit it.", "Push its right child, then its left child.", "Repeat until the stack is empty."],
      code: ["function dfs(root):", "    stack = [root]", "    while stack not empty:", "        node = stack.pop()", "        visit(node)", "        push(node.right); push(node.left)"],
      visitLine: 4, time: "O(n)", space: "O(h) explicit stack",
    },
  },
  general: {
    preorder: {
      name: "Preorder Traversal", short: "Visit the node first, then each child subtree from left to right.",
      explain: ["Visit the current node.", "Recursively traverse each child, left to right."],
      code: ["function preorder(node):", "    if node is null: return", "    visit(node)", "    for child in node.children:", "        preorder(child)"],
      visitLine: 2, time: "O(n)", space: "O(h) recursion stack",
    },
    postorder: {
      name: "Postorder Traversal", short: "Traverse every child subtree left to right, then visit the node.",
      explain: ["Recursively traverse each child, left to right.", "Visit the current node last."],
      code: ["function postorder(node):", "    if node is null: return", "    for child in node.children:", "        postorder(child)", "    visit(node)"],
      visitLine: 4, time: "O(n)", space: "O(h) recursion stack",
    },
    levelorder: {
      name: "Level Order (BFS)", short: "Visit nodes level by level, left to right, using a queue.",
      explain: ["Put the root in a queue.", "Dequeue a node and visit it.", "Enqueue all its children, left to right.", "Repeat until the queue is empty."],
      code: ["function levelOrder(root):", "    queue = [root]", "    while queue not empty:", "        node = queue.dequeue()", "        visit(node)", "        for child in node.children: enqueue(child)"],
      visitLine: 4, time: "O(n)", space: "O(w) queue, w = widest level",
    },
    dfs: {
      name: "Depth-First Search (DFS)", short: "Iterative DFS with an explicit stack. Convention: children are pushed in reverse, so the leftmost child is explored first — same order as preorder, without recursion.",
      explain: ["Push the root onto a stack.", "Pop a node and visit it.", "Push its children in reverse order (rightmost first).", "Repeat until the stack is empty."],
      code: ["function dfs(root):", "    stack = [root]", "    while stack not empty:", "        node = stack.pop()", "        visit(node)", "        push children right-to-left"],
      visitLine: 4, time: "O(n)", space: "O(n) worst — stack holds pending siblings",
    },
  },
};

export const algorithmsFor = (mode: Mode) => Object.keys(ALGORITHMS[mode]) as Algorithm[];

export function traverse(root: RNode | null, algo: Algorithm, mode: Mode): Step[] {
  const meta = ALGORITHMS[mode][algo];
  if (!root || !meta) return [];
  const line = meta.visitLine;
  const out: Step[] = [];
  const visit = (n: RNode, note: string) => out.push({ id: n.id, label: n.label, line, note });
  const desc = (n: RNode) => { const k = kidsOf(n).length; return k ? `${k} child${k > 1 ? "ren" : ""}` : "a leaf"; };

  if (algo === "levelorder") {
    const q: { n: RNode; d: number }[] = [{ n: root, d: 0 }];
    while (q.length) {
      const { n, d } = q.shift()!;
      const ks = kidsOf(n);
      visit(n, `Dequeue ${n.label} (level ${d}) and visit it; enqueue ${ks.length ? ks.map((k) => k.label).join(", ") : "nothing"}.`);
      ks.forEach((k) => q.push({ n: k, d: d + 1 }));
    }
  } else if (algo === "dfs") {
    const stack: RNode[] = [root];
    while (stack.length) {
      const n = stack.pop()!;
      const ks = kidsOf(n);
      visit(n, `Pop ${n.label} and visit it; push ${ks.length ? [...ks].reverse().map((k) => k.label).join(", ") : "nothing"} onto the stack.`);
      for (let i = ks.length - 1; i >= 0; i--) stack.push(ks[i]!);
    }
  } else {
    const rec = (n: RNode | null) => {
      if (!n) return;
      if (algo === "preorder") visit(n, `Visit ${n.label} before its subtrees (${desc(n)}).`);
      if (algo === "inorder") {
        rec(n.kids[0] ?? null);
        visit(n, n.kids[0] ? `Left subtree of ${n.label} done — visit ${n.label}.` : `${n.label} has no left child — visit it.`);
        rec(n.kids[1] ?? null);
      } else kidsOf(n).forEach(rec);
      if (algo === "postorder") visit(n, kidsOf(n).length ? `All subtrees of ${n.label} done — visit ${n.label}.` : `${n.label} is a leaf — visit it.`);
    };
    rec(root);
  }
  return out;
}

/** Height counts edges: single node = 0, empty tree = -1. */
export function treeStats(root: RNode | null) {
  let count = 0, leaves = 0, maxChildren = 0;
  const h = (n: RNode): number => {
    count++;
    const ks = kidsOf(n);
    maxChildren = Math.max(maxChildren, ks.length);
    if (!ks.length) { leaves++; return 0; }
    return 1 + Math.max(...ks.map(h));
  };
  const height = root ? h(root) : -1;
  return { count, leaves, height, maxChildren, root: root?.label ?? null, empty: !root };
}
