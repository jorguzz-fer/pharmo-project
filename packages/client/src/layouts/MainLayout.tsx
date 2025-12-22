import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Pill, LayoutDashboard, FileText, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth';

export function MainLayout() {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200 flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                        <Pill className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">Pharmo</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavLink
                        to="/dashboard"
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
            <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
