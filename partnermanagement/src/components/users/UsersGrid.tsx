import { DataGrid } from '@/components/common/DataGrid';
import { KeyColumn } from '@/components/common/KeyColumn';
import { FnColumn } from '@/components/common/FnColumn';

type User = {
    id: string;
    name: string;
    email: string;
    age: number;
    active: boolean;
    createdAt: string;
};

const data: User[] = [
    { id: "1", name: "Ada", email: "ada@ex.com", age: 31, active: true, createdAt: "2024-04-01T09:00:00Z" },
    { id: "2", name: "Bob", email: "bob@ex.com", age: 25, active: false, createdAt: "2024-02-10T10:00:00Z" },
];

export default function UsersGrid() {
    return (
        <div style={{ padding: 16 }}>
            <h1>Users</h1>
            <DataGrid<User> data={data} showFilters>
                <KeyColumn<User> accessor="name" header="Name" width={200} />
                <KeyColumn<User> accessor="email" header="Email" width={260} />
                <KeyColumn<User> accessor="age" header={<b>Age</b>} type="number" width={80} />
                <KeyColumn<User> accessor="active" header="Active" type="boolean" width={90} />
                <FnColumn<User, string>
                    id="actions"
                    header={<i>Actions</i>}
                    accessor={(u: User) => u.id}
                    sortable={false}
                    filterable={false}
                    cell={(id: string) => <button onClick={() => alert(id)}>Details</button>}
                />
            </DataGrid>
        </div>
    );
}
