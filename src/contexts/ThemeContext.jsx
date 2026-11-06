import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "cyberpunk";
    }
    return "cyberpunk";
  });

  const [fontSize, setFontSizeState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("fontSize") || "medium";
    }
    return "medium";
  });

  // Apply theme class and font size to document root
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove(
      "theme-cyberpunk",
      "theme-dark",
      "theme-neural",
      "theme-futuristic",
      "theme-light"
    );
    root.classList.add(`theme-${theme}`);
    localStorage.setItem("theme", theme);

    // Apply font size
    const fontSizeMap = {
      small: "14px",
      medium: "16px",
      large: "18px",
      xlarge: "20px",
    };
    root.style.fontSize = fontSizeMap[fontSize] || "16px";
    localStorage.setItem("fontSize", fontSize);
  }, [theme, fontSize]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    window.dispatchEvent(new CustomEvent("app:theme-changed", { detail: newTheme }));
  };

  const setFontSize = (newSize) => {
    setFontSizeState(newSize);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        fontSize,
        setFontSize,
        currentTheme: theme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "cyberpunk",
      currentTheme: "cyberpunk",
      setTheme: () => {},
      fontSize: "medium",
      setFontSize: () => {},
    };
  }
  return context;
};

export default ThemeContext;

