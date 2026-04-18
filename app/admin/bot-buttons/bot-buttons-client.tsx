"use client";

import * as React from "react";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type BotButtonRow = {
  id: string;
  state: string;
  label: string;
  action: string | null;
  row: number;
  col: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type StatesResponse = {
  states: string[];
};

type PreviewResponse = {
  state: string;
  grid: string[][];
  editable: boolean;
  buttons: BotButtonRow[];
};

const hasAnyButtons = (grid: string[][]) =>
  Array.isArray(grid) &&
  grid.some(
    (row) =>
      Array.isArray(row) &&
      row.some((c) => typeof c === "string" && c.trim().length > 0),
  );

const toEditableOrder = (buttons: BotButtonRow[]) =>
  buttons
    .slice()
    .sort((a, b) => a.row - b.row || a.col - b.col)
    .map((b) => ({ ...b }));

const applyGridPositions = (buttons: BotButtonRow[]) =>
  buttons.map((b, index) => ({
    ...b,
    row: Math.floor(index / 2),
    col: index % 2,
  }));

function KeyboardPreview({ grid }: { grid: string[][] }) {
  if (!hasAnyButtons(grid)) {
    return (
      <p className="text-sm text-muted-foreground">
        No buttons for this state.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-2 gap-2">
          {row.map((label, colIndex) => (
            <div
              key={colIndex}
              className={cn(
                "rounded-lg border bg-background px-3 py-2 text-sm",
                row.length === 1 ? "col-span-2" : "col-span-1",
              )}
            >
              {label}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SortableButton({
  id,
  label,
  selected,
  spanTwo,
  onSelect,
}: {
  id: string;
  label: string;
  selected: boolean;
  spanTwo: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border bg-background px-3 py-2 text-sm text-left",
        "cursor-grab active:cursor-grabbing",
        spanTwo ? "col-span-2" : "col-span-1",
        selected
          ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
          : null,
        isDragging ? "opacity-70" : null,
      )}
      {...attributes}
      {...listeners}
    >
      {label}
    </button>
  );
}

export function BotButtonsClient() {
  const [states, setStates] = React.useState<string[]>([]);
  const [state, setState] = React.useState<string | null>(null);

  const [loadingStates, setLoadingStates] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [grid, setGrid] = React.useState<string[][]>([]);
  const [editable, setEditable] = React.useState(false);
  const [buttons, setButtons] = React.useState<BotButtonRow[]>([]);

  const [editOpen, setEditOpen] = React.useState(false);
  const [draftButtons, setDraftButtons] = React.useState<BotButtonRow[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const loadStates = React.useCallback(async () => {
    setLoadingStates(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/bot-buttons/states", {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as unknown;

      if (!res.ok) {
        const messageValue =
          data && typeof data === "object"
            ? (data as { message?: unknown }).message
            : undefined;
        throw new Error(
          typeof messageValue === "string" && messageValue.trim().length > 0
            ? messageValue
            : "Failed to load states",
        );
      }

      const statesValue =
        data && typeof data === "object" ? (data as any).states : undefined;
      const list = Array.isArray(statesValue)
        ? (statesValue as StatesResponse["states"])
        : [];

      setStates(list);
      if (list.length > 0) {
        setState((prev) => {
          if (typeof prev === "string" && list.includes(prev)) return prev;
          return list[0]!;
        });
      }
    } catch (e) {
      setStates([]);
      setState(null);
      setError(e instanceof Error ? e.message : "Failed to load states");
    } finally {
      setLoadingStates(false);
    }
  }, []);

  const loadPreview = React.useCallback(async (s: string) => {
    if (!s) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/bot-buttons/preview?state=${encodeURIComponent(s)}`,
        { cache: "no-store" },
      );
      const data = (await res.json().catch(() => null)) as unknown;

      if (!res.ok) {
        const messageValue =
          data && typeof data === "object"
            ? (data as { message?: unknown }).message
            : undefined;
        throw new Error(
          typeof messageValue === "string" && messageValue.trim().length > 0
            ? messageValue
            : "Failed to load preview",
        );
      }

      const payload = (
        data && typeof data === "object" ? data : null
      ) as PreviewResponse | null;

      setGrid(Array.isArray(payload?.grid) ? payload!.grid : []);
      setEditable(!!payload?.editable);
      setButtons(Array.isArray(payload?.buttons) ? payload!.buttons : []);
    } catch (e) {
      setGrid([]);
      setEditable(false);
      setButtons([]);
      setError(e instanceof Error ? e.message : "Failed to load preview");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadStates();
  }, [loadStates]);

  React.useEffect(() => {
    if (!state) return;
    void loadPreview(state);
  }, [loadPreview, state]);

  const openEdit = () => {
    setEditError(null);
    const ordered = toEditableOrder(buttons);
    setDraftButtons(ordered);
    setSelectedId(ordered[0]?.id ?? null);
    setEditOpen(true);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    setDraftButtons((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === active.id);
      const newIndex = prev.findIndex((b) => b.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const selected = React.useMemo(() => {
    return selectedId
      ? (draftButtons.find((b) => b.id === selectedId) ?? null)
      : null;
  }, [draftButtons, selectedId]);

  const updateSelectedLabel = (next: string) => {
    if (!selectedId) return;
    setDraftButtons((prev) =>
      prev.map((b) => (b.id === selectedId ? { ...b, label: next } : b)),
    );
  };

  const onSave = async () => {
    setEditError(null);

    const trimmedInvalid = draftButtons.some(
      (b) => typeof b.label !== "string" || b.label.trim().length === 0,
    );
    if (trimmedInvalid) {
      setEditError("Button text cannot be empty");
      return;
    }

    const positioned = applyGridPositions(draftButtons).map((b) => ({
      ...b,
      label: b.label.trim(),
    }));

    const originalById = new Map(buttons.map((b) => [b.id, b] as const));
    const updates = positioned.filter((b) => {
      const orig = originalById.get(b.id);
      if (!orig) return true;
      return orig.label !== b.label || orig.row !== b.row || orig.col !== b.col;
    });

    if (updates.length === 0) {
      setEditOpen(false);
      return;
    }

    setSaving(true);

    try {
      const putUpdate = async (
        id: string,
        body: { label?: string; row?: number; col?: number },
      ) => {
        const res = await fetch(
          `/api/admin/bot-buttons/${encodeURIComponent(id)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );

        const data = (await res.json().catch(() => null)) as unknown;
        if (!res.ok) {
          const messageValue =
            data && typeof data === "object"
              ? (data as { message?: unknown }).message
              : undefined;
          throw new Error(
            typeof messageValue === "string" && messageValue.trim().length > 0
              ? messageValue
              : "Failed to save",
          );
        }
      };

      // Avoid intermediate (state,row,col) collisions during swaps by moving
      // all position-changed buttons to temporary unique rows first.
      const positionChanged = updates.filter((u) => {
        const orig = originalById.get(u.id);
        if (!orig) return true;
        return orig.row !== u.row || orig.col !== u.col;
      });

      if (positionChanged.length > 0) {
        const maxRow = buttons.reduce(
          (acc, b) => (typeof b.row === "number" ? Math.max(acc, b.row) : acc),
          0,
        );
        const tempBaseRow = maxRow + 1000;

        for (let i = 0; i < positionChanged.length; i += 1) {
          const u = positionChanged[i]!;
          await putUpdate(u.id, { row: tempBaseRow + i + 1, col: 0 });
        }
      }

      for (const u of updates) {
        await putUpdate(u.id, { label: u.label, row: u.row, col: u.col });
      }

      setEditOpen(false);
      if (state) await loadPreview(state);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>State</CardTitle>
          <CardDescription>
            Select a state to preview the keyboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <Label htmlFor="state">State</Label>
            <Select value={state ?? ""} onValueChange={(v) => setState(v)}>
              <SelectTrigger
                id="state"
                disabled={loadingStates || states.length === 0}
              >
                <SelectValue
                  placeholder={loadingStates ? "Loading..." : "Select state"}
                />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle>Grid preview</CardTitle>
              <CardDescription>
                This is exactly what users see in the bot
              </CardDescription>
            </div>

            {editable ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openEdit}
                disabled={loading || buttons.length === 0}
              >
                Edit
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <KeyboardPreview grid={grid} />
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit buttons</DialogTitle>
            <DialogDescription>
              Drag & drop to change order. Click a button to edit its text.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 p-4 pt-0">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={draftButtons.map((b) => b.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 gap-2">
                  {draftButtons.map((b, index) => (
                    <SortableButton
                      key={b.id}
                      id={b.id}
                      label={b.label}
                      selected={b.id === selectedId}
                      spanTwo={
                        draftButtons.length % 2 === 1 &&
                        index === draftButtons.length - 1
                      }
                      onSelect={() => setSelectedId(b.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="grid gap-2">
              <Label htmlFor="edit-label">Button text</Label>
              <Input
                id="edit-label"
                value={selected?.label ?? ""}
                onChange={(e) => updateSelectedLabel(e.target.value)}
                placeholder={selected ? "Enter text" : "Select a button"}
                disabled={!selected}
              />
            </div>

            {editError ? (
              <p className="text-sm text-destructive">{editError}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
