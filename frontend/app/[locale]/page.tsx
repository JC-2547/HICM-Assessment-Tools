"use client";

import Navbar from "../component/navbar";
import LanguageSwitcher from "../component/languageSwitcher";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setErrorMessage(payload?.detail || "Login failed");
        return;
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_id", String(data.user_id));
      localStorage.setItem("roleid", String(data.roleid));
      localStorage.setItem("role_name", data.role_name || "");
      localStorage.setItem("username", username);

      const role = (data.role_name || "").toLowerCase();
      if (role === "admin") {
        router.push(`/${locale}/admindashboard`);
      } else if (role === "audit") {
        router.push(`/${locale}/auditdashboard`);
      } else {
        router.push(`/${locale}/companydashboard`);
      }
    } catch (error) {
      setErrorMessage("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div className="rounded-2xl bg-blue-500 px-6 py-8 text-white shadow-lg sm:px-8 sm:py-10">
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
              {t("welcomeTitle")}
            </h1>
            <p className="mt-4 text-base text-blue-100 sm:text-lg">
              {t("welcomeSubtitle")}
            </p>
          </div>

          <div className="w-full rounded-2xl bg-gray-100 p-6 shadow-lg sm:p-8">
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {t("signIn")}
              </h2>
              <input
                type="text"
                placeholder={t("username")}
                className="w-full rounded border border-gray-300 bg-white p-3 text-sm sm:text-base"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
              <input
                type="password"
                placeholder={t("password")}
                className="w-full rounded border border-gray-300 bg-white p-3 text-sm sm:text-base"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {errorMessage ? (
                <p className="text-sm text-red-600">{errorMessage}</p>
              ) : null}
              <button className="text-right text-sm text-blue-600 hover:text-blue-700">
                {t("forgotPassword")}
              </button>
              <button
                className="w-full rounded bg-blue-500 p-3 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleSignIn}
                disabled={isLoading || !username || !password}
              >
                {isLoading ? "Signing in..." : t("signInButton")}
              </button>
            </div>
          </div>
        </div>
      </main>
      <LanguageSwitcher />
    </div>
  );
}

