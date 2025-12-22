import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

type LoginAdminForm = {
    email: string;
    password?: string;
};

export function AdminLogin() {
    const { register, handleSubmit } = useForm<LoginAdminForm>();
    const { loginAdmin } = useAuthStore();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const onSubmit = async (data: LoginAdminForm) => {
        setIsLoading(true);
        setError('');
        try {
            await loginAdmin(data.email, data.password || 'password');
            navigate('/admin/dashboard');
        } catch (error) {
            console.error(error);
            setError('Falha no login. Verifique suas credenciais.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-4">
                        <ShieldCheck className="text-white w-7 h-7" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">PharmoPet Admin</h2>
                    <p className="text-gray-500">Acesso Administrativo</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Corporativo
                        </label>
                        <input
                            {...register('email', { required: true })}
                            type="email"
                            placeholder="seu.nome@pharmo.com"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Senha
                        </label>
                        <input
                            {...register('password', { required: true })}
                            type="password"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Acessando...
                            </>
                        ) : (
                            'Acessar Painel'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
