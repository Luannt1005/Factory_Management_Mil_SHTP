"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import styles from "./login.module.css";
import { EyeIcon, EyeSlashIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

import { verifyPassword } from "@/lib/password";
import { useUser } from "@/app/context/UserContext";

function LoginContent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [showLocalLogin, setShowLocalLogin] = useState(false); // Toggle local login form
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/";
  const redirect = (rawRedirect.startsWith("/access-denied") || rawRedirect.startsWith("/login")) ? "/" : rawRedirect;
  const { setUser } = useUser();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam).replace(/_/g, " "));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (res?.error) {
        throw new Error(res.error || "Sai tài khoản hoặc mật khẩu");
      }

      // We no longer have `data.user` from custom API, but we can just set success
      // Or we can rely on `SessionProvider` or just proceed
      setSuccess(true);

      // Redirect after animation
      setTimeout(() => {
        router.replace(redirect);
      }, 2000);

    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Connection error. Please try again.");
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className={styles['login-container']}>
        <div className={styles['success-container']}>
          <div className={styles['success-icon']}>✓</div>
          <h2>Login successful!</h2>
          <p>Welcome back</p>
          <div className={styles['spinner-dots']}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['login-container']}>
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className={styles['login-video-bg']}
      >
        <source src="/Login_video.mp4" type="video/mp4" />
      </video>
      <div className={styles['login-video-overlay']}></div>

      <div className={styles['login-card']}>
        {/* Logo */}
        <div className={styles['login-logo']}>
          <div className={styles['logo-wrapper']}>
            <Image
              src="/Milwaukee-logo-red.png"
              width={200}
              height={90}
              alt="Milwaukee Tool"
              style={{ objectFit: 'contain' }}
              priority
              unoptimized
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap" rel="stylesheet" />
          <h1 className="text-[18px] md:text-[22px] font-bold uppercase tracking-[0.15em] drop-shadow-sm whitespace-nowrap" style={{ fontFamily: "'Orbitron', sans-serif", color: '#475569' }}>
            Factory Management
          </h1>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={`${styles.alert} ${styles['alert-error']}`}>
            <span className={styles['alert-icon']}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* SSO Button */}
        <div className="mt-2 flex flex-col gap-3 mb-6">
          <button
            type="button"
            onClick={() => signIn("azure-ad", { callbackUrl: redirect })}
            className="group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-4 rounded-xl shadow-lg text-[15px] font-bold text-white focus:outline-none focus:ring-4 focus:ring-red-500/30 transition-all tracking-wider whitespace-nowrap hover:shadow-xl"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-mwk) 0%, var(--color-primary-mwk-dark) 100%)' }}
          >
            {/* Flash/Shine Effect */}
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:animate-shine pointer-events-none group-hover:opacity-100 transition-all duration-1000 group-hover:translate-x-[300%]"></div>
            
            <Image 
              src="/TTI.png" 
              alt="TTI Logo" 
              width={24} 
              height={24} 
              className="object-contain relative z-10" 
              unoptimized
            />
            <span className="relative z-10">Sign in with TTI Account</span>
          </button>
        </div>

        {/* Toggle Local Login */}
        <div className="flex justify-center mb-2">
          <button
            type="button"
            onClick={() => setShowLocalLogin(!showLocalLogin)}
            className="flex items-center gap-2 px-6 py-2 rounded-full border border-gray-400/40 bg-white/20 text-xs font-bold text-gray-700 hover:bg-white/40 transition-colors tracking-wider"
          >
            <span>{showLocalLogin ? "▲" : "▼"}</span> Local account login
          </button>
        </div>

        {showLocalLogin && (
          <div className="transition-all duration-300 origin-top">
            {/* Divider */}
            <div className="flex items-center my-8">
              <div className="flex-grow border-t border-gray-400/40"></div>
              <span className="px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">OR CONTINUE WITH</span>
              <div className="flex-grow border-t border-gray-400/40"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className={styles['login-form']}>
              {/* Username Input */}
              <div className={styles['form-group']}>
                <label htmlFor="username" className="uppercase text-xs font-bold tracking-wider text-gray-500">Username</label>
                <div className={styles['input-wrapper']}>
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className={`${styles['form-input']} text-sm bg-gray-50`}
                    required
                  />
                  <span className={styles['input-icon']}>
                    <EnvelopeIcon className="w-5 h-5" />
                  </span>
                </div>
              </div>

              {/* Password Input */}
              <div className={styles['form-group']}>
                <label htmlFor="password" className="uppercase text-xs font-bold tracking-wider text-gray-500">Password</label>
                <div className={styles['input-wrapper']}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className={`${styles['form-input']} text-sm bg-gray-50`}
                    required
                  />
                  <button
                    type="button"
                    className={styles['input-button']}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" disabled={loading} className={styles['login-button']}>
                {loading ? (
                  <>
                    <span className={styles['button-spinner']}></span>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span className="font-bold tracking-widest">LOGIN</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer Links Hidden per request */}
        {/*
        <div className={styles['login-footer']}>
          <a href="#forgot" className={styles['footer-link']}>
            Forgot password?
          </a>
          <a href="/signup" className={styles['footer-link']}>
            Create account
          </a>
        </div>
        */}
      </div>

      {/* Background Elements */}
      <div className={`${styles['bg-decoration']} ${styles['bg-1']}`}></div>
      <div className={`${styles['bg-decoration']} ${styles['bg-2']}`}></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className={styles['login-container']}>
        <div className={styles['login-card']} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div className={styles['button-spinner']}></div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
