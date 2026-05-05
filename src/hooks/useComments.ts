import { useState, useCallback } from "react";
import {
  Comment,
  CURRENT_USER,
  CURRENT_USER_AVATAR,
  EDIT_WINDOW_MS,
} from "@/data/mockComments";

export function useComments<T extends Comment>(initial: T[]) {
  const [comments, setComments] = useState<T[]>(initial);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const canEdit = useCallback(
    (c: Comment) =>
      c.username === CURRENT_USER &&
      !!c.createdAt &&
      Date.now() - (c.createdAt ?? 0) < EDIT_WINDOW_MS,
    []
  );

  const startEdit = useCallback((c: Comment) => {
    setEditingId(c.id);
    setEditText(c.text);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText("");
  }, []);

  const saveEdit = useCallback(
    (id: number) => {
      const trimmed = editText.trim();
      if (!trimmed) return;
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, text: trimmed, edited: true } : c))
      );
      setEditingId(null);
      setEditText("");
    },
    [editText]
  );

  const addComment = useCallback(
    (text: string, extras?: Partial<T>) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const c = {
        id: Date.now(),
        username: CURRENT_USER,
        avatar: CURRENT_USER_AVATAR,
        text: trimmed,
        time: "now",
        createdAt: Date.now(),
        ...(extras ?? {}),
      } as T;
      setComments((prev) => [c, ...prev]);
    },
    []
  );

  return {
    comments,
    setComments,
    editingId,
    editText,
    setEditText,
    canEdit,
    startEdit,
    cancelEdit,
    saveEdit,
    addComment,
  };
}
