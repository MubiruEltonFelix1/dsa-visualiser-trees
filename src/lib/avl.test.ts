import { describe, expect, it } from "vitest";
import { buildFrom, randomValues } from "./bst";
import { avlBuild, avlDelete, avlInsert, balanceBST, balanceFactor, find, inorder, isAVL, loadRaw, manualRotate, nodeInfo } from "./avl";

const rots = (vals: number[]) => avlBuild(vals, null, true).rotations.map((r) => `${r.dir}@${r.pivot}`);
const shape = (vals: number[]) => {
  const t = avlBuild(vals, null, true).after!;
  return `${t.value}(${t.left?.value},${t.right?.value})`;
};

describe("AVL rotation cases", () => {
  it("LL → right rotation", () => { expect(rots([30, 20, 10])).toEqual(["right@30"]); expect(shape([30, 20, 10])).toBe("20(10,30)"); });
  it("RR → left rotation", () => { expect(rots([10, 20, 30])).toEqual(["left@10"]); expect(shape([10, 20, 30])).toBe("20(10,30)"); });
  it("LR → left then right", () => { expect(rots([30, 10, 20])).toEqual(["left@10", "right@30"]); expect(shape([30, 10, 20])).toBe("20(10,30)"); });
  it("RL → right then left", () => { expect(rots([10, 30, 20])).toEqual(["right@30", "left@10"]); expect(shape([10, 30, 20])).toBe("20(10,30)"); });
  it("double rotation records the intermediate tree", () => {
    const op = avlBuild([30, 10, 20], null, true);
    const mid = op.frames.find((f) => f.title.startsWith("Intermediate"))!;
    expect(mid.tree!.value).toBe(30);
    expect(mid.tree!.left!.value).toBe(20);
    expect(mid.tree!.left!.left!.value).toBe(10);
  });
  it("frames are independent snapshots (Previous Step history)", () => {
    const op = avlBuild([30, 20, 10], null, true);
    const unbalanced = op.frames.find((f) => f.title.includes("unbalanced"))!;
    expect(unbalanced.tree!.value).toBe(30);
    expect(op.after!.value).toBe(20);
  });
});

describe("AVL insert/delete", () => {
  it("insertion keeps BST order and AVL on every node", () => {
    const vals = randomValues(200);
    const t = avlBuild(vals, null, false).after;
    expect(inorder(t)).toEqual([...vals].sort((a, b) => a - b));
    expect(isAVL(t)).toBe(true);
    expect(nodeInfo(t).every((i) => Math.abs(i.bf) <= 1)).toBe(true);
  });
  it("duplicates ignored", () => expect(inorder(avlInsert(avlBuild([5, 3], null, false).after, 5).after)).toEqual([3, 5]));
  it("deletion rebalances (leaf, one child, two children)", () => {
    let t = avlBuild([50, 30, 70, 20, 40, 60, 80, 10, 25, 35, 45, 5], null, false).after;
    for (const v of [80, 60, 70, 30, 50]) {
      const op = avlDelete(t, v);
      expect(op.error).toBeUndefined();
      t = op.after;
      expect(isAVL(t)).toBe(true);
      expect(find(t, v)).toBeNull();
    }
  });
  it("deleting missing value errors safely", () => expect(avlDelete(null, 3).error).toBeTruthy());
  it("balance factors update after rotation", () => {
    const t = avlBuild([10, 20, 30], null, true).after!;
    expect([balanceFactor(t), balanceFactor(t.left!), balanceFactor(t.right!)]).toEqual([0, 0, 0]);
  });
});

describe("Manual rotation & Balance This BST", () => {
  it("manual rotation preserves order", () => {
    const t = buildFrom([50, 30, 70, 20, 40]).root;
    const op = manualRotate(t, 50, "right");
    expect(op.after!.value).toBe(30);
    expect(inorder(op.after)).toEqual(inorder(t));
  });
  it("invalid manual rotation is refused", () => {
    const t = buildFrom([50, 70]).root;
    const op = manualRotate(t, 50, "right");
    expect(op.error).toMatch(/no left child/);
    expect(op.after).toBe(t);
  });
  it("balances a deeply skewed BST with many rotations", () => {
    const vals = Array.from({ length: 120 }, (_, i) => i + 1);
    const t = buildFrom(vals).root;
    const op = balanceBST(t);
    expect(op.error).toBeUndefined();
    expect(isAVL(op.after)).toBe(true);
    expect(inorder(op.after)).toEqual(vals);
    expect(op.rotations.length).toBeGreaterThan(1);
  });
  it("balances random BSTs preserving all values", () => {
    for (let k = 0; k < 30; k++) {
      const t = buildFrom(randomValues(60)).root;
      const op = balanceBST(t);
      expect(op.error).toBeUndefined();
      expect(isAVL(op.after)).toBe(true);
      expect(inorder(op.after)).toEqual(inorder(t));
    }
  });
  it("already balanced → no rotations; empty is safe", () => {
    expect(balanceBST(loadRaw([40, 20, 60], "x").after).rotations).toHaveLength(0);
    expect(balanceBST(null).error).toBeUndefined();
  });
});
