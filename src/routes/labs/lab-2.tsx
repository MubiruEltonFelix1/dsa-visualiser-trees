import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart2, BookOpen, LayoutList, Sliders, TrendingUp, Zap } from "lucide-react";
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
import { Navbar } from "@/components/lab2/Navbar";

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
        <Navbar
          extraActions={
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Back to home
            </Link>
          }
        />

      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border bg-panel p-5 shadow">
            <h2 className="text-xl font-semibold tracking-tight">Lab 2: Autocomplete</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Learn how weighted terms, sorting, comparators, binary search and prefix ranges work
              together to power autocomplete systems.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-0 border border-border rounded-xl bg-background/40 shadow">
            <Tabs value={selected} onValueChange={setSelected} className="flex w-full flex-col lg:flex-row gap-0">
              <aside className="flex-none lg:w-64 border-b lg:border-b-0 lg:border-r border-border bg-secondary/40 p-1">
                <TabsList className="flex flex-col gap-0.5">
                  {sections.map((s) => (
                    <TabsTrigger
                      key={s.value}
                      value={selected}
                      className="flex w-full items-center gap-2 rounded-md border-transparent px-2 py-2 text-sm font-medium text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      {s.icon && <s.icon className="size-4 shrink-0" />}
                      <span className="truncate">{s.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </aside>

              <div className="flex-1 min-w-0 border-t lg:border-t-0 border-l lg:border-l-0 border-border p-4">
                {sections.map((s) => (
                  <TabsContent key={s.value} value={s.value} className="mt-0">
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
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
