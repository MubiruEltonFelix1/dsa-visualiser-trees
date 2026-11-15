import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart2, BookOpen, LayoutList, Sliders, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

          <div className="flex flex-col lg:flex-row gap-4 min-h-[640px]">
            {/* Side navigation */}
            <nav className="flex-none lg:w-64 flex flex-col gap-1 rounded-xl border bg-card p-3 shadow">
              <div className="px-2 py-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Sections
                </h3>
              </div>
              <div className="flex flex-col gap-1">
                {sections.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSelected(s.value)}
                    aria-current={selected === s.value ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md border-transparent px-3 py-2 text-sm font-medium text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selected === s.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    {s.icon && <s.icon className="size-4 shrink-0" />}
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0 border border-border rounded-xl bg-card p-4 shadow">
              {selected === "overview" && <Overview />}
              {selected === "terms" && <TermExplorer />}
              {selected === "comparators" && <ComparatorPlayground />}
              {selected === "binary-search" && <BinarySearchVisualizer />}
              {selected === "prefix-range" && <PrefixRangeFinder />}
              {selected === "autocomplete" && <AutocompleteSimulator />}
              {selected === "complexity" && <ComplexityLab />}
              {selected === "practice" && <PracticeCheckpoints />}
              {selected === "advanced" && <AdvancedExtension terms={DEFAULT_TERMS} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
