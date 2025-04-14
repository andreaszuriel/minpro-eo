// LoginPage.tsx - Main component
"use client";

import { useState } from "react";
import LeftLogin from "@/components/molecules/LeftLogin";
import RightLogin from "@/components/molecules/RightLogin";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Background and Content */}
      <LeftLogin />

      {/* Right Side Form Section */}
      <div className="w-full md:w-1/2 bg-slate-200 flex items-center justify-center p-4 min-h-[50vh] md:min-h-screen">
        <RightLogin activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}