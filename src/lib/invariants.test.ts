import { describe, expect, it } from 'vitest';
import { generalInvariants, binaryInvariants, twoThreeInvariants, redBlackInvariants, type Invariant } from './invariants';
import { makeG, type GNode } from './general';
import { buildFrom, type TreeNode } from './bst';
import { height, avlBuild } from './avl';
import { insert23, type TwoThreeNode } from './two-three';
import { insertRB, type RBNode } from './red-black';

const result = (checks: Invariant[], name: string) => checks.find(c => c.name === name)?.status;
const binary = (value: number, left: TreeNode | null = null, right: TreeNode | null = null): TreeNode => ({ id: value, value, left, right });
describe('Read-only invariant rules', () => {
  it.each(['Exactly one root', 'Root has no parent', 'No cycles'])('%s rejects a root cycle', name => {
    const root = makeG('A'); root.children.push(root);
    expect(result(generalInvariants(root), name)).toBe('Violated');
  });
  it('One parent per node rejects a shared child', () => {
    const child = makeG('C'); const root = makeG('A', [makeG('B', [child]), child]);
    expect(result(generalInvariants(root), 'One parent per node')).toBe('Violated');
  });
  it('Connected tree checks all nodes in the root-owned model', () => {
    const root = makeG('A', [makeG('B'), makeG('C')]);
    expect(result(generalInvariants(root), 'Connected tree')).toBe('Satisfied');
    root.children.push(root);
    expect(result(generalInvariants(root), 'Connected tree')).toBe('Not Checked');
  });
  it('Left-subtree keys smaller checks descendant bounds', () => {
    expect(result(binaryInvariants(binary(10, binary(5, null, binary(12)))), 'Left-subtree keys smaller')).toBe('Violated');
  });
  it('Right-subtree keys greater checks descendant bounds', () => {
    expect(result(binaryInvariants(binary(10, null, binary(15, binary(8)))), 'Right-subtree keys greater')).toBe('Violated');
  });
  it('BST ordering rejects duplicate keys', () => {
    // Distinct IDs so the structure is safe; the duplicate VALUE is what the rule must catch.
    expect(result(binaryInvariants({ ...binary(10), left: { ...binary(10), id: 11 } }), 'BST ordering')).toBe('Violated');
  });
  it('Valid tree structure rejects repeated node IDs', () => {
    expect(result(binaryInvariants(binary(10, binary(5), { ...binary(15), id: 5 })), 'Valid tree structure')).toBe('Violated');
  });
  it.each(['Balance factors −1, 0, +1', 'Every subtree balanced'])('%s checks descendants', name => {
    expect(result(binaryInvariants(binary(30, binary(20, binary(10))), true), name)).toBe('Violated');
  });
  it('Correct node heights compares against fresh edge counts', () => {
    const root = binary(10); height(root); root.left = binary(5);
    expect(result(binaryInvariants(root, true), 'Correct node heights')).toBe('Violated');
  });
  const n23 = (id: number, keys: number[], children: TwoThreeNode[] = []): TwoThreeNode => ({ id, keys, children });
  it('One or two sorted keys rejects unsorted and overflow nodes', () => {
    expect(result(twoThreeInvariants(n23(1, [2, 1])), 'One or two sorted keys')).toBe('Violated');
    expect(result(twoThreeInvariants(n23(1, [1, 2, 3])), 'One or two sorted keys')).toBe('Violated');
  });
  it('2-node: two children checks internal child count', () => {
    expect(result(twoThreeInvariants(n23(1, [10], [n23(2, [5])])), '2-node: two children')).toBe('Violated');
  });
  it('3-node: three children checks internal child count', () => {
    expect(result(twoThreeInvariants(n23(1, [10, 20], [n23(2, [5]), n23(3, [15])])), '3-node: three children')).toBe('Violated');
  });
  it('Equal leaf depth rejects different depths', () => {
    const root = n23(1, [10], [n23(2, [5]), n23(3, [20], [n23(4, [15]), n23(5, [25])])]);
    expect(result(twoThreeInvariants(root), 'Equal leaf depth')).toBe('Violated');
  });
  it('Ordered child ranges rejects a misplaced child key', () => {
    expect(result(twoThreeInvariants(n23(1, [10], [n23(2, [12]), n23(3, [20])])), 'Ordered child ranges')).toBe('Violated');
  });
  const rb = (key: number, color: RBNode['color'] = 'BLACK'): RBNode => ({ id: key, key, color, left: null, right: null, parent: null });
  it('Red or black nodes rejects another color', () => {
    const root = rb(10); Object.assign(root, { color: 'GREEN' });
    expect(result(redBlackInvariants(root), 'Red or black nodes')).toBe('Violated');
  });
  it('Black root rejects a red root', () => {
    expect(result(redBlackInvariants(rb(10, 'RED')), 'Black root')).toBe('Violated');
  });
  it('Black NIL leaves checks the exported null leaf convention', () => {
    expect(result(redBlackInvariants(rb(10)), 'Black NIL leaves')).toBe('Satisfied');
    const root = rb(10); root.left = rb(0, 'RED'); root.left.parent = root;
    expect(result(redBlackInvariants(root), 'Black NIL leaves')).toBe('Violated');
  });
  it('No red-red edge rejects consecutive red nodes', () => {
    const root = rb(10, 'RED'); root.left = rb(5, 'RED'); root.left.parent = root;
    expect(result(redBlackInvariants(root), 'No red-red edge')).toBe('Violated');
  });
  it('Equal black height counts paths to NIL', () => {
    const root = rb(10); root.left = rb(5); root.left.parent = root;
    expect(result(redBlackInvariants(root), 'Equal black height')).toBe('Violated');
  });
  it('Red-Black BST ordering checks ancestor ranges', () => {
    const root = rb(10); root.left = rb(15); root.left.parent = root;
    expect(result(redBlackInvariants(root), 'BST ordering')).toBe('Violated');
  });
  it('Red-Black structure checks stored parent pointers', () => {
    const root = rb(10); root.left = rb(5);
    expect(result(redBlackInvariants(root), 'Valid tree structure')).toBe('Violated');
  });
  it('Valid models pass without mutation and empty models are not checked', () => {
    const general: GNode = makeG('A', [makeG('B'), makeG('C')]);
    const bst = buildFrom([10, 5, 15]).root;
    const avl = avlBuild([30, 10, 20], null, false).after;
    const twoThree = insert23(null, [10, 20, 30, 40]).after;
    const redBlack = insertRB(null, [10, 20, 30, 40]).after;
    const before = JSON.stringify([general, bst, avl, twoThree]);
    for (const checks of [generalInvariants(general), binaryInvariants(bst), binaryInvariants(avl, true), twoThreeInvariants(twoThree), redBlackInvariants(redBlack)]) expect(checks.every(c => c.status === 'Satisfied')).toBe(true);
    expect(JSON.stringify([general, bst, avl, twoThree])).toBe(before);
    for (const checks of [generalInvariants(null), binaryInvariants(null), binaryInvariants(null, true), twoThreeInvariants(null), redBlackInvariants(null)]) expect(checks.every(c => c.status === 'Not Checked')).toBe(true);
  });
  it('Repair snapshots show violations rather than the final valid tree', () => {
    const op = insertRB(null, [30, 10, 20]);
    expect(op.frames.some(f => redBlackInvariants(f.tree).some(c => c.status === 'Violated'))).toBe(true);
    expect(redBlackInvariants(op.after).every(c => c.status === 'Satisfied')).toBe(true);
  });
});