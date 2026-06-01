
import { Link } from "react-router";
import { Crown, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#1a1d21] flex items-center justify-center px-6">
      <div className="text-center">
        <Crown className="w-16 h-16 text-[#3a3d42] mx-auto mb-6" />
        <h1 className="font-serif text-6xl font-bold gold-gradient-text mb-4">404</h1>
        <p className="text-[#8b8680] mb-8">
          This room doesn't exist in the mansion.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a] transition-colors"
        >
          <Home className="w-4 h-4" />
          Return Home
        </Link>
      </div>
    </div>
  );
}