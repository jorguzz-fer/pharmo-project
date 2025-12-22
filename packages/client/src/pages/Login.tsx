import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Pill, Loader2 } from 'lucide-react';
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

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        try {
            await login(data.crv);
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4">
                        <Pill className="text-white w-7 h-7" />
                    </div>
                    <h2 className="text-3xl font-bold text-green-700 mb-2">PharmoPet</h2>
                    <h1 className="text-xl font-semibold text-gray-900">Acesso Veterinário</h1>
                    <p className="text-gray-500">Entre com seu CRV para acessar</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            CRV (Conselho Regional)
                        </label>
                        <input
                            {...register('crv', { required: true })}
                            type="text"
                            placeholder="Ex: 12345-SP"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Senha
                        </label>
                        <input
                            {...register('password')}
                            type="password"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                </form>
            </div>
        </div>
    );
}
