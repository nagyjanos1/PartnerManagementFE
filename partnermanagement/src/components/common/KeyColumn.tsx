import { type RowData } from "@tanstack/react-table";
import * as React from "react";
import { useColumnsCtx } from "./DataGrid";
import { type CommonGridColumn } from "./common-grid.types";

export type KeyColumnProps<TData extends RowData, K extends keyof TData> =
  CommonGridColumn<TData, TData[K]> & { accessor: K };
  
export function KeyColumn<TData extends RowData>(
    props: KeyColumnProps<TData, keyof TData>
) {
    const { register, unregister } = useColumnsCtx<TData>();
    const key = React.useId();

    // Stabilizált oszlop-objektum (ne props object identity legyen a dependency)
    const colObj = React.useMemo(() => ({
        kind: "key" as const,
        col: props
    }), [
        props.accessor,
        props.id,
        props.header,
        props.type,
        props.sortable,
        props.filterable,
        props.width,
        props.cell
    ]);

    React.useEffect(() => {
        register(colObj, key);
        return () => unregister(key);
    }, [register, unregister, key, colObj]);

    return null;
}
