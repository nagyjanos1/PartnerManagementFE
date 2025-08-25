import * as React from "react";
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    type RowData,
    type SortingState,
    type ColumnFiltersState,
    useReactTable,
    type CellContext,
} from "@tanstack/react-table";
import { type GridColUnion } from "./common-grid.types";
import { type FnColumnProps } from "./FnColumn";
import { type KeyColumnProps } from "./KeyColumn";

type WidthMeta = { width?: number | string };

type RegistryApi<TData extends RowData> = {
    register: (c: GridColUnion<TData>, key: string) => void;
    unregister: (key: string) => void;
    items: GridColUnion<TData>[];
};

const ColumnsCtx = React.createContext<RegistryApi<unknown> | null>(null);
export function useColumnsCtx<TData extends RowData>() {
    const ctx = React.useContext(ColumnsCtx);
    if (!ctx) throw new Error("Column components must be used inside <DataGrid>.");
    return ctx as unknown as RegistryApi<TData>;
}

export function DataGrid<TData extends RowData>(props: {
    data: TData[];
    children?: React.ReactNode;
    showFilters?: boolean;
    onQueryChange?: (q: { sorting: SortingState; filters: ColumnFiltersState }) => void;
}) {
    const { data, children, showFilters = true, onQueryChange } = props;

    const [registered, setRegistered] = React.useState<GridColUnion<TData>[]>([]);

    // Stabil, referenciában nem változó callbackek
    const register = React.useCallback((c: GridColUnion<TData>, key: string) => {
        setRegistered(prev => {
            const next = prev.filter(x => x.__k !== key);
            c.__k = key;
            return [...next, c];
        });
    }, []);

    const unregister = React.useCallback((key: string) => {
        setRegistered(prev => prev.filter(x => x.__k !== key));
    }, []);

    const registry = React.useMemo<RegistryApi<TData>>(
        () => ({ register, unregister, items: registered }),
        [register, unregister, registered]
    );

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [filters, setFilters] = React.useState<ColumnFiltersState>([]);
    const colDefs = React.useMemo(() => buildColumnDefs<TData>(registered), [registered]);

    const table = useReactTable<TData>({
        data,
        columns: colDefs,
        state: { sorting, columnFilters: filters },
        onSortingChange: (u) => {
            const next = typeof u === "function" ? u(sorting) : u;
            setSorting(next); onQueryChange?.({ sorting: next, filters });
        },
        onColumnFiltersChange: (u) => {
            const next = typeof u === "function" ? u(filters) : u;
            setFilters(next); onQueryChange?.({ sorting, filters: next });
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <ColumnsCtx.Provider value={registry as unknown as RegistryApi<unknown>}>
            {children}
            <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                        {table.getHeaderGroups().map((hg) => (
                            <tr key={hg.id}>
                                {hg.headers.map((h) => {
                                    const width = (h.column.columnDef.meta as WidthMeta | undefined)?.width;
                                    return (
                                        <th key={h.id} style={{ padding: 8, borderBottom: "1px solid #e5e7eb", width }}>
                                            <div
                                                style={{ display: "flex", alignItems: "center", gap: 6, cursor: h.column.getCanSort() ? "pointer" : "default" }}
                                                onClick={h.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(h.column.columnDef.header, h.getContext())}
                                                {h.column.getCanSort() && (
                                                    <span style={{ opacity: 0.7 }}>
                                                        {h.column.getIsSorted() === "asc" ? "▲" :
                                                            h.column.getIsSorted() === "desc" ? "▼" : "↕"}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                        {showFilters && (
                            <tr>
                                {table.getHeaderGroups()[0]?.headers.map((h) => (
                                    <th key={h.id} style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                                        {h.column.getCanFilter() ? (
                                            <input
                                                value={(h.column.getFilterValue() ?? "") as string}
                                                onChange={(e) => h.column.setFilterValue(e.target.value)}
                                                placeholder="Filter…"
                                                style={{ width: "100%", padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6 }}
                                            />
                                        ) : null}
                                    </th>
                                ))}
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} style={{ padding: "8px 12px", verticalAlign: "middle" }}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ColumnsCtx.Provider>
    );
}

// normalizeHeader helper
function normalizeHeader<TData extends RowData, TValue>(
    h: React.ReactNode | string | undefined,
    fallback: string
): ColumnDef<TData, TValue>["header"] {
    const node = h == null ? fallback : h;
    return () => node;
}

function toColumnDef<TData extends RowData, K extends keyof TData>(
    c: KeyColumnProps<TData, K>
): ColumnDef<TData, TData[K]>;
function toColumnDef<TData extends RowData, TValue>(
    c: FnColumnProps<TData, TValue>
): ColumnDef<TData, TValue>;
function toColumnDef<TData extends RowData, TValue>(
    c: KeyColumnProps<TData, keyof TData> | FnColumnProps<TData, TValue>
): ColumnDef<TData, any> {
    const isKey = typeof (c as any).accessor !== "function";

    const type = c.type ?? "text";
    const sortable = c.sortable ?? true;
    const filterable = c.filterable ?? (type === "text" || type === "number");

    const cell = (ctx: CellContext<TData, any>) => {
        const value = ctx.getValue() as unknown;
        const row = ctx.row.original as TData;
        if (c.cell) return (c.cell as (v: unknown, r: TData) => React.ReactNode)(value, row);
        switch (type) {
            case "number":
                return value != null ? (
                    <span style={{ textAlign: "right", display: "inline-block", minWidth: 40 }}>{value as number}</span>
                ) : null;
            case "date":
                return value ? new Date(value as string | number).toLocaleDateString() : null;
            case "boolean":
                return <input type="checkbox" checked={Boolean(value)} readOnly />;
            default:
                return value as React.ReactNode;
        }
    };

    if (isKey) {
        const kc = c as KeyColumnProps<TData, keyof TData>;
        return {
            id: kc.id ?? String(kc.accessor),
            header: normalizeHeader<TData, TData[keyof TData]>(kc.header, String(kc.accessor)),
            accessorKey: kc.accessor as string,
            enableSorting: sortable,
            enableColumnFilter: filterable,
            cell,
            meta: { width: c.width } as WidthMeta,
        };
    } else {
        const fc = c as FnColumnProps<TData, TValue>;
        return {
            id: fc.id,
            header: normalizeHeader<TData, TValue>(fc.header, fc.id),
            accessorFn: fc.accessor,
            enableSorting: sortable,
            enableColumnFilter: filterable,
            cell,
            meta: { width: c.width } as WidthMeta,
        };
    }
}

function buildColumnDefs<TData extends RowData>(
    cols: readonly GridColUnion<TData>[]
): ColumnDef<TData, unknown>[] {
    return cols.map((gc) => (toColumnDef as any)(gc.col) as ColumnDef<TData, unknown>);
}
