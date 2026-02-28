"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Lock, User, ArrowRight, Github, Chrome, Sparkles, CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";

import { signUp, signInWithGithub, signInWithGoogle } from "@/app/auth/actions";
import { useRouter } from "next/navigation";

export default function SignUp() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        try {
            await signUp(formData);
            setSuccess(true);
            setTimeout(() => router.push("/signin"), 3000);
        } catch (err: any) {
            setError(err.message || "An error occurred during signup");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'github') => {
        try {
            const url = provider === 'google' ? await signInWithGoogle() : await signInWithGithub();
            if (url) {
                window.location.href = url;
            }
        } catch (err: any) {
            setError(err.message || `An error occurred with ${provider} login`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center py-12 md:py-20 px-6 bg-background relative overflow-hidden">
            {/* Background Aesthetic */}
            <div className="absolute top-0 left-0 w-full h-full z-0 opacity-20">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-zinc-800 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-zinc-700/30 rounded-full blur-[150px] animate-pulse delay-700" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="flex flex-col items-center justify-center mb-6 group active:scale-95 transition-all">
                        <Logo size={64} className="drop-shadow-2xl" />
                    </Link>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10 mb-4">
                        <Sparkles size={12} className="text-foreground" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Join the Nest</span>
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white leading-none">
                        Create your <span className="bg-[linear-gradient(to_right,#757F9A,#D7DDE8,#757F9A,#D7DDE8,#757F9A)] bg-clip-text text-transparent">Identity</span>
                    </h1>
                    <p className="mt-3 text-zinc-500 text-sm font-medium">Join 50k+ creators and start downloading assets.</p>
                </div>

                <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/5 p-8 rounded-2xl shadow-2xl">
                    {/* Social Logins First */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('google')}
                            className="flex items-center justify-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all active:scale-95 group">
                            <Chrome size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Google</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('github')}
                            className="flex items-center justify-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all active:scale-95 group">
                            <Github size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Github</span>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                            Check your email to verify your account! Redirecting...
                        </div>
                    )}

                    <div className="relative mb-8 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <span className="relative px-3 bg-[#0a0a0a] text-[10px] font-black uppercase tracking-widest text-zinc-600">OR CONTINUE WITH EMAIL</span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User size={16} className="text-zinc-600 transition-colors group-focus-within:text-white" />
                                </div>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    suppressHydrationWarning
                                    className="block w-full pl-11 pr-4 py-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all text-sm placeholder:text-zinc-700 font-medium"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={16} className="text-zinc-600 transition-colors group-focus-within:text-white" />
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    suppressHydrationWarning
                                    className="block w-full pl-11 pr-4 py-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all text-sm placeholder:text-zinc-700 font-medium"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={16} className="text-zinc-600 transition-colors group-focus-within:text-white" />
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    minLength={8}
                                    suppressHydrationWarning
                                    className="block w-full pl-11 pr-4 py-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all text-sm placeholder:text-zinc-700 font-medium"
                                    placeholder="Min. 8 characters"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 py-2">
                            <div className="mt-0.5">
                                <CheckCircle2 size={14} className="text-zinc-600" />
                            </div>
                            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                                By signing up, you agree to our <Link href="/terms" className="text-white hover:underline">Terms</Link> and <Link href="/privacy" className="text-white hover:underline">Privacy Policy</Link>.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            suppressHydrationWarning
                            className="w-full bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? "Creating..." : (
                                <>
                                    Create Account <ArrowRight size={14} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-zinc-500 text-xs font-medium">
                    Already have an account?{" "}
                    <Link href="/signin" className="text-white hover:underline underline-offset-4 decoration-zinc-700 font-bold transition-all">
                        Sign In instead
                    </Link>
                </p>
            </div>
        </div>
    );
}
