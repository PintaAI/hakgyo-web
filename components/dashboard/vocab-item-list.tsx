"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus, Trash2 } from "lucide-react";
import { BsStars } from "react-icons/bs";
import { VocabularyType } from "@/lib/prisma-types";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VocabItem {
  id?: number | string;
  korean: string;
  indonesian: string;
  type: VocabularyType;
  pos?: string;
  audioUrl?: string;
  exampleSentences: string[];
}

interface VocabItemListProps {
  items: VocabItem[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
  onQuickAdd: (korean: string, indonesian: string) => void;
  onGenerate?: () => Promise<void>;
  generating: boolean;
  title: string;
}

export function VocabItemList({ items, onEdit, onDelete, onAdd, onQuickAdd, onGenerate, generating, title }: VocabItemListProps) {
  const [quickKorean, setQuickKorean] = useState("");
  const [quickIndonesian, setQuickIndonesian] = useState("");
  const koreanRef = useRef<HTMLInputElement>(null);

  const handleQuickAdd = () => {
    if (!quickKorean.trim() || !quickIndonesian.trim()) return;
    onQuickAdd(quickKorean.trim(), quickIndonesian.trim());
    setQuickKorean("");
    setQuickIndonesian("");
    koreanRef.current?.focus();
  };

  const columns: ColumnDef<VocabItem>[] = [
    {
      id: "number",
      header: "#",
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "korean",
      header: "Korea",
    },
    {
      accessorKey: "indonesian",
      header: "Indonesia",
    },
    {
      accessorKey: "type",
      header: "Tipe",
      cell: ({ row }) => {
        const type = row.original.type;
        let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
        let className = "text-xs";

        switch (type) {
          case "WORD":
            variant = "default";
            className += " bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
            break;
          case "SENTENCE":
            variant = "secondary";
            className += " bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            break;
          case "IDIOM":
            variant = "outline";
            className += " bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700";
            break;
          default:
            variant = "secondary";
        }

        return (
          <Badge variant={variant} className={className}>
            {type.toLowerCase()}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Tindakan",
      cell: ({ row }) => {
        const index = row.index;
        return (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(index)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Item Kosakata</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={onGenerate}
            disabled={generating || !title.trim()}
            variant="outline"
            size="sm"
          >
            {generating ? "Membuat..." : (<><BsStars className="h-4 w-4 mr-2" />Buat dengan AI</>)}
          </Button>
          <Button type="button" onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Item
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          ref={koreanRef}
          placeholder="Korea"
          value={quickKorean}
          onChange={(e) => setQuickKorean(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleQuickAdd();
            }
          }}
          className="flex-1"
        />
        <Input
          placeholder="Indonesia"
          value={quickIndonesian}
          onChange={(e) => setQuickIndonesian(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleQuickAdd();
            }
          }}
          className="flex-1"
        />
        <Button onClick={handleQuickAdd} disabled={!quickKorean.trim() || !quickIndonesian.trim()}>
          Tambah
        </Button>
      </div>

      <div className="h-[calc(100vh-650px)] overflow-auto rounded-xl border">
        <Table>
          <TableHeader className="bg-primary/90">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={`text-primary-foreground ${header.id === "number" ? "w-12 text-center" : header.id === "actions" ? "w-24" : ""}`}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={row.index % 2 === 0 ? "bg-accent" : ""}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.id === "number" ? "text-center" : ""}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Belum ada item kosakata. Klik Tambah Item untuk memulai.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
