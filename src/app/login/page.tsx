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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
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
        <div className={styles['login-header']}>
          <h1>Login</h1>
          <p>Org Chart Management</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={`${styles.alert} ${styles['alert-error']}`}>
            <span className={styles['alert-icon']}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles['login-form']}>
          {/* Username Input */}
          <div className={styles['form-group']}>
            <label htmlFor="username">Email</label>
            <div className={styles['input-wrapper']}>
              <input
                id="username"
                type="text"
                placeholder="Enter email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className={styles['form-input']}
                required
              />
              <span className={styles['input-icon']}>
                <EnvelopeIcon className="w-5 h-5" />
              </span>
            </div>
          </div>

          {/* Password Input */}
          <div className={styles['form-group']}>
            <label htmlFor="password">Password</label>
            <div className={styles['input-wrapper']}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={styles['form-input']}
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
                <span>Login</span>
                <span className={styles['button-arrow']}>→</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className={styles['divider-line']}>
           <span className="text-sm text-gray-500 bg-white px-2 absolute left-1/2 -translate-x-1/2 -top-2.5">Hoặc</span>
        </div>

        {/* SSO Button */}
        <div className="mt-4 flex flex-col gap-3 px-6">
          <button
            type="button"
            onClick={() => signIn("azure-ad", { callbackUrl: redirect })}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 21 21">
              <path fill="#f25022" d="M1 1h9v9H1z" />
              <path fill="#7fba00" d="M11 1h9v9h-9z" />
              <path fill="#00a4ef" d="M1 11h9v9H1z" />
              <path fill="#ffb900" d="M11 11h9v9h-9z" />
            </svg>
            Đăng nhập với Microsoft (SSO)
          </button>
        </div>

        {/* Footer Links */}
        <div className={styles['login-footer']}>
          <a href="#forgot" className={styles['footer-link']}>
            Forgot password?
          </a>
          <a href="/signup" className={styles['footer-link']}>
            Create account
          </a>
        </div>
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
