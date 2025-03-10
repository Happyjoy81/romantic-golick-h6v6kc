// src/components/UIComponents.js
import React from "react";

// Card Components
export const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children }) => (
  <div className="p-6">{children}</div>
);

// Button Component
export const Button = ({
  children,
  onClick,
  disabled,
  className = "",
  variant,
}) => {
  const baseClasses =
    "py-2 px-3 md:px-4 rounded font-medium focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm md:text-base";
  const variantClasses =
    variant === "outline"
      ? "border border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 focus:ring-indigo-500"
      : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500";

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Input Component
export const Input = React.forwardRef(
  (
    {
      type = "text",
      placeholder,
      value,
      onChange,
      onKeyDown,
      onEnter,
      className = "",
      disabled,
    },
    ref
  ) => {
    const handleKeyDown = (e) => {
      if (onKeyDown) onKeyDown(e);
      if (e.key === "Enter" && onEnter) {
        e.preventDefault();
        onEnter();
      }
    };

    return (
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full px-2 md:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base ${className} ${
          disabled ? "bg-gray-100" : ""
        }`}
      />
    );
  }
);

Input.displayName = "Input";
