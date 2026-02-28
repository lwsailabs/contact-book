import React, { useState } from 'react';
import { Baby, AlertCircle, Users, LogIn, User } from 'lucide-react';

export const LoginScreen = ({ onLoginFamily, onLoginLocal, isAuthenticating, loginError }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password) onLoginFamily(password);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Baby className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">歡迎來到聯絡簿</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">請選擇您的使用模式</p>
                    </div>

                    {loginError && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm flex items-center justify-center gap-2 text-left leading-relaxed">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> 
                            <span>{loginError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2 text-left">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-600" /> 家庭同步模式
                            </label>
                            <input 
                                type="password" 
                                placeholder="請輸入家庭共同密碼"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isAuthenticating || !password}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {isAuthenticating ? <span className="animate-pulse">登入中...</span> : <><LogIn className="w-4 h-4" /> 登入家庭帳號</>}
                        </button>
                    </form>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
                        <div className="relative flex justify-center"><span className="bg-white dark:bg-gray-800 px-4 text-xs text-gray-400">或者</span></div>
                    </div>

                    <button 
                        onClick={onLoginLocal}
                        disabled={isAuthenticating}
                        className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl py-3 font-medium transition-colors flex justify-center items-center gap-2"
                    >
                        <User className="w-4 h-4" /> 單機模式 (不分享資料)
                    </button>
                </div>
            </div>
        </div>
    );
};