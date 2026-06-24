import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import lbidLogo from "../../imports/_____.png";

type Tab = "signin" | "register";
type ResetState = "idle" | "form" | "sent";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12.5px] font-semibold text-ink-2 tracking-[0.02em]">{label}</label>
      {children}
      {error && (
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" strokeWidth={2} />
          <span className="text-[11.5px] text-red-500">{error}</span>
        </div>
      )}
    </div>
  );
}

const INPUT =
  "w-full px-3.5 py-2.5 rounded-xl border-2 border-line bg-white text-[13.5px] text-ink outline-none " +
  "placeholder:text-ink-3 transition-all duration-200 ease-in-out " +
  "focus:border-navy focus:shadow-[0_0_0_3px_rgba(12,26,62,0.08)]";

export function AuthPage() {
  const navigate  = useNavigate();
  const [tab,     setTab]     = useState<Tab>("signin");
  const [reset,   setReset]   = useState<ResetState>("idle");
  const [showPwd, setShowPwd] = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [form,    setForm]    = useState({
    company: "", email: "", password: "", confirm: "", resetEmail: "",
  });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.email)    e.email    = "Email is required";
    if (!form.password) e.password = "Password is required";
    if (tab === "register") {
      if (!form.company)              e.company  = "Company name is required";
      if (form.password.length < 8)   e.password = "At least 8 characters";
      if (form.password !== form.confirm) e.confirm = "Passwords don't match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) navigate("/");
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setReset("sent");
  }

  return (
    <div className="w-[420px]">
      {/* Logo — multiply blends white bg with canvas gradient */}
      <div
        className="flex justify-center mb-5"
        style={{ overflow: "hidden", height: "112px" }}
      >
        <ImageWithFallback
          src={lbidLogo}
          alt="LBID — Logistics Bidding Platform"
          style={{
            width: "360px",
            height: "auto",
            display: "block",
            mixBlendMode: "multiply",
            userSelect: "none",
            marginTop: "-36px",
          }}
          draggable={false}
        />
      </div>

      {/* Card */}
      <div
        className="bg-white rounded-[20px] border border-line overflow-hidden"
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05)" }}
      >
        {/* Navy top accent */}
        <div
          aria-hidden
          className="h-[3px]"
          style={{ background: "linear-gradient(90deg, #0C1A3E 0%, #1E3A7A 55%, #C49A3C 100%)" }}
        />

        {/* Tabs — hidden during reset flow */}
        {reset === "idle" && (
          <div className="flex border-b border-line">
            {(["signin", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}); }}
                className={`flex-1 py-4 text-[13.5px] font-medium transition-all duration-200 ease-in-out cursor-pointer
                  ${tab === t
                    ? "text-navy border-b-2 border-navy -mb-px"
                    : "text-ink-3 hover:text-ink border-b-2 border-transparent"
                  }`}
              >
                {t === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Reset password ── */}
          {reset !== "idle" ? (
            <motion.div
              key="reset"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="p-7"
            >
              {reset === "sent" ? (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-soft border border-emerald/20 flex items-center justify-center">
                    <span className="text-emerald text-[18px]">✓</span>
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-ink">Check your inbox</p>
                    <p className="text-[13px] text-ink-3 mt-1">
                      Reset link sent to <strong className="text-ink-2">{form.resetEmail}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => { setReset("idle"); setTab("signin"); }}
                    className="text-[12.5px] font-medium text-navy hover:underline cursor-pointer transition-all duration-200"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="flex flex-col gap-5">
                  <div>
                    <p className="text-[16px] font-semibold text-ink mb-1">Reset your password</p>
                    <p className="text-[13px] text-ink-3">We'll send a link to your registered email.</p>
                  </div>
                  <Field label="Email address">
                    <input type="email" value={form.resetEmail} onChange={set("resetEmail")} placeholder="you@company.com" className={INPUT} required />
                  </Field>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-navy text-white text-[13.5px] font-semibold
                               transition-all duration-200 ease-in-out cursor-pointer
                               hover:bg-navy-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(12,26,62,0.25)]
                               active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setReset("idle")}
                    className="text-[12.5px] font-medium text-ink-3 hover:text-ink transition-colors duration-200 cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </motion.div>
          ) : (
            /* ── Main auth form ── */
            <motion.form
              key={tab}
              initial={{ opacity: 0, x: tab === "register" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 p-7"
            >
              {tab === "register" && (
                <Field label="Company Name" error={errors.company}>
                  <input
                    type="text"
                    value={form.company}
                    onChange={set("company")}
                    placeholder="Pacific Forward Ltd."
                    className={`${INPUT} ${errors.company ? "border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.08)]" : ""}`}
                  />
                </Field>
              )}

              <Field label="Work Email" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@company.com"
                  className={`${INPUT} ${errors.email ? "border-red-400" : ""}`}
                />
              </Field>

              <Field label="Password" error={errors.password}>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder={tab === "register" ? "At least 8 characters" : "Your password"}
                    className={`${INPUT} pr-10 ${errors.password ? "border-red-400" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors cursor-pointer"
                  >
                    {showPwd
                      ? <EyeOff className="w-4 h-4" strokeWidth={1.75} />
                      : <Eye    className="w-4 h-4" strokeWidth={1.75} />
                    }
                  </button>
                </div>
              </Field>

              {tab === "register" && (
                <Field label="Confirm Password" error={errors.confirm}>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={set("confirm")}
                    placeholder="Repeat password"
                    className={`${INPUT} ${errors.confirm ? "border-red-400" : ""}`}
                  />
                </Field>
              )}

              {tab === "signin" && (
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => setReset("form")}
                    className="text-[12px] text-navy font-medium hover:underline underline-offset-2 transition-all cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="mt-1 w-full py-3.5 rounded-xl bg-navy text-white text-[13.5px] font-semibold tracking-[0.01em]
                           transition-all duration-200 ease-in-out cursor-pointer
                           hover:bg-navy-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(12,26,62,0.26)]
                           active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
              >
                {tab === "signin" ? "Sign In" : "Create Account"}
              </button>

              {tab === "register" && (
                <p className="text-center text-[11.5px] text-ink-3 leading-relaxed">
                  By registering you agree to LBID's{" "}
                  <span className="text-navy font-medium cursor-pointer hover:underline">Terms of Service</span>
                  {" "}and{" "}
                  <span className="text-navy font-medium cursor-pointer hover:underline">Privacy Policy</span>.
                </p>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-[11.5px] text-ink-3 mt-5">
        LBID · B2B Sealed-Bid Logistics Platform · Hong Kong
      </p>
    </div>
  );
}
