import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: "square" | "wide" | "avatar";
}

export default function ImageUpload({ label, value, onChange, aspect = "square" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const aspectClasses = {
    square: "h-32 rounded-lg",
    wide: "h-40 rounded-lg",
    avatar: "w-24 h-24 rounded-full mx-auto",
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#8b8680]">{label}</label>

      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {value ? (
        <div
          onClick={handleClick}
          className={`relative group cursor-pointer overflow-hidden bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] hover:border-[#c9a96e] transition ${aspectClasses[aspect]} ${aspect === "avatar" ? "" : "w-full"}`}
        >
          <img
            src={value}
            alt={label}
            className={`w-full h-full object-cover ${aspect === "avatar" ? "rounded-full" : "rounded-lg"}`}
          />
          <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center ${aspect === "avatar" ? "rounded-full" : "rounded-lg"}`}>
            <Upload className="w-5 h-5 text-[#e8e6e3]" />
          </div>
          <button
            onClick={handleClear}
            className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#c94a4a] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-[#b33e3e] ${aspect === "avatar" ? "top-0 right-0" : ""}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={`relative cursor-pointer overflow-hidden bg-[#1a1d21] border border-dashed border-[rgba(201,169,110,0.15)] hover:border-[#c9a96e] transition flex flex-col items-center justify-center gap-2 ${aspectClasses[aspect]} ${aspect === "avatar" ? "" : "w-full"}`}
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Upload className="w-5 h-5 text-[#8b8680] group-hover:text-[#c9a96e] transition" />
              <span className="text-xs text-[#8b8680]">Click to upload</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
