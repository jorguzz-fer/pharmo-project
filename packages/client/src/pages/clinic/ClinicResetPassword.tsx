import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle } from 'lucide-react';

type ResetPasswordForm = {
    password: string;
    confirmPassword: string;
};

export function ClinicResetPassword() {
    const { register, handleSubmit, watch } = useForm<ResetPasswordForm>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const token = searchParams.get('token');
    const password = watch('password');

    const onSubmit = async (data: ResetPasswordForm) => {
        if (!token) {
            setError('Token inválido ou ausente');
            return;
        }

        if (data.password !== data.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (data.password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://api.pharmopet.com.br';
            const response = await fetch(`${API_URL}/api/auth/clinica/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    newPassword: data.password
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao redefinir senha');
            }

            setSuccess(true);
            setTimeout(() => navigate('/clinica/login'), 3000);
        } catch (error: any) {
            console.error(error);
            setError(error.message || 'Erro ao redefinir senha');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Token Inválido</h2>
                    <p className="text-gray-600">
                        O link de recuperação é inválido ou expirou.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <img
                        src="/logo-horizontal.png"
                        alt="PharmoPet"
                        className="h-16 mb-4"
                    />
                    <h2 className="text-2xl font-bold text-gray-900">
                        Redefinir Senha
                    </h2>
                    <p className="text-gray-500 text-center mt-2">
                        Digite sua nova senha
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Senha Redefinida!
                        </h3>
                        <p className="text-gray-600">
                            Sua senha foi alterada com sucesso. Redirecionando para o login...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nova Senha
                            </label>
                            <input
                                {...register('password', { required: true, minLength: 6 })}
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmar Nova Senha
                            </label>
                            <input
                                {...register('confirmPassword', {
                                    required: true,
                                    validate: value => value === password || 'As senhas não coincidem'
                                })}
                                type="password"
                                placeholder="Digite a senha novamente"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Redefinindo...
                                </>
                            ) : (
                                'Redefinir Senha'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
