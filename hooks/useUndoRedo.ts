import { useState, useCallback, useEffect } from "react";

export function useUndoRedo<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState(0);

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory(prevHistory => {
      const currentState = prevHistory[index];
      const resolvedState = typeof newState === "function" ? (newState as Function)(currentState) : newState;
      
      if (resolvedState === currentState) {
          return prevHistory;
      }
      
      const newHistory = prevHistory.slice(0, index + 1);
      newHistory.push(resolvedState);
      // Keep only last 50 states to avoid memory bloat
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      setIndex(newHistory.length - 1);
      return newHistory;
    });
    // If we shifted the array, index remains the same but points to the new end.
  }, [index]);

  const undo = useCallback(() => {
    setIndex(prev => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setHistory(prevHistory => {
        setIndex(prev => Math.min(prevHistory.length - 1, prev + 1));
        return prevHistory;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const reset = useCallback((newState: T = initialState) => {
    setHistory([newState]);
    setIndex(0);
  }, [initialState]);

  return [history[index], setState, undo, redo, index > 0, index < history.length - 1, reset] as const;
}
