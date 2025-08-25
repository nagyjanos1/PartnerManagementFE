import { type RowData } from "@tanstack/react-table";
import * as React from "react";
import { type KeyColumnProps } from "./KeyColumn";
import { type FnColumnProps } from "./FnColumn";

export type CommonGridColumn<TData extends RowData, TValue> = {
    id?: string;
    header?: React.ReactNode | string;
    type?: "text" | "number" | "date" | "boolean" | "custom";
    sortable?: boolean;
    filterable?: boolean;
    width?: number | string;
    cell?: (value: TValue, row: TData) => React.ReactNode;
};

export type GridColUnion<TData extends RowData> =
    (
        | { kind: "key"; col: KeyColumnProps<TData, keyof TData> }
        | { kind: "fn"; col: FnColumnProps<TData, any> }
    ) & { __k?: string };
