"use client";
import * as React from 'react';

type Column<T> = { key: keyof T | string; header: string; render?: (row: T) => React.ReactNode };

export function DataTable<T extends Record<string, any>>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  return (
    <div className="overflow-auto rounded border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="px-3 py-2 text-left border-b">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="odd:bg-white even:bg-slate-50/30">
              {columns.map((c) => (
                <td key={String(c.key)} className="px-3 py-2 border-b">
                  {c.render ? c.render(r) : String(r[c.key as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


