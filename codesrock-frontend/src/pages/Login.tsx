import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import codesrockLogo from "@/assets/codesrock-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { authService, ApiError } from "@/services";
import { Eye, EyeOff } from "lucide-react";

type LoginMode = 'school' | 'email';

const PASSWORD_VISIBLE_TIMEOUT_MS = 3000;

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('school');

  // School login fields
  const [schoolCode, setSchoolCode] = useState("");
  const [username, setUsername] = useState("");

  // Email login fields
  const [email, setEmail] = useState("");

  // Shared fields
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const hidePasswordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-hide password after inactivity
  const resetHideTimer = useCallback(() => {
    if (hidePasswordTimer.current) {
      clearTimeout(hidePasswordTimer.current);
    }
    if (showPassword) {
      hidePasswordTimer.current = setTimeout(() => {
        setShowPassword(false);
      }, PASSWORD_VISIBLE_TIMEOUT_MS);
    }
  }, [showPassword]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hidePasswordTimer.current) {
        clearTimeout(hidePasswordTimer.current);
      }
    };
  }, [showPassword, resetHideTimer]);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // Reset the auto-hide timer on every keystroke while visible
    if (showPassword) {
      resetHideTimer();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;

      if (loginMode === 'school') {
        // School-based login
        if (!schoolCode || !username || !password) {
          toast.error("Please fill in all fields");
          setLoading(false);
          return;
        }

        response = await authService.loginWithSchool({
          schoolCode: schoolCode.toUpperCase(),
          username,
          password,
        });
      } else {
        // Email-based login
        if (!email || !password) {
          toast.error("Please fill in all fields");
          setLoading(false);
          return;
        }

        response = await authService.login({ email, password });
      }

      toast.success(`Welcome back, ${response.user.firstName}!`);

      // Role-based redirect
      const adminRoles = ['admin', 'school_admin', 'content_admin', 'super_admin'];
      if (adminRoles.includes(response.user.role)) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || "Login failed");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatSchoolCode = (value: string) => {
    // Remove any non-alphanumeric characters and uppercase
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    // Auto-add prefix if they're typing the code part
    if (cleaned.length > 0 && !cleaned.startsWith('SCH-')) {
      if (cleaned.startsWith('SCH')) {
        cleaned = 'SCH-' + cleaned.slice(3);
      } else {
        cleaned = 'SCH-' + cleaned;
      }
    }

    // Limit total length
    return cleaned.slice(0, 10);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8 animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center animate-bounce-subtle">
              <img src={codesrockLogo} alt="CodesRock Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-primary">
              CodesRock
            </h1>
            <p className="text-muted-foreground">Teacher Training Portal</p>
          </div>

          {/* Login Mode Toggle */}
          <div className="flex mb-6 bg-muted rounded-lg p-1">
            <button
              type="button"
              onClick={() => setLoginMode('school')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${loginMode === 'school'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              School Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${loginMode === 'email'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Email Login
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {loginMode === 'school' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="schoolCode">School ID</Label>
                  <Input
                    id="schoolCode"
                    type="text"
                    placeholder="SCH-XXXXXX"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(formatSchoolCode(e.target.value))}
                    className="font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the School ID provided by your administrator
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    required
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <Button variant="link" className="text-sm p-0 h-auto text-primary">
                Forgot password?
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {loginMode === 'school' ? (
              <p>Contact your school administrator for login credentials</p>
            ) : (
              <p>Use your registered email address</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
