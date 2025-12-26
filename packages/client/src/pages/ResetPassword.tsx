import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

export function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        validateToken();
    }, [token]);

    const validateToken = async () => {
        if (!token) {
            setError('Token inválido');
            setValidating(false);
            return;
        }

        try {
            await api.get(`/password-reset/validate/${token}`);
            setTokenValid(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Token inválido ou expirado');
        } finally {
            setValidating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/password-reset/reset', { token, newPassword });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao redefinir senha');
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Validando token...</p>
                </div>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Token Inválido</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link
                        to="/forgot-password"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Solicitar Novo Link
                    </Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Senha Redefinida!</h2>
                    <p className="text-gray-600 mb-6">
                        Sua senha foi alterada com sucesso. Você será redirecionado para o login em alguns segundos.
                    </p>
                    <Link
                        to="/login"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Ir para o Login
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
                        <Lock className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Redefinir Senha</h2>
                    <p className="text-gray-600">
                        Digite sua nova senha abaixo.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nova Senha */}
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Nova Senha
                        </label>
                        <div className="relative">
                            <input
                                id="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                                placeholder="Mínimo 6 caracteres"
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

                    {/* Confirmar Senha */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirmar Senha
                        </label>
                        <input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Digite a senha novamente"
                        />
                    </div>

                    {/* Requisitos de Senha */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 font-medium mb-2">Requisitos da senha:</p>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                Mínimo de 6 caracteres
                            </li>
                            <li className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${newPassword === confirmPassword && newPassword.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                Senhas coincidem
                            </li>
                        </ul>
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
                        {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
}
