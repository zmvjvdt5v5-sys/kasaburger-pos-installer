import React, { createContext, useContext, useState, useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('kasaburger_token');
      const savedUser = localStorage.getItem('kasaburger_user');
      
      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // Dealer için farklı verify endpoint kullan
          const isDealer = parsedUser.role === 'dealer';
          const verifyUrl = isDealer 
            ? `${BACKEND_URL}/api/dealer-portal/me`
            : `${BACKEND_URL}/api/auth/me`;
          
          const response = await fetch(verifyUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            // Dealer için role bilgisini koru
            if (isDealer) {
              data.role = 'dealer';
              data.dealer_code = parsedUser.dealer_code;
              data.dealer_name = parsedUser.dealer_name || data.name;
            }
            setUser(data);
            localStorage.setItem('kasaburger_user', JSON.stringify(data));
          } else {
            // Token geçersiz ama dealer için farklı davran
            if (isDealer) {
              // Dealer token'ı geçersizse sadece loglayalım
              console.log('Dealer token verification failed, using saved data');
            } else {
              logout();
            }
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          // Hata olsa bile kayıtlı kullanıcıyı kullan
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'Login failed');
    }

    const { access_token, user: userData } = data;
    
    localStorage.setItem('kasaburger_token', access_token);
    localStorage.setItem('kasaburger_user', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  };

  const register = async (name, email, password) => {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role: 'admin' })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'Register failed');
    }

    const { access_token, user: userData } = data;
    
    localStorage.setItem('kasaburger_token', access_token);
    localStorage.setItem('kasaburger_user', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('kasaburger_token');
    localStorage.removeItem('kasaburger_user');
    localStorage.removeItem('dealer_token');
    localStorage.removeItem('dealer_info');
    setUser(null);
  };

  // Dealer login fonksiyonu
  const dealerLogin = (dealerData, token) => {
    const userData = {
      ...dealerData,
      role: 'dealer',
      dealer_code: dealerData.code,
      dealer_name: dealerData.name
    };
    
    localStorage.setItem('kasaburger_token', token);
    localStorage.setItem('kasaburger_user', JSON.stringify(userData));
    localStorage.setItem('dealer_token', token);
    localStorage.setItem('dealer_info', JSON.stringify(dealerData));
    setUser(userData);
    
    return userData;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, dealerLogin, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
