import { createContext, useContext, useEffect, useState } from "react";
import { pageCopy } from "../content/pageCopy.js";

export const PageCopyContext = createContext(null);

export function usePageCopy(page) {
  const previewPages = useContext(PageCopyContext);
  const [published, setPublished] = useState(null);
  useEffect(() => {
    if (previewPages !== null) return;
    const request = new AbortController();
    fetch("/api/inicio", { signal: request.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((home) => { if (home?.pages) setPublished(home.pages); })
      .catch(() => {});
    return () => request.abort();
  }, [previewPages]);
  return (previewPages ?? published)?.[page] ?? pageCopy[page];
}
