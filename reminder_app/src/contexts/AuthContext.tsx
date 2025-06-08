import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from "react";
import { LoginPayload, User } from "../types/User";
import { getUserData, login as loginAPI } from "../services/authService";

interface AuthContextType {
  user: User | null;
  login: (payload: LoginPayload) => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setIsAuthenticated: (value: boolean) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

    const login = async (payload: LoginPayload) => {
        try {
            const data = await loginAPI(payload);
            localStorage.setItem("token", data?.token);
            const userData = await getUserData();
            localStorage.setItem("user", JSON.stringify(userData?.data));
            setUser(userData?.data);
            setIsAuthenticated(true);
            return userData;
        } catch (error) {
            throw error;
        }
    };



    const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    getUserData()
        .then((res) => {
          if (res?.data) {
            setUser(res.data);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        })
        .finally(() => {
          setIsLoading(false);
        });
  }, []);




  return (
      <AuthContext.Provider
          value={{
            user,
            login,
            logout,
            isAuthenticated,
            setUser,
            setIsAuthenticated,
            isLoading,
          }}
      >

      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
