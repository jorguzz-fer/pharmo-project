import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Building2 } from 'lucide-react';
import { useClinicAuthStore } from '../../store/clinicAuth';

type LoginForm = {
    email: string;
    password: string;
};

export function ClinicLogin() {
    const { register, handleSubmit } = useForm<LoginForm>();
    const { login } = useClinicAuthStore();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        setError('');
        try {
            await login(data.email, data.password);
            navigate('/clinica/dashboard');
        } catch (error: any) {
            console.error(error);
            setError(error.message || 'Falha no login. Verifique suas credenciais.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                        <Building2 className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        PharmoPet Clínica
                    </h2>
                    <p className="text-gray-500">Acesso ao Dashboard</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email da Clínica
                        </label>
                        <input
                            {...register('email', { required: true })}
                            type="email"
                            placeholder="clinica@exemplo.com"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Senha
                        </label>
                        <input
                            {...register('password', { required: true })}
                            type="password"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Link
                            to="/clinica/forgot-password"
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                            Esqueci minha senha
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Acessando...
                            </>
                        ) : (
                            'Acessar Dashboard'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Ainda não tem acesso?</p>
                    <p className="mt-1">Entre em contato com o administrador</p>
                </div>
            </div>
        </div>
    );
}
