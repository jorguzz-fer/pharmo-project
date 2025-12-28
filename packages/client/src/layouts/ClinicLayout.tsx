import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, LogOut, Menu, X } from 'lucide-react';
import { useClinicAuthStore } from '../store/clinicAuth';

export function ClinicLayout() {
    const { logout, user } = useClinicAuthStore();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/clinica/login');
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <img src="/logo-horizontal.png" alt="PharmoPet" className="h-12" />
                </div>
                <button onClick={toggleSidebar} className="p-2 text-gray-600 hover:bg-purple-50 rounded-lg transition-colors">
                    {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="hidden lg:flex p-6 border-b border-gray-200 items-center justify-center">
                    <img src="/logo-horizontal.png" alt="PharmoPet" className="w-48 object-contain" />
                </div>

                <div className="lg:hidden p-6 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-500">Menu</span>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavLink
                        to="/clinica/dashboard"
                        onClick={closeSidebar}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 font-medium'
                                : 'text-gray-600 hover:bg-purple-50'
                            }`
                        }
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/clinica/prescricoes"
                        onClick={closeSidebar}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 font-medium'
                                : 'text-gray-600 hover:bg-purple-50'
                            }`
                        }
                    >
                        <FileText className="w-5 h-5" />
                        Prescrições
                    </NavLink>

                    <NavLink
                        to="/clinica/veterinarios"
                        onClick={closeSidebar}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 font-medium'
                                : 'text-gray-600 hover:bg-purple-50'
                            }`
                        }
                    >
                        <Users className="w-5 h-5" />
                        Veterinários
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="mb-3 px-4">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto lg:pt-0 pt-16">
                <Outlet />
            </main>
        </div>
    );
}
