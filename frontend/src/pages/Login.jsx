import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState(null);
  const { login, register, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (isRegister && password !== confirmPassword) {
      setLocalError("Le password non coincidono.");
      return;
    }

    const success = isRegister
      ? await register(email, password, firstName, lastName)
      : await login(email, password);
    if (success) {
      navigate("/");
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setLocalError(null);
    setFirstName("");
    setLastName("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-netflix-black flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-netflix-black/80 to-netflix-black z-0" />
      <div className="relative z-10 w-full max-w-md bg-black/75 p-8 rounded">
        <h1 className="text-3xl font-bold mb-6">
          {isRegister ? "Registrati" : "Accedi"}
        </h1>
        {(error || localError) && (
          <div className="bg-netflix-red/20 text-netflix-red text-sm p-3 mb-4 rounded">
            {localError || error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Nome"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 bg-netflix-gray text-white rounded outline-none focus:ring-2 focus:ring-netflix-light-gray"
                required
              />
              <input
                type="text"
                placeholder="Cognome"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-3 bg-netflix-gray text-white rounded outline-none focus:ring-2 focus:ring-netflix-light-gray"
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-netflix-gray text-white rounded outline-none focus:ring-2 focus:ring-netflix-light-gray"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 pr-10 bg-netflix-gray text-white rounded outline-none focus:ring-2 focus:ring-netflix-light-gray"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              aria-label={showPassword ? "Nascondi password" : "Mostra password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {isRegister && (
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Conferma password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 pr-10 bg-netflix-gray text-white rounded outline-none focus:ring-2 focus:ring-netflix-light-gray"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                aria-label={showConfirmPassword ? "Nascondi password" : "Mostra password"}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-netflix-red text-white font-bold rounded hover:bg-red-700 transition"
          >
            {isRegister ? "Registrati" : "Accedi"}
          </button>
        </form>
        <p className="mt-4 text-netflix-light-gray">
          {isRegister ? "Hai già un account? " : "Non hai un account? "}
          <button
            onClick={toggleMode}
            className="text-white hover:underline"
          >
            {isRegister ? "Accedi" : "Registrati"}
          </button>
        </p>
      </div>
    </div>
  );
}
