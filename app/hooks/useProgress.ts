import { useEffect, useState } from "react";
import type { ProgressState } from "~/types/problem";
import { getProgress } from "~/utils/storage";

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>({});

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const refresh = () => {
    setProgress(getProgress());
  };

  return { progress, refresh };
}
