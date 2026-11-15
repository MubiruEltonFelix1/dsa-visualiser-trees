import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart2, BookOpen, Home, LayoutList, Sliders, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { absoluteUrl } from "@/lib/site";
import { DEFAULT_TERMS } from "@/lib/lab2";
import { AdvancedExtension } from "@/components/lab2/AdvancedExtension";
import { AutocompleteSimulator } from "@/components/lab2/AutocompleteSimulator";
import { BinarySearchVisualizer } from "@/components/lab2/BinarySearchVisualizer";
import { ComparatorPlayground } from "@/components/lab2/ComparatorPlayground";
import { ComplexityLab } from "@/components/lab2/ComplexityLab";
import { Overview } from "@/components/lab2/Overview";
import { PracticeCheckpoints } from "@/components/lab2/PracticeCheckpoints";
import { PrefixRangeFinder } from "@/components/lab2/PrefixRangeFinder";
import { TermExplorer } from "@/components/lab2/TermExplorer";

const sections = [
  { value: "overview", label: "Overview", icon: BookOpen },
  { value: "terms", label: "Term Explorer", icon: LayoutList },
  { value: "comparators", label: "Comparator Playground", icon: Sliders },
  { value: "binary-search", label: "Binary Search Visualizer", icon: Zap },
  { value: "prefix-range", label: "Prefix Range Finder", icon: TrendingUp },
  { value: "autocomplete", label: "Autocomplete Simulator", icon: Sliders },
  { value: "complexity", label: "Complexity Lab", icon: BarChart2 },
  { value: "practice", label: "Practice & Checkpoints", icon: LayoutList },
  { value: "advanced", label: "Advanced Extension", icon: Zap },
] as const;

export const Route = createFileRoute("/labs/lab-2")({
  head: () => ({
    meta: [
      { title: "Lab 2: Autocomplete — TreeViz" },
      {
        name: "description",
        content:
          "Learn how weighted terms, sorting, comparators, binary search and prefix ranges work together to power autocomplete systems.",
      },
      { property: "og:title", content: "Lab 2: Autocomplete — TreeViz" },
      { property: "og:description", content: "An interactive autocomplete laboratory inside TreeViz." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/labs/lab-2") },
      { property: "og:image", content: absoluteUrl("/og-image.png") },
      { property: "og:image:alt", content: "Lab 2: Autocomplete — TreeViz" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Lab 2: Autocomplete — TreeViz" },
      { name: "twitter:description", content: "An interactive autocomplete laboratory inside TreeViz." },
      { name: "twitter:image", content: absoluteUrl("/og-image.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/labs/lab-2") }],
  }),
  component: Lab2,
});

function Lab2() {
  const [selected, setSelected] = useState<string>("overview");

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg border bg-card p-2 text-primary"
              title="Return to TreeViz home"
            >
              <Home className="size-5" />
            </Link>
            <div>
              <h1 className="text-lg leading-tight font-bold">
                Tree<span className="text-primary">Viz</span>
              </h1>
              <p className="text-xs text-muted-foreground">Interactive Data Structure Laboratory</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border bg-panel p-5 shadow">
            <h2 className="text-xl font-semibold tracking-tight">Lab 2: Autocomplete</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Learn how weighted terms, sorting, comparators, binary search and prefix ranges work
              together to power autocomplete systems.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <aside className="flex-none lg:w-64 space-y-1">
              <TabsList className="flex flex-col gap-1">
                {sections.map((s) => (
                  <TabsTrigger
                    key={s.value}
                    value={selected}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-left"
                  >
                    {s.icon && <s.icon className="size-4" />}
                    {s.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </aside>

            <div className="flex-1 min-w-0">
              <Tabs value={selected} onValueChange={setSelected}>
                {sections.map((s) => (
                  <TabsContent key={s.value} value={s.value} className="mt-4">
                    {s.value === "overview" && <Overview />}
                    {s.value === "terms" && <TermExplorer />}
                    {s.value === "comparators" && <ComparatorPlayground />}
                    {s.value === "binary-search" && <BinarySearchVisualizer />}
                    {s.value === "prefix-range" && <PrefixRangeFinder />}
                    {s.value === "autocomplete" && <AutocompleteSimulator />}
                    {s.value === "complexity" && <ComplexityLab />}
                    {s.value === "practice" && <PracticeCheckpoints />}
                    {s.value === "advanced" && <AdvancedExtension terms={DEFAULT_TERMS} />}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
