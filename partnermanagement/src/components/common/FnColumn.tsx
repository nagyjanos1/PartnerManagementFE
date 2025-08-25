import { type RowData } from "@tanstack/react-table";
import * as React from "react";
import { type CommonGridColumn, type GridColUnion } from "./common-grid.types";
import { useColumnsCtx } from "./DataGrid";

export type FnColumnProps<TData extends RowData, TValue> =
  CommonGridColumn<TData, TValue> & { id: string; accessor: (row: TData) => TValue };

export function FnColumn<TData extends RowData, TValue>(
    props: FnColumnProps<TData, TValue>
) {
    const { register, unregister } = useColumnsCtx<TData>();
    const key = React.useId();

    // Only include relevant, stable dependencies
    const colObj = React.useMemo(() => ({
        kind: "fn" as const,
        col: props
    }), [
        props.id,
        props.header,
        props.type,
        props.sortable,
        props.filterable,
        props.width,
        props.cell,
        props.accessor // <-- add this!
    ]);

    React.useEffect(() => {
        register(colObj as GridColUnion<TData>, key);
        return () => unregister(key);
    }, [register, unregister, key, colObj]);

    return null;
}
