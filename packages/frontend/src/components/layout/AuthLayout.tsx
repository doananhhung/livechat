import React from "react";

const AuthLayout = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) => {
  return (
    <div className="min-h-screen bg-muted flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card text-card-foreground shadow-md rounded-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-6">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
