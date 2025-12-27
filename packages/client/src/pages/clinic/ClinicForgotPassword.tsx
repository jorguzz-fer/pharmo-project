import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

type ForgotPasswordForm = {
    email: string;
};

export function ClinicForgotPassword() {
    const { register, handleSubmit } = useForm<ForgotPasswordForm>();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const onSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true);
        setError('');
        setSuccess(false);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://api.pharmopet.com.br';
            const response = await fetch(`${API_URL}/api/auth/clinica/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao solicitar recuperação');
            }

            setSuccess(true);
        } catch (error: any) {
            console.error(error);
            setError(error.message || 'Erro ao solicitar recuperação de senha');
        } finally {
            setIsLoading(false);
        }
    };

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
                        Recuperar Senha
                    </h2>
                    <p className="text-gray-500 text-center mt-2">
                        Digite seu email para receber instruções de recuperação
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
                            Email Enviado!
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Se o email existir em nosso sistema, você receberá instruções para redefinir sua senha.
                        </p>
                        <Link
                            to="/clinica/login"
                            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para o login
                        </Link>
                    </div>
                ) : (
                    <>
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

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    'Enviar Instruções'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link
                                to="/clinica/login"
                                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar para o login
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
