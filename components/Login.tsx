"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  Mail, 
  LockKeyhole, 
  ArrowRight, 
  ArrowLeft, 
  WalletCards, 
  Loader2, 
  User, 
  Target, 
  ReceiptText, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  KeyRound,
  Eye,
  EyeOff
} from "lucide-react";
import DatePicker from "./DatePicker";
import { trackEvent } from "@/lib/analytics";

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  
  // Real-time username & email availability state for signup
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameFeedback, setUsernameFeedback] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "taken" | "available" | "invalid">("idle");
  const [emailFeedback, setEmailFeedback] = useState("");

  const [step, setStep] = useState<"auth" | "onboarding_1" | "onboarding_2">("auth");
  const [details, setDetails] = useState({ 
    name: "", 
    age: "", 
    dob: "", 
    userType: "Professional", 
    income: "", 
    goal: "track", 
    currentSpend: "0", 
    monthlyInvestment: "0" 
  });

  useEffect(() => {
    // Check for any OAuth errors passed via URL
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get("error");
      if (errorParam) {
        setMessage(
          errorParam === "auth_failed" 
            ? "Authentication was interrupted or failed. Please try signing in again."
            : decodeURIComponent(errorParam)
        );
        setMessageType("error");
      }
    }

    // Only process Supabase user if actively returning from OAuth callback (URL has code or hash)
    const isOAuthReturn = typeof window !== "undefined" && (
      window.location.search.includes("code=") || 
      window.location.hash.includes("access_token")
    );

    if (isOAuthReturn) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const uName = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.username || user.email?.split('@')[0] || "User";
          localStorage.setItem("spendwise_active_user", uName);
          setDetails({ 
            name: uName,
            age: "",
            dob: "",
            userType: "Professional",
            income: "",
            goal: "track",
            currentSpend: "0",
            monthlyInvestment: "0"
          });
          setStep("onboarding_1");
        }
      });
    }
  }, []);

  // Helper to reliably check if a username is already taken in localStorage
  function checkLocalUsernameTaken(targetUsername: string): boolean {
    try {
      const usersStr = localStorage.getItem("spendwise_users");
      if (!usersStr) return false;
      const users = JSON.parse(usersStr);
      if (!users || typeof users !== "object") return false;

      const lowerTarget = targetUsername.trim().toLowerCase();

      return Object.entries(users).some(([key, val]: [string, any]) => {
        if (key.trim().toLowerCase() === lowerTarget) return true;
        if (val && typeof val === "object") {
          if (typeof val.username === "string" && val.username.trim().toLowerCase() === lowerTarget) {
            return true;
          }
        }
        return false;
      });
    } catch (e) {
      return false;
    }
  }

  // Helper to reliably check if an email is already taken in localStorage
  function checkLocalEmailTaken(targetEmail: string): boolean {
    try {
      const usersStr = localStorage.getItem("spendwise_users");
      if (!usersStr) return false;
      const users = JSON.parse(usersStr);
      if (!users || typeof users !== "object") return false;

      const lowerTarget = targetEmail.trim().toLowerCase();

      return Object.values(users).some((val: any) => {
        if (val && typeof val === "object") {
          if (typeof val.email === "string" && val.email.trim().toLowerCase() === lowerTarget) {
            return true;
          }
        }
        return false;
      });
    } catch (e) {
      return false;
    }
  }

  // Live debounced email availability check for signup
  useEffect(() => {
    if (mode !== "signup") {
      setEmailStatus("idle");
      setEmailFeedback("");
      return;
    }

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setEmailStatus("idle");
      setEmailFeedback("");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailStatus("invalid");
      setEmailFeedback("Please enter a valid email address.");
      return;
    }

    // Check localStorage immediately
    if (checkLocalEmailTaken(trimmed)) {
      setEmailStatus("taken");
      setEmailFeedback("Email is already has been used please enter a new email");
      return;
    }

    setEmailStatus("checking");
    setEmailFeedback("Checking email availability...");

    let isCurrent = true;
    const timer = setTimeout(async () => {
      try {
        if (checkLocalEmailTaken(trimmed)) {
          if (isCurrent) {
            setEmailStatus("taken");
            setEmailFeedback("Email is already has been used please enter a new email");
          }
          return;
        }

        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(trimmed)}`);
        const data = await res.json();

        if (!isCurrent) return;

        if (data.exists === true) {
          setEmailStatus("taken");
          setEmailFeedback("Email is already has been used please enter a new email");
        } else {
          setEmailStatus("available");
          setEmailFeedback("Email is available");
        }
      } catch (err) {
        if (!isCurrent) return;
        setEmailStatus("available");
        setEmailFeedback("Email is available");
      }
    }, 350);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [email, mode]);

  // Live debounced username availability check for signup with race-condition protection
  useEffect(() => {
    if (mode !== "signup") {
      setUsernameStatus("idle");
      setUsernameFeedback("");
      return;
    }

    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus("idle");
      setUsernameFeedback("");
      return;
    }

    if (trimmed.length < 3) {
      setUsernameStatus("invalid");
      setUsernameFeedback("Username must be at least 3 characters.");
      return;
    }

    if (trimmed.length > 25) {
      setUsernameStatus("invalid");
      setUsernameFeedback("Username cannot exceed 25 characters.");
      return;
    }

    const validRegex = /^[a-zA-Z0-9_]+$/;
    if (!validRegex.test(trimmed)) {
      setUsernameStatus("invalid");
      setUsernameFeedback("Only letters, numbers, and underscores are allowed.");
      return;
    }

    // Check localStorage immediately
    if (checkLocalUsernameTaken(trimmed)) {
      setUsernameStatus("taken");
      setUsernameFeedback("This username is already taken. Please choose another.");
      return;
    }

    setUsernameStatus("checking");
    setUsernameFeedback("Checking availability...");

    let isCurrent = true;
    const timer = setTimeout(async () => {
      try {
        if (checkLocalUsernameTaken(trimmed)) {
          if (isCurrent) {
            setUsernameStatus("taken");
            setUsernameFeedback("This username is already taken. Please choose another.");
          }
          return;
        }

        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(trimmed)}`);
        const data = await res.json();

        if (!isCurrent) return;

        if (data.available === false) {
          setUsernameStatus("taken");
          setUsernameFeedback(data.message || "This username is already taken. Please choose another.");
        } else {
          setUsernameStatus("available");
          setUsernameFeedback("Username is available");
        }
      } catch (err) {
        if (!isCurrent) return;
        setUsernameStatus("available");
        setUsernameFeedback("Username is available");
      }
    }, 300);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [username, mode]);

  async function guestLogin() {
    setIsGuestLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsGuestLoading(false);
    localStorage.setItem("spendwise_active_user", "Guest User");
    setDetails({
      name: "Guest User",
      age: "",
      dob: "",
      userType: "Professional",
      income: "",
      goal: "track",
      currentSpend: "0",
      monthlyInvestment: "0"
    });
    setStep("onboarding_1");
  }

  async function googleLogin() {
    setIsGuestLoading(true);
    setMessage("");
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL || "https://spendwise.kunaljha8990.workers.dev");
      const redirectTo = `${origin}/auth/callback?next=/dashboard`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          }
        }
      });
      if (error) {
        setMessage(error.message);
        setMessageType("error");
        setIsGuestLoading(false);
      }
    } catch (err: any) {
      setMessage(err?.message || "Failed to initiate Google authentication. Please try again.");
      setMessageType("error");
      setIsGuestLoading(false);
    }
  }

  async function handleForgotPassword() {
    setMessage("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setMessage("Please enter the email address associated with your account.");
      setMessageType("error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setMessage("Please enter a valid email address.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check if email exists in local accounts registry or Supabase DB
      const usersStr = localStorage.getItem("spendwise_users");
      const users = usersStr ? JSON.parse(usersStr) : {};
      const existsLocally = Object.values(users).some((d: any) => {
        return (d?.email || "").toLowerCase() === cleanEmail;
      });

      let existsInDb = false;
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(cleanEmail)}`);
        const data = await res.json();
        existsInDb = data.exists === true;
      } catch (e) {}

      // Call forgot-password API
      try {
        await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail })
        });
      } catch (e) {}

      // If linked with a user: send password reset email via Supabase
      if (existsLocally || existsInDb) {
        try {
          const supabase = createClient();
          const origin = typeof window !== "undefined" && window.location.origin
            ? window.location.origin
            : (process.env.NEXT_PUBLIC_APP_URL || "https://spendwise.kunaljha8990.workers.dev");
          await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: `${origin}/auth/callback?next=/dashboard`
          });
        } catch (e) {}
      }

      // Standard generic confirmation preventing account enumeration (TC-066, TC-075)
      setMessage("If an account exists with this email, password reset instructions have been sent.");
      setMessageType("success");
    } catch (err: any) {
      setMessage("If an account exists with this email, password reset instructions have been sent.");
      setMessageType("success");
    } finally {
      setIsLoading(false);
    }
  }

  // Save all user information to localStorage and Supabase database
  async function handleCompleteOnboarding() {
    setIsLoading(true);
    try {
      const activeUname = localStorage.getItem("spendwise_active_user") || username || details.name;
      const fullProfile = {
        ...details,
        name: details.name || activeUname,
        email: email || undefined,
        username: activeUname,
        profileCompleted: true
      };

      // 1. Persist onboarding profile in localStorage for the active user
      localStorage.setItem("spendwise_active_user", activeUname);
      localStorage.setItem("spendwise_onboarding", JSON.stringify(fullProfile));

      // 2. Persist complete profile into user account in spendwise_users
      const usersStr = localStorage.getItem("spendwise_users");
      const users = usersStr ? JSON.parse(usersStr) : {};
      if (activeUname) {
        users[activeUname] = {
          ...(users[activeUname] || {}),
          ...fullProfile,
          profileCompleted: true,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem("spendwise_users", JSON.stringify(users));
      }

      // 3. Save to Supabase user_profiles if authenticated with Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          await supabase.from("user_profiles").upsert({
            id: user.id,
            email: user.email || email,
            username: username || user.user_metadata?.username || details.name,
            name: details.name,
            age: details.age ? Number(details.age) : null,
            dob: details.dob || null,
            user_type: details.userType,
            financial_type: details.userType === "Student" ? "student" : "earning",
            monthly_income: details.income ? Number(details.income) : 0,
            monthly_pocket_money: details.userType === "Student" && details.income ? Number(details.income) : 0,
            goal: details.goal,
            current_spend: details.currentSpend ? Number(details.currentSpend) : 0,
            monthly_investment: details.monthlyInvestment ? Number(details.monthlyInvestment) : 0,
            updated_at: new Date().toISOString()
          });
        } catch (e) {}
      }

      // 4. Also call server API endpoint to save profile
      try {
        await fetch("/api/user/save-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullProfile)
        });
      } catch (e) {}
    } catch (err) {
      console.error("Error saving user information:", err);
    } finally {
      setIsLoading(false);
      window.location.href = "/dashboard";
    }
  }

  async function handleAuth() {
    setIsLoading(true);
    setMessage("");

    // Spam bot protection check
    if (honeypot) {
      setIsLoading(false);
      return;
    }

    const cleanEmail = email.trim();
    const cleanUsername = username.trim();
    const cleanName = fullName.trim() || cleanUsername;

    // 1. Validation for Signup
    if (mode === "signup") {
      if (!cleanName) {
        setMessage("Name is required.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      if (!cleanEmail) {
        setMessage("Email is required.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      if (!cleanUsername) {
        setMessage("Username is required.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      if (!password) {
        setMessage("Password is required.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      if (!termsAccepted) {
        setMessage("You must accept the terms and conditions to register.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      if (confirmPassword !== "" && password !== confirmPassword) {
        setMessage("Passwords do not match.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setMessage("Please enter a valid email address.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      if (cleanUsername.length < 3) {
        setMessage("Username must be at least 3 characters.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      if (cleanUsername.length > 25) {
        setMessage("Username cannot exceed 25 characters.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      if (cleanUsername.includes(" ")) {
        setMessage("Username cannot contain spaces.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      // Check email against local registry and status
      const isEmailTaken = checkLocalEmailTaken(cleanEmail) || emailStatus === "taken";
      if (isEmailTaken) {
        setEmailStatus("taken");
        setEmailFeedback("Email is already has been used please enter a new email");
        setMessage("Email is already has been used please enter a new email");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      // Check username against local registry and current status
      const isUsernameTaken = checkLocalUsernameTaken(cleanUsername) || usernameStatus === "taken";
      if (isUsernameTaken) {
        setUsernameStatus("taken");
        setUsernameFeedback("Username is already taken. Please choose another.");
        setMessage("Username is already taken. Please choose another.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      if (password.length < 8) {
        setMessage("Password must be at least 8 characters long.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      // Check server availability and register via API
      try {
        const signupRes = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            username: cleanUsername,
            password,
            confirmPassword,
            termsAccepted: true
          })
        });

        const signupData = await signupRes.json();
        if (!signupRes.ok) {
          setMessage(signupData.error || "Failed to create account.");
          setMessageType("error");
          setIsLoading(false);
          return;
        }
      } catch (e) {}

      // Try creating account in Supabase
      const supabase = createClient();
      try {
        const origin = typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_APP_URL || "https://spendwise.kunaljha8990.workers.dev");

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
            data: {
              username: cleanUsername,
              full_name: cleanName
            }
          }
        });

        if (authError) {
          if (authError.message.toLowerCase().includes("already registered") || authError.message.toLowerCase().includes("email")) {
            setMessage("Email is already has been used please enter a new email");
            setMessageType("error");
            setIsLoading(false);
            return;
          }
        } else if (authData?.user) {
          try {
            await supabase.from("user_profiles").upsert({
              user_id: authData.user.id,
              email: cleanEmail,
              username: cleanUsername,
              name: cleanName
            });
          } catch (e) {}
        }
      } catch (e) {}

      // Save to local registry so offline & client verification is instant and guaranteed
      const usersStr = localStorage.getItem("spendwise_users");
      const users = usersStr ? JSON.parse(usersStr) : {};
      users[cleanUsername] = {
        name: cleanName,
        email: cleanEmail,
        username: cleanUsername,
        password: password,
        profileCompleted: false,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("spendwise_users", JSON.stringify(users));

      // Clear any prior user's onboarding & financial data from localStorage
      localStorage.removeItem("spendwise_onboarding");
      localStorage.setItem("spendwise_active_user", cleanUsername);

      // Cleanly reset details state for this new user - NEVER merge with previous state
      setDetails({
        name: cleanName,
        age: "",
        dob: "",
        userType: "Professional",
        income: "",
        goal: "track",
        currentSpend: "0",
        monthlyInvestment: "0"
      });
      setStep("onboarding_1");
      setIsLoading(false);
    }

    // 2. Validation for Login: Accepts Email or Username + Password
    if (mode === "login") {
      const identifier = (cleanEmail || cleanUsername).trim();

      if (!identifier && !password) {
        setMessage("Email/username and password are required.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      if (!identifier) {
        setMessage("Email or username is required.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      if (!password) {
        setMessage("Password is required.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      // Call login API
      try {
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password, rememberMe })
        });
        const loginData = await loginRes.json();

        if (!loginRes.ok) {
          setMessage(loginData.error || "Invalid email/username or password.");
          setMessageType("error");
          setIsLoading(false);
          return;
        }

        if (loginData.success) {
          const activeUser = loginData.user?.username || identifier;
          localStorage.setItem("spendwise_active_user", activeUser);

          // Check if this specific user has already completed onboarding
          const usersStr = localStorage.getItem("spendwise_users");
          const users = usersStr ? JSON.parse(usersStr) : {};
          const userRec = users[activeUser] || Object.values(users).find((u: any) => 
            (u?.username || "").toLowerCase() === activeUser.toLowerCase() || 
            (u?.email || "").toLowerCase() === activeUser.toLowerCase()
          ) as any;

          if (userRec?.profileCompleted) {
            trackEvent("user_login", { username: activeUser });
            localStorage.setItem("spendwise_onboarding", JSON.stringify(userRec));
            window.location.href = "/dashboard";
          } else {
            localStorage.removeItem("spendwise_onboarding");
            setDetails({
              name: userRec?.name || activeUser,
              age: userRec?.age || "",
              dob: userRec?.dob || "",
              userType: userRec?.userType || "Professional",
              income: userRec?.income || "",
              goal: userRec?.goal || "track",
              currentSpend: userRec?.currentSpend || "0",
              monthlyInvestment: userRec?.monthlyInvestment || "0"
            });
            setStep("onboarding_1");
          }
          setIsLoading(false);
          return;
        }
      } catch (e) {}

      // Fallback check against local storage accounts
      const lowerIdent = identifier.toLowerCase();
      const localUsersStr = localStorage.getItem("spendwise_users");
      const localUsers = localUsersStr ? JSON.parse(localUsersStr) : {};
      const localEntries = Object.entries(localUsers) as [string, any][];

      const account = localEntries.find(([u, d]) => 
        (d?.email || "").toLowerCase() === lowerIdent || 
        (d?.username || u).toLowerCase() === lowerIdent
      );

      let isLocallyMatched = false;

      if (account) {
        const matchedAccount = account[1];
        if (matchedAccount?.password === password) {
          isLocallyMatched = true;
          const activeUser = matchedAccount?.username || account[0];
          localStorage.setItem("spendwise_active_user", activeUser);

          if (matchedAccount?.profileCompleted) {
            localStorage.setItem("spendwise_onboarding", JSON.stringify(matchedAccount));
            window.location.href = "/dashboard";
          } else {
            localStorage.removeItem("spendwise_onboarding");
            setDetails({
              name: matchedAccount?.name || activeUser,
              age: matchedAccount?.age || "",
              dob: matchedAccount?.dob || "",
              userType: matchedAccount?.userType || "Professional",
              income: matchedAccount?.income || "",
              goal: matchedAccount?.goal || "track",
              currentSpend: matchedAccount?.currentSpend || "0",
              monthlyInvestment: matchedAccount?.monthlyInvestment || "0"
            });
            setStep("onboarding_1");
          }
          setIsLoading(false);
          return;
        }
      }

      // Also verify with Supabase Auth if email format
      const supabase = createClient();
      let supabaseMatched = false;

      if (identifier.includes("@")) {
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: identifier,
            password: password
          });

          if (!authError && authData?.user) {
            supabaseMatched = true;
            const activeUser = authData.user.user_metadata?.username || identifier.split('@')[0];
            localStorage.setItem("spendwise_active_user", activeUser);
            
            const sbUsersStr = localStorage.getItem("spendwise_users");
            const sbUsers = sbUsersStr ? JSON.parse(sbUsersStr) : {};
            const userRec = sbUsers[activeUser];

            if (userRec?.profileCompleted) {
              localStorage.setItem("spendwise_onboarding", JSON.stringify(userRec));
              window.location.href = "/dashboard";
            } else {
              localStorage.removeItem("spendwise_onboarding");
              setDetails({
                name: authData.user.user_metadata?.full_name || activeUser,
                age: "",
                dob: "",
                userType: "Professional",
                income: "",
                goal: "track",
                currentSpend: "0",
                monthlyInvestment: "0"
              });
              setStep("onboarding_1");
            }
            setIsLoading(false);
            return;
          }
        } catch (e) {}
      }

      if (!isLocallyMatched && !supabaseMatched) {
        setMessage("Invalid email/username or password.");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      // Credentials matched!
      const activeUser = localStorage.getItem("spendwise_active_user") || cleanUsername || cleanEmail;
      const finalUsersStr = localStorage.getItem("spendwise_users");
      const finalUsers = finalUsersStr ? JSON.parse(finalUsersStr) : {};
      const userRec = activeUser ? (finalUsers[activeUser] || Object.values(finalUsers).find((u: any) =>
        (u?.username || "").toLowerCase() === activeUser.toLowerCase() ||
        (u?.email || "").toLowerCase() === activeUser.toLowerCase()
      )) : null;

      if (userRec?.profileCompleted) {
        localStorage.setItem("spendwise_onboarding", JSON.stringify(userRec));
        window.location.href = "/dashboard";
      } else {
        localStorage.removeItem("spendwise_onboarding");
        setDetails({
          name: userRec?.name || activeUser,
          age: userRec?.age || "",
          dob: userRec?.dob || "",
          userType: userRec?.userType || "Professional",
          income: userRec?.income || "",
          goal: userRec?.goal || "track",
          currentSpend: userRec?.currentSpend || "0",
          monthlyInvestment: userRec?.monthlyInvestment || "0"
        });
        setStep("onboarding_1");
      }
      setIsLoading(false);
    }
  }

  if (step === "onboarding_1") {
    return (
      <main className="grid-bg min-h-screen grid place-items-center px-6 py-12 bg-[#FAF6EE] text-[#14151A]">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black tracking-tight text-[#14151A]">Welcome to SPEND<span className="text-[#FF6B4A]">WISE</span></h1>
            <p className="mt-3 text-sm text-[#7A756D]">Let&apos;s set up your profile.</p>
          </div>
          
          <div className="rounded-3xl border border-[#E5DFD3] bg-[#FFFDF9] p-7 shadow-xl space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-[#7A756D]">Your Name</span>
              <div className="flex items-center rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-3 focus-within:border-[#FF6B4A] focus-within:bg-[#FFFDF9] transition-all">
                <User size={18} className="text-[#7A756D]" />
                <input className="w-full bg-transparent px-3 py-3.5 outline-none text-[#14151A] placeholder-[#7A756D]" placeholder="John Doe" value={details.name} onChange={e => setDetails({...details, name: e.target.value})} />
              </div>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-2 block text-sm text-[#7A756D]">Age</span>
                <div className="flex items-center rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-3 focus-within:border-[#FF6B4A] focus-within:bg-[#FFFDF9] transition-all">
                  <input type="number" className="w-full bg-transparent py-3.5 outline-none text-[#14151A] placeholder-[#7A756D]" placeholder="25" value={details.age} onChange={e => setDetails({...details, age: e.target.value})} />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[#7A756D]">Date of Birth</span>
                <DatePicker value={details.dob} onChange={(date) => setDetails({ ...details, dob: date })} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-2 block text-sm text-[#7A756D]">User Type</span>
                <div className="flex items-center rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-3 focus-within:border-[#FF6B4A] focus-within:bg-[#FFFDF9] transition-all">
                  <select className="w-full bg-transparent py-3.5 outline-none text-[#14151A]" value={details.userType} onChange={e => setDetails({...details, userType: e.target.value})}>
                    <option value="Professional" className="bg-[#FFFDF9] text-[#14151A]">Professional</option>
                    <option value="Student" className="bg-[#FFFDF9] text-[#14151A]">Student</option>
                  </select>
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[#7A756D]">{details.userType === "Student" ? "Pocket Money" : "Monthly Income"}</span>
                <div className="flex items-center rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-3 focus-within:border-[#FF6B4A] focus-within:bg-[#FFFDF9] transition-all">
                  <span className="text-[#7A756D]">₹</span>
                  <input type="number" className="w-full bg-transparent px-2 py-3.5 outline-none text-[#14151A] placeholder-[#7A756D]" placeholder="60000" value={details.income} onChange={e => setDetails({...details, income: e.target.value})} />
                </div>
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm text-[#7A756D]">Primary Goal</span>
              <div className="flex items-center rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-3 focus-within:border-[#FF6B4A] focus-within:bg-[#FFFDF9] transition-all">
                <Target size={18} className="text-[#7A756D]" />
                <select className="w-full bg-transparent px-3 py-3.5 outline-none text-[#14151A]" value={details.goal} onChange={e => setDetails({...details, goal: e.target.value})}>
                  <option value="save" className="bg-[#FFFDF9] text-[#14151A]">Save more money</option>
                  <option value="invest" className="bg-[#FFFDF9] text-[#14151A]">Start investing</option>
                  <option value="track" className="bg-[#FFFDF9] text-[#14151A]">Track daily expenses</option>
                </select>
              </div>
            </label>
            <button
              onClick={() => { setStep("onboarding_2"); }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B4A] to-[#FF5733] px-4 py-3.5 font-bold text-white hover:brightness-105 shadow-lg shadow-[#FF6B4A]/25 transition-all"
            >
              Next Step <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (step === "onboarding_2") {
    return (
      <main className="grid-bg min-h-screen grid place-items-center px-6 py-12 bg-[#FAF6EE] text-[#14151A]">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black tracking-tight text-[#14151A]">Financial Overview</h1>
            <p className="mt-3 text-sm text-[#7A756D]">Let&apos;s set your starting numbers.</p>
          </div>
          
          <div className="rounded-3xl border border-[#E5DFD3] bg-[#FFFDF9] p-7 shadow-xl space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-[#7A756D]">How much did you spend this month till today?</span>
              <div className="flex items-center rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-3 focus-within:border-[#FF6B4A] focus-within:bg-[#FFFDF9] transition-all">
                <ReceiptText size={18} className="text-[#7A756D]" />
                <span className="ml-3 text-[#7A756D]">₹</span>
                <input type="number" className="w-full bg-transparent px-2 py-3.5 outline-none text-[#14151A] placeholder-[#7A756D]" placeholder="0" value={details.currentSpend} onChange={e => setDetails({...details, currentSpend: e.target.value})} />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[#7A756D]">Monthly Investment</span>
              <div className="flex items-center rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-3 focus-within:border-[#FF6B4A] focus-within:bg-[#FFFDF9] transition-all">
                <TrendingUp size={18} className="text-[#7A756D]" />
                <span className="ml-3 text-[#7A756D]">₹</span>
                <input type="number" className="w-full bg-transparent px-2 py-3.5 outline-none text-[#14151A] placeholder-[#7A756D]" placeholder="0" value={details.monthlyInvestment} onChange={e => setDetails({...details, monthlyInvestment: e.target.value})} />
              </div>
            </label>
            <button
              onClick={handleCompleteOnboarding}
              disabled={isLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B4A] to-[#FF5733] px-4 py-3.5 font-bold text-white hover:brightness-105 shadow-lg shadow-[#FF6B4A]/25 disabled:opacity-50 transition-all"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  Go to Dashboard <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (mode === "forgot") {
    return (
      <main className="grid-bg min-h-screen grid place-items-center px-6 py-12 bg-[#FAF6EE] text-[#14151A]">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#FF6B4A]/15 text-[#FF6B4A] ring-1 ring-[#FF6B4A]/25">
              <KeyRound size={30} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#14151A]">Reset <span className="text-[#FF6B4A]">Password</span></h1>
            <p className="mt-3 text-sm text-[#7A756D]">Enter your email and we&apos;ll send you instructions to reset your password.</p>
          </div>

          <div className="rounded-3xl border border-[#E5DFD3] bg-[#FFFDF9] p-7 shadow-xl space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-[#7A756D]">Email Address</span>
              <div className="flex items-center rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-3 focus-within:border-[#FF6B4A] focus-within:bg-[#FFFDF9] transition-all">
                <Mail size={18} className="text-[#7A756D]" />
                <input
                  className="w-full bg-transparent px-3 py-3.5 outline-none text-[#14151A] placeholder-[#7A756D] text-sm"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </label>

            <button
              onClick={handleForgotPassword}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B4A] to-[#FF5733] px-4 py-3.5 font-bold text-white hover:brightness-105 disabled:opacity-50 transition-all shadow-lg shadow-[#FF6B4A]/25"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Send Reset Link"}
            </button>

            {message && (
              <div className={`mt-4 flex items-center gap-2 rounded-xl border px-3.5 py-3 text-sm ${
                messageType === "error"
                  ? "border-rose-500/20 bg-rose-50 text-rose-700"
                  : "border-emerald-500/20 bg-emerald-50 text-emerald-700"
              }`}>
                {messageType === "error" ? <AlertCircle size={16} className="shrink-0 text-rose-600" /> : <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />}
                <span>{message}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => { setMode("login"); setMessage(""); }}
              className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-[#7A756D] hover:text-[#14151A] transition-colors"
            >
              <ArrowLeft size={16} /> Back to Log in
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="grid-bg min-h-screen grid place-items-center px-6 py-12 bg-[#FAF6EE] text-[#14151A]">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#FF6B4A]/15 text-[#FF6B4A] ring-1 ring-[#FF6B4A]/25">
            <WalletCards size={30} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[#14151A]">SPEND<span className="text-[#FF6B4A]">WISE</span></h1>
          <p className="mt-3 text-sm text-[#7A756D]">Know where your money goes.</p>
        </div>

        <div className="rounded-3xl border border-[#E5DFD3] bg-[#FFFDF9] p-7 shadow-xl">
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#F4EFE6] border border-[#E5DFD3] p-1">
            {(["login", "signup"] as const).map((item) => (
              <button
                key={item}
                onClick={() => {
                  setMode(item);
                  setMessage("");
                }}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  mode === item ? "bg-[#FF6B4A] text-white shadow-md shadow-[#FF6B4A]/25" : "text-[#7A756D] hover:text-[#14151A]"
                }`}
              >
                {item === "login" ? "Log in" : "Create account"}
              </button>
            ))}
          </div>

          <button
            onClick={googleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] px-4 py-3.5 font-semibold text-[#14151A] hover:border-[#FF6B4A]/50 hover:bg-[#F7F2E7] transition-colors"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#14151A] text-xs font-black text-white">G</span>
            Continue with Google
          </button>

          <button
            onClick={guestLogin}
            disabled={isGuestLoading}
            className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] px-4 py-3.5 font-semibold text-[#45423E] hover:border-[#FF6B4A]/50 hover:bg-[#F7F2E7] disabled:opacity-50 transition-colors"
          >
            {isGuestLoading ? <Loader2 size={18} className="animate-spin" /> : "Continue as Guest"}
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-[#7A756D]">
            <div className="h-px flex-1 bg-[#E5DFD3]" />
            OR
            <div className="h-px flex-1 bg-[#E5DFD3]" />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="space-y-4">
            {/* Honeypot Spam Trap */}
            <div className="absolute opacity-0 -z-50 pointer-events-none h-0 w-0 overflow-hidden" aria-hidden="true">
              <input
                type="text"
                name="website_url_trap"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            {mode === "signup" && (
              <label className="block">
                <span className="mb-2 block text-sm text-[#7A756D]">Full Name</span>
                <div className="flex items-center rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-3 focus-within:border-[#FF6B4A] focus-within:bg-[#FFFDF9] transition-all">
                  <User size={18} className="text-[#7A756D]" />
                  <input
                    className="w-full bg-transparent px-3 py-3.5 outline-none text-[#14151A] placeholder-[#7A756D] text-sm"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (message) setMessage("");
                    }}
                    placeholder="John Doe"
                    autoComplete="name"
                    aria-label="Full Name"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm text-[#7A756D]">
                {mode === "login" ? "Email or Username" : "Email Address"}
              </span>
              <div className={`flex items-center rounded-xl border bg-[#F4EFE6] px-3 transition-colors ${
                mode === "signup" && emailStatus === "available"
                  ? "border-emerald-600 focus-within:border-emerald-600 focus-within:bg-[#FFFDF9]"
                  : mode === "signup" && (emailStatus === "taken" || emailStatus === "invalid")
                  ? "border-rose-600 focus-within:border-rose-600 focus-within:bg-[#FFFDF9]"
                  : "border-[#E5DFD3] focus-within:border-[#FF6B4A] focus-within:bg-[#FFFDF9]"
              }`}>
                <Mail size={18} className="text-[#7A756D]" />
                <input
                  className="w-full bg-transparent px-3 py-3.5 outline-none text-[#14151A] placeholder-[#7A756D] text-sm"
                  type={mode === "login" ? "text" : "email"}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (mode === "login") setUsername(e.target.value);
                    if (message) setMessage("");
                  }}
                  placeholder={mode === "login" ? "you@example.com or username" : "you@example.com"}
                  autoComplete={mode === "login" ? "username" : "email"}
                  aria-label={mode === "login" ? "Email or Username" : "Email Address"}
                />
                {mode === "signup" && emailStatus === "checking" && (
                  <Loader2 size={16} className="animate-spin text-[#FF6B4A] ml-2 shrink-0" />
                )}
                {mode === "signup" && emailStatus === "available" && (
                  <CheckCircle2 size={16} className="text-emerald-600 ml-2 shrink-0" />
                )}
                {mode === "signup" && emailStatus === "taken" && (
                  <XCircle size={16} className="text-rose-600 ml-2 shrink-0" />
                )}
              </div>

              {mode === "signup" && email.trim() !== "" && (
                <div className="mt-1.5 px-0.5">
                  {emailStatus === "checking" && (
                    <div className="flex items-center gap-1.5 text-xs text-[#FF6B4A]">
                      <Loader2 size={13} className="animate-spin shrink-0" />
                      <span>Checking email availability...</span>
                    </div>
                  )}
                  {emailStatus === "available" && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                      <CheckCircle2 size={13} className="shrink-0" />
                      <span>{emailFeedback}</span>
                    </div>
                  )}
                  {emailStatus === "taken" && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-700 font-medium">
                      <XCircle size={13} className="shrink-0" />
                      <span>{emailFeedback}</span>
                    </div>
                  )}
                  {emailStatus === "invalid" && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{emailFeedback}</span>
                    </div>
                  )}
                </div>
              )}
            </label>

            {mode === "signup" && (
              <label className="block">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-[#7A756D]">Username</span>
                  <span className="text-xs text-[#7A756D]">Unique identifier</span>
                </div>
                <div className={`flex items-center rounded-xl border bg-[#F4EFE6] px-3 transition-colors ${
                  usernameStatus === "available"
                    ? "border-emerald-600 focus-within:border-emerald-600 focus-within:bg-[#FFFDF9]"
                    : (usernameStatus === "taken" || usernameStatus === "invalid")
                    ? "border-rose-600 focus-within:border-rose-600 focus-within:bg-[#FFFDF9]"
                    : "border-[#E5DFD3] focus-within:border-[#FF6B4A] focus-within:bg-[#FFFDF9]"
                }`}>
                  <User size={18} className="text-[#7A756D]" />
                  <input
                    className="w-full bg-transparent px-3 py-3.5 outline-none text-[#14151A] placeholder-[#7A756D] text-sm"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (message) setMessage("");
                    }}
                    placeholder="Choose a unique username"
                    autoComplete="username"
                    aria-label="Username"
                  />
                  {usernameStatus === "checking" && (
                    <Loader2 size={16} className="animate-spin text-[#FF6B4A] ml-2 shrink-0" />
                  )}
                  {usernameStatus === "available" && (
                    <CheckCircle2 size={16} className="text-emerald-600 ml-2 shrink-0" />
                  )}
                  {usernameStatus === "taken" && (
                    <XCircle size={16} className="text-rose-600 ml-2 shrink-0" />
                  )}
                </div>

                {username.trim() !== "" && (
                  <div className="mt-1.5 px-0.5">
                    {usernameStatus === "checking" && (
                      <div className="flex items-center gap-1.5 text-xs text-[#FF6B4A]">
                        <Loader2 size={13} className="animate-spin shrink-0" />
                        <span>Checking availability...</span>
                      </div>
                    )}
                    {usernameStatus === "available" && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                        <CheckCircle2 size={13} className="shrink-0" />
                        <span>{usernameFeedback}</span>
                      </div>
                    )}
                    {usernameStatus === "taken" && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-700 font-medium">
                        <XCircle size={13} className="shrink-0" />
                        <span>{usernameFeedback}</span>
                      </div>
                    )}
                    {usernameStatus === "invalid" && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-700">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{usernameFeedback}</span>
                      </div>
                    )}
                  </div>
                )}
              </label>
            )}

            <label className="block">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-[#7A756D]">Password</span>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setMessage("");
                    }}
                    className="text-xs text-[#FF6B4A] hover:text-[#FF8566] font-semibold transition-colors hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="flex items-center rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-3 focus-within:border-[#FF6B4A] focus-within:bg-[#FFFDF9] transition-all">
                <LockKeyhole size={18} className="text-[#7A756D]" />
                <input
                  className="w-full bg-transparent px-3 py-3.5 outline-none text-[#14151A] placeholder-[#7A756D] text-sm"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (message) setMessage("");
                  }}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#7A756D] hover:text-[#14151A] p-1 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {mode === "signup" && (
              <label className="block">
                <span className="mb-2 block text-sm text-[#7A756D]">Confirm Password</span>
                <div className="flex items-center rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-3 focus-within:border-[#FF6B4A] focus-within:bg-[#FFFDF9] transition-all">
                  <LockKeyhole size={18} className="text-[#7A756D]" />
                  <input
                    className="w-full bg-transparent px-3 py-3.5 outline-none text-[#14151A] placeholder-[#7A756D] text-sm"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (message) setMessage("");
                    }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-label="Confirm Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-[#7A756D] hover:text-[#14151A] p-1 transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[#7A756D] hover:text-[#14151A]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#E5DFD3] bg-[#F4EFE6] text-[#FF6B4A] focus:ring-[#FF6B4A]/20"
                    aria-label="Remember me"
                  />
                  <span>Remember me for 30 days</span>
                </label>
              </div>
            )}

            {mode === "signup" && (
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#7A756D] hover:text-[#14151A]">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-[#E5DFD3] bg-[#F4EFE6] text-[#FF6B4A] focus:ring-[#FF6B4A]/20"
                    aria-label="Accept terms and conditions"
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" className="text-[#FF6B4A] underline hover:text-[#FF8566]">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" target="_blank" className="text-[#FF6B4A] underline hover:text-[#FF8566]">
                      Privacy Policy
                    </Link>.
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (mode === "signup" && (usernameStatus === "taken" || usernameStatus === "checking"))}
              className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B4A] via-[#FF5733] to-[#FF7A59] px-4 py-3.5 font-bold text-white shadow-lg shadow-[#FF6B4A]/25 hover:shadow-[#FF6B4A]/40 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
              aria-label={mode === "login" ? "Sign in to SpendWise" : "Create free account"}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In to SpendWise" : "Create Free Account"}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {message && (
            <div className={`mt-4 flex items-center gap-2 rounded-xl border px-3.5 py-3 text-sm ${
              messageType === "error"
                ? "border-rose-500/20 bg-rose-50 text-rose-700"
                : "border-emerald-500/20 bg-emerald-50 text-emerald-700"
            }`}>
              {messageType === "error" ? <AlertCircle size={16} className="shrink-0 text-rose-600" /> : <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />}
              <span>{message}</span>
            </div>
          )}
        </div>

        {/* Sleek Footer Navigation */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#7A756D]">
          <Link href="/terms" className="hover:text-[#FF6B4A] transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-[#FF6B4A] transition-colors">Privacy Policy</Link>
          <Link href="/disclaimer" className="hover:text-[#FF6B4A] transition-colors">Disclaimer</Link>
          <Link href="/contact" className="hover:text-[#FF6B4A] transition-colors">Help &amp; FAQ</Link>
          <Link href="/about" className="hover:text-[#FF6B4A] transition-colors">About</Link>
        </div>
      </div>
    </main>
  );
}
