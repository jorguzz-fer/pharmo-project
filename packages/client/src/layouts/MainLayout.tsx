import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Pill, LayoutDashboard, FileText, LogOut, Menu, X, Phone, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/auth';

export function MainLayout() {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    // Close sidebar on route change (mobile)
    if (isSidebarOpen && location) {
        // We can use an effect, but simple click handlers on NavLinks work too.
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                        <Pill className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">PharmoPet</span>
                </div>
                <button onClick={toggleSidebar} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
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
                <div className="hidden lg:flex p-6 border-b border-gray-200 items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                        <Pill className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">PharmoPet</span>
                </div>

                <div className="lg:hidden p-6 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-500">Menu</span>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {/* Common / Vet Links */}
                    {(!user?.role || user.role === 'VET') && (
                        <>
                            <NavLink
                                to="/dashboard"
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-green-50 text-green-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`
                                }
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                Dashboard
                            </NavLink>

                            <NavLink
                                to="/prescricoes/nova"
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-green-50 text-green-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`
                                }
                            >
                                <FileText className="w-5 h-5" />
                                Nova Prescrição
                            </NavLink>
                        </>
                    )}

                    {/* Admin Links */}
                    {user?.role === 'ADMIN' && (
                        <>
                            <NavLink
                                to="/admin/dashboard"
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-gray-800 text-white font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`
                                }
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                Admin Dashboard
                            </NavLink>

                            <NavLink
                                to="/admin/follow-ups"
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-gray-800 text-white font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`
                                }
                            >
                                <Phone className="w-5 h-5" />
                                Follow-ups
                            </NavLink>

                            <NavLink
                                to="/admin/relatorios"
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-gray-800 text-white font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`
                                }
                            >
                                <TrendingUp className="w-5 h-5" />
                                Relatórios
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                            {user?.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.crv}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto w-full pt-16 lg:pt-0">
                <div className="max-w-7xl mx-auto p-4 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
