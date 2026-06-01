
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getDownloadsForUser, recordPageView } from "@/lib/localDb";
import { Download, File, ArrowLeft, Clock, Lock } from "lucide-react";
import { Link } from "react-router";

export default function Downloads() {
  const { user, isAuthenticated, isFanatic } = useAuth();
  const [downloads, setDownloads] = useState<ReturnType<typeof getDownloadsForUser>>([]);

  useEffect(() => {
    recordPageView("downloads");
    if (user?.id) setDownloads(getDownloadsForUser(user.id));
  }, [user]);

  if (!isAuthenticated || !isFanatic) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="text-center max-w-sm mx-auto">
          <Lock className="w-12 h-12 text-[#3a3d42] mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-[#e8e6e3] mb-2">Fanatic Only</h2>
          <p className="text-sm text-[#8b8680] mb-6">This feature is reserved for Fanatics. Become a Fanatic in your profile settings to access the download manager.</p>
          <Link to="/profile" className="inline-flex items-center gap-2 px-6 py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a] transition-colors">
            Go to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="max-w-[680px] mx-auto px-4">
        <div className="mb-8">
          <Link to="/profile" className="inline-flex items-center gap-1 text-xs text-[#8b8680] hover:text-[#c9a96e] mb-4 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to Profile
          </Link>
          <div className="flex items-center gap-3">
            <Download className="w-8 h-8 text-[#4caf93]" />
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#e8e6e3]">Download Manager</h1>
              <p className="text-sm text-[#8b8680]">All your downloaded content in one place.</p>
            </div>
          </div>
        </div>

        {downloads.length === 0 ? (
          <div className="text-center py-16 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)]">
            <Download className="w-12 h-12 text-[#3a3d42] mx-auto mb-4" />
            <p className="text-sm text-[#8b8680]">No downloads yet.</p>
            <Link to="/feed" className="text-xs text-[#c9a96e] hover:text-[#d4b87a] mt-2 inline-block">Browse the feed to download content</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {downloads.map((d) => (
              <div key={d.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.06)]">
                <div className="w-10 h-10 rounded-lg bg-[rgba(76,175,147,0.1)] flex items-center justify-center flex-shrink-0">
                  <File className="w-5 h-5 text-[#4caf93]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#e8e6e3] truncate">{d.postTitle}</p>
                  <p className="text-xs text-[#8b8680] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />{new Date(d.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <a href={d.downloadUrl} download className="flex-shrink-0 px-3 py-1.5 text-xs bg-[#4caf93] text-[#1a1d21] font-medium rounded-lg hover:bg-[#3d9e7f] transition-colors flex items-center gap-1">
                  <Download className="w-3 h-3" /> Re-download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}