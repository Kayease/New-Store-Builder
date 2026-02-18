"use client";
import { TextField } from '@mui/material';
import { useStoreCtx } from '../contexts/StoreContext';

export function TopStoreSelector() {
  const { storeSlug, setStoreSlug } = useStoreCtx();
  return (
    <div className="flex items-center gap-2">
      <TextField size="small" label="Store" value={storeSlug} onChange={(e) => setStoreSlug(e.target.value)} />
    </div>
  );
}


