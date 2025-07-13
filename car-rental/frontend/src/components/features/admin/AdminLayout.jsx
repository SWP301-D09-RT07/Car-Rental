import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 min-h-screen p-8 overflow-auto">
                <div className="max-w-7xl mx-auto">
                <Outlet />
            </div>
            </main>
        </div>
    );
}