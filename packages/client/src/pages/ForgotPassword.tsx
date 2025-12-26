import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [userType, setUserType] = useState<'veterinario' | 'admin'>('veterinario');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/password-reset/request', { email, userType });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao solicitar recuperação de senha');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Enviado!</h2>
                    <p className="text-gray-600 mb-6">
                        Se o email <strong>{email}</strong> estiver cadastrado, você receberá instruções para redefinir sua senha.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Verifique sua caixa de entrada e também a pasta de spam.
                    </p>
                    <Link
                        to={userType === 'admin' ? '/admin/login' : '/login'}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para o login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Esqueceu sua senha?</h2>
                    <p className="text-gray-600">
                        Digite seu email e enviaremos instruções para redefinir sua senha.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tipo de Usuário */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Conta
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setUserType('veterinario')}
                                className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${userType === 'veterinario'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                Veterinário
                            </button>
                            <button
                                type="button"
                                onClick={() => setUserType('admin')}
                                className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${userType === 'admin'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                Admin
                            </button>
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="seu@email.com"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                    </button>

                    <div className="text-center">
                        <Link
                            to={userType === 'admin' ? '/admin/login' : '/login'}
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para o login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
