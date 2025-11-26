'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Lock, LogIn, UserPlus, Home, X, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useSalesforceTracking } from '@/hooks/useSalesforceTracking';
import { PRODUCTS, ProductId } from "@/config/products";

// Types
interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}


interface UserData {
    firstName: string;
    lastName: string;
    email: string;
}

type AuthMode = 'login' | 'register';

export default function LandingPageDemo() {
    const [showAuth, setShowAuth] = useState<boolean>(false);
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });

    const [specialCta, setSpecialCta] = useState<string | null>(null);
    const [specialImageUrl, setSpecialImageUrl] = useState<string | null>(null);


    const supabase = createClient();
    const { trackEvent, trackIdentity, trackEmail, trackUserId, trackConsent, trackProductCatalogClick, } = useSalesforceTracking();

    // Check for existing session
    useEffect(() => {
        const checkUser = async (): Promise<void> => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser({
                    firstName:
                        session.user.user_metadata?.firstName ||
                        session.user.email?.split('@')[0] || // only for first name
                        "User",

                    lastName:
                        session.user.user_metadata?.lastName || // kalau belum ada metadata → kosong
                        "",

                    email: session.user.email || ""
                });
                setIsLoggedIn(true);
            } else {
                setUser(null);
                setIsLoggedIn(false);

                // kirim anonymous sekali di sini
                trackIdentity({ isAnonymous: true });
            }
        };

        checkUser();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            if (session?.user) {
                setUser({
                    firstName:
                        session.user.user_metadata?.firstName ||
                        session.user.email?.split('@')[0] || // only for first name
                        "User",

                    lastName:
                        session.user.user_metadata?.lastName || // kalau belum ada metadata → kosong
                        "",

                    email: session.user.email || ""
                });
                setIsLoggedIn(true);
            } else {
                setUser(null);
                setIsLoggedIn(false);
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [supabase.auth]);

    // 🔽 Fetch Salesforce Personalization untuk blok special product
    // 🔽 Fetch Salesforce Personalization (CTA + image)
    // Fetch Salesforce Personalization "special_content"
    useEffect(() => {
        if (typeof window === "undefined") return;

        const runFetch = () => {
            const personalization = window.SalesforceInteractions?.Personalization;
            if (!personalization?.fetch) {
                console.log("[SF] Personalization SDK not available. Skip personalized block.");
                return;
            }

            personalization
                .fetch(["special_content"])
                .then((response) => {
                    console.log("[SF] Personalization response received:", response);

                    const attrs = response.personalizations?.[0]?.attributes;

                    if (!attrs) {
                        console.log("[SF] No personalization attributes found.");
                        setSpecialCta(null);
                        setSpecialImageUrl(null);
                        return;
                    }

                    setSpecialCta(attrs.CTA_Text ?? null);
                    // ⚠️ di log kamu field-nya "Prouduct_Image_URL" (typo)
                    setSpecialImageUrl(
                        attrs.Prouduct_Image_URL ?? attrs.Product_Image_URL ?? null
                    );
                })
                .catch((err) => {
                    console.error("[SF] Error fetching personalization:", err);
                });
        };

        if (window.__sfInteractionsReady) {
            runFetch();
            return;
        }

        const handler = () => runFetch();
        window.addEventListener("sf_interactions_ready", handler);

        return () => window.removeEventListener("sf_interactions_ready", handler);
    }, []);



    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (): Promise<void> => {
        setLoading(true);
        setError('');

        try {
            if (authMode === 'login') {
                // Login with Supabase
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                });

                if (error) throw error;

                if (data.user) {
                    setUser({
                        firstName:
                            data.user.user_metadata?.firstName ||
                            data.user.email?.split('@')[0] || // only for first name
                            "User",

                        lastName:
                            data.user.user_metadata?.lastName || // kalau belum ada metadata → kosong
                            "",

                        email: data.user.email || ""
                    });
                    setIsLoggedIn(true);
                    setShowAuth(false);
                    setFormData({ firstName: '', lastName: '', email: '', password: '' });

                    // Track identity event (login)
                    trackIdentity({
                        isAnonymous: false,
                        firstName: data.user.user_metadata?.firstName || undefined,
                        lastName: data.user.user_metadata?.lastName || undefined,
                        email: data.user.email || undefined,
                    });

                    // Track email contact point
                    if (data.user.email) {
                        trackEmail(data.user.email);
                    }

                    // Track user ID mapping
                    trackUserId({
                        userId: data.user.id,
                        idType: 'Supabase',
                        idName: data.user.email || 'unknown',
                    });

                    // Track login interaction event
                    trackEvent('user_login');
                }
            } else {
                // Register with Supabase
                const { data, error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                        }
                    }
                });

                if (error) throw error;

                if (data.user) {
                    setShowAuth(false);
                    setFormData({ firstName: '', lastName: '', email: '', password: '' });
                    setError('Registration successful! Please check your email to confirm your account.');
                    setTimeout(() => setError(''), 5000);

                    // Track identity event (registration)
                    trackIdentity({
                        isAnonymous: false,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: data.user.email || undefined,
                    });

                    // Track email contact point
                    if (data.user.email) {
                        trackEmail(data.user.email);
                    }

                    // Track user ID mapping
                    trackUserId({
                        userId: data.user.id,
                        idType: 'Supabase',
                        idName: data.user.email || 'unknown',
                    });

                    // Track registration interaction event
                    trackEvent('user_registration');
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async (): Promise<void> => {
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setUser(null);
    };

    const openAuth = (mode: AuthMode): void => {
        setAuthMode(mode);
        setShowAuth(true);
        setError('');

        // Track modal open event
        trackEvent(`auth_modal_opened_${mode}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <Home className="w-6 h-6 text-blue-600" />
                            <span className="text-xl font-bold text-gray-900">DemoApp</span>
                        </div>

                        <div className="flex items-center space-x-4">
                            {isLoggedIn ? (
                                <>
                                    <div className="flex items-center space-x-2 text-gray-700">
                                        <User className="w-5 h-5" />
                                        <span className="font-medium">{user?.firstName}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => openAuth('login')}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => openAuth('register')}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                                    >
                                        Sign Up
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    <h1 className="text-5xl font-bold text-gray-900 mb-6">
                        Welcome to <span className="text-blue-600">Antartix Store</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Discover latest tech products from laptops to smart wearables
                    </p>

                </div>
                {/* Personalized Product Block - hanya muncul kalau personalization ada */}
                {/* Personalized Special Product (jika ada CTA / image dari Personalization) */}
                {((specialCta || specialImageUrl) && (isLoggedIn)) && (
                    <section className="mt-10 mb-12 grid grid-cols-1 md:grid-cols-[2fr,3fr] gap-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white p-6 shadow-lg">
                        <div className="flex flex-col justify-center space-y-3">
                            <p className="text-xs uppercase tracking-wide text-indigo-100">
                                Special for you
                            </p>
                            <p className="text-2xl font-semibold leading-snug">
                                {specialCta ?? "Recommended product picked just for you."}
                            </p>
                            <button className="self-start mt-2 px-4 py-2 rounded-lg bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition">
                                Shop now
                            </button>
                        </div>

                        {specialImageUrl && (
                            <div className="relative h-44 md:h-56 rounded-xl overflow-hidden bg-white/10">
                                <img
                                    src={specialImageUrl}
                                    alt="Personalized product"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </section>
                )}
                {/* Features */}
                {/* Products (mock dari CSV) */}
                <div className="mt-20">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
                            <p className="text-gray-600">
                                Handpicked devices from Antartix Store for your productivity and lifestyle.
                            </p>
                        </div>
                        <div className="hidden md:flex items-center space-x-3 text-sm text-gray-500">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                                ⚡ Fast delivery
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                🔒 Secure checkout
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {PRODUCTS.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition cursor-pointer flex flex-col overflow-hidden border border-gray-100"
                                onClick={() => trackProductCatalogClick(product.id)}
                            >
                                {/* Gambar produk */}
                                <div className="relative h-48 w-full overflow-hidden">
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="h-full w-full object-cover transform hover:scale-105 transition-transform duration-300"
                                    />
                                    {product.badge && (
                                        <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 text-blue-700 shadow">
                                            {product.badge}
                                        </span>
                                    )}
                                </div>

                                {/* Detail produk */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                        {product.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>
                                    <p className="text-gray-600 text-sm mb-4 flex-1">
                                        {product.description}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                                        <div className="text-xs text-gray-500">
                                            Click card to view product
                                        </div>
                                        <button
                                            type="button"
                                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition"
                                        >
                                            View details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


            </div>

            {/* Auth Modal */}
            {showAuth && (
                <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in slide-in-from-bottom-4 duration-300">
                        <button
                            onClick={() => setShowAuth(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h2 className="text-3xl font-bold text-gray-900 mb-6">
                            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h2>

                        {error && (
                            <div className={`mb-4 p-3 rounded-lg text-sm ${error.includes('successful') || error.includes('check your email')
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                                }`}>
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {authMode === 'register' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition mb-2"
                                            placeholder="John"
                                            disabled={loading}
                                        />
                                    </div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            placeholder="Doe"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="you@example.com"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="••••••••"
                                        disabled={loading}
                                        minLength={6}
                                    />
                                </div>
                                {authMode === 'register' && (
                                    <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
                                )}
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    authMode === 'login' ? 'Login' : 'Create Account'
                                )}
                            </button>
                        </div>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                                disabled={loading}
                                className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition"
                            >
                                {authMode === 'login'
                                    ? "Don't have an account? Sign up"
                                    : 'Already have an account? Login'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-gray-900 text-white mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <p className="text-gray-400">
                            © 2024 DemoApp. All rights reserved. | Powered by Salesforce Data Cloud
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}