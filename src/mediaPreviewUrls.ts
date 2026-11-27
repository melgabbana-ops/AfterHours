export interface MediaPreviewUrlApi {
  createObjectURL(source: Blob | MediaSource): string;
  revokeObjectURL(url: string): void;
}

/** Track local preview URLs so replacements, background locks and unmounts release them exactly once. */
export function createMediaPreviewUrlRegistry(api: MediaPreviewUrlApi = URL) {
  const activeUrls = new Set<string>();

  return {
    create(source: Blob | MediaSource): string {
      const url = api.createObjectURL(source);
      activeUrls.add(url);
      return url;
    },

    revoke(url?: string | null): boolean {
      if (!url || !activeUrls.has(url)) return false;
      try {
        api.revokeObjectURL(url);
        activeUrls.delete(url);
        return true;
      } catch {
        // Keep failed releases registered so a later background/unmount cleanup can retry.
        return false;
      }
    },

    revokeAll(): void {
      for (const url of [...activeUrls]) this.revoke(url);
    },

    size(): number {
      return activeUrls.size;
    },
  };
}
