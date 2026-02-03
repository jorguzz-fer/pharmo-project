import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/auth';

type LoginForm = {
    crv: string;
    password?: string;
};

export function Login() {
    const { register, handleSubmit } = useForm<LoginForm>();
    const { login } = useAuthStore();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        setError('');
        try {
            await login(data.crv, data.password || 'vet123');
            navigate('/veterinario/dashboard');
        } catch (error: any) {
            console.error(error);
            setError(error.message || 'Falha no login. Verifique suas credenciais.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <img
                        src="/logo.png"
                        alt="PharmoPet Logo"
                        className="w-24 h-24 mb-4"
                    />
                    <h1 className="text-xl font-semibold text-gray-900">Acesso Veterinário</h1>
                    <p className="text-gray-500">Entre com seu CRV para acessar</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            CRV (Conselho Regional)
                        </label>
                        <input
                            {...register('crv', { required: true })}
                            type="text"
                            placeholder="Ex: 12345-SP"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Senha
                        </label>
                        <div className="relative">
                            <input
                                {...register('password')}
                                type={showPassword ? 'text' : 'password'}
                                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Entrando...
                            </>
                        ) : (
                            'Acessar Sistema'
                        )}
                    </button>

                    <div className="text-center mt-4">
                        <a
                            href="/forgot-password"
                            className="text-sm text-gray-600 hover:text-teal-600 transition-colors"
                        >
                            Esqueci minha senha
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
