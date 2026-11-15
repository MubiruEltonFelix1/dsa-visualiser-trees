"use client";

import { Link } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, TreePine } from "lucide-react";

interface NavbarProps {
  extraActions?: React.ReactNode;
}

export function Navbar({ extraActions }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur px-4 py-3">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="rounded-lg border bg-card p-2 text-primary">
            <TreePine className="size-5" />
          </div>
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Tree<span className="text-primary">Viz</span>
            </h1>
            <p className="text-xs text-muted-foreground">Interactive Data Structure Laboratory</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="hidden sm:inline-block">
                Labs
                <ChevronDown className="size-4 shrink-0 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[220px]">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Labs</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/labs/lab-2" className="w-full">
                    Lab 2: Autocomplete
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>Lab 1 — Coming soon</DropdownMenuItem>
                <DropdownMenuItem disabled>Lab 3 — Coming soon</DropdownMenuItem>
                <DropdownMenuItem disabled>Lab 4 — Coming soon</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {extraActions}
        </div>
      </div>
    </header>
  );
}
