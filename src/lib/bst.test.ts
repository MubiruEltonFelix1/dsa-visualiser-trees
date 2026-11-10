import { describe, expect, it } from "vitest";
import { bstToR, buildFrom, insert, minMax, remove } from "./bst";
import { addChild, fromJson, GENERAL_PRESETS, generalToR, makeG, removeSubtree, rename, validateStructure } from "./general";
import { layout } from "./layout";
import { traverse, treeStats, type Algorithm } from "./traversal";

const bst = () => buildFrom([50, 30, 70, 20, 40, 60, 80]).root;
const bv = (a: Algorithm, r = bst()) => traverse(bstToR(r), a, "bst").map((s) => s.label).join(",");
const sample = () => GENERAL_PRESETS[0]!.build();
const gv = (a: Algorithm, r = sample()) => traverse(generalToR(r), a, "general").map((s) => s.label).join("");

describe("BST", () => {
  it("inorder", () => expect(bv("inorder")).toBe("20,30,40,50,60,70,80"));
  it("preorder", () => expect(bv("preorder")).toBe("50,30,20,40,70,60,80"));
  it("postorder", () => expect(bv("postorder")).toBe("20,40,30,60,80,70,50"));
  it("levelorder", () => expect(bv("levelorder")).toBe("50,30,70,20,40,60,80"));
  it("dfs follows preorder convention", () => expect(bv("dfs")).toBe(bv("preorder")));
  it("ignores duplicates", () => {
    const r = buildFrom([5, 3, 5, 3]);
    expect(r.duplicates).toEqual([5, 3]);
    expect(treeStats(bstToR(r.root)).count).toBe(2);
  });
  it("delete leaf", () => expect(bv("inorder", remove(bst(), 20))).toBe("30,40,50,60,70,80"));
  it("delete one child", () => expect(bv("preorder", remove(remove(bst(), 20), 30))).toBe("50,40,70,60,80"));
  it("delete two children", () => {
    const r = remove(bst(), 50);
    expect(r?.value).toBe(60);
    expect(bv("inorder", r)).toBe("20,30,40,60,70,80");
  });
  it("insert keeps ordering", () => expect(bv("inorder", insert(bst(), 45))).toBe("20,30,40,45,50,60,70,80"));
  it("stats use edge height", () => {
    expect(treeStats(bstToR(bst()))).toMatchObject({ count: 7, leaves: 4, height: 2, maxChildren: 2, root: "50" });
    expect(minMax(bst())).toEqual({ min: 20, max: 80 });
    expect(treeStats(bstToR(buildFrom([1]).root)).height).toBe(0);
    expect(treeStats(null)).toMatchObject({ count: 0, height: -1, empty: true });
  });
  it("layout places left child left of parent", () => {
    const { nodes } = layout(bstToR(buildFrom([5, 9]).root), true);
    expect(nodes.find((n) => n.label === "9")!.x).toBeGreaterThan(nodes.find((n) => n.label === "5")!.x);
  });
});

describe("General tree", () => {
  it("preorder", () => expect(gv("preorder")).toBe("ABEFHICDG"));
  it("postorder", () => expect(gv("postorder")).toBe("EHIFBCGDA"));
  it("levelorder", () => expect(gv("levelorder")).toBe("ABCDEFGHI"));
  it("dfs", () => expect(gv("dfs")).toBe("ABEFHICDG"));
  it("no inorder offered", () => expect(gv("inorder")).toBe(""));
  it("supports many children", () => {
    let r = makeG("R");
    for (let i = 0; i < 7; i++) r = addChild(r, r.id, `c${i}`).root;
    expect(treeStats(generalToR(r)).maxChildren).toBe(7);
  });
  it("delete subtree and rename", () => {
    const t = sample();
    const b = t.children[0]!;
    const r = rename(removeSubtree(t, b.id)!, t.id, "Z");
    expect(gv("preorder", r)).toBe("ZCDG");
    expect(removeSubtree(t, t.id)).toBeNull();
  });
  it("detects shared parent / cycles", () => {
    const shared = makeG("X");
    expect(validateStructure(makeG("R", [shared, shared])).ok).toBe(false);
    expect(validateStructure(sample()).ok).toBe(true);
  });
  it("parses JSON and rejects bad input", () => {
    expect(gv("preorder", fromJson('{"label":"A","children":[{"label":1},{"label":"C"}]}').root!)).toBe("A1C");
    expect(fromJson("[1,2]").error).toBeTruthy();
    expect(fromJson('{"name":"A"}').error).toBeTruthy();
  });
});
