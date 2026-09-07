import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, User as UserIcon, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-netflix-black" : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-12 py-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-netflix-red text-2xl md:text-3xl font-black tracking-tighter">
            NETFLIX
          </Link>
          <div className="hidden md:flex items-center gap-4 text-sm text-white/90">
            <Link to="/" className="hover:text-gray-300">Home</Link>
            <Link to="/?type=tv" className="hover:text-gray-300">Serie TV</Link>
            <Link to="/?type=movie" className="hover:text-gray-300">Film</Link>
            <Link to="/my-list" className="hover:text-gray-300">La mia Lista</Link>
          </div>
        </div>

        <div className="flex items-center gap-4 text-white">
          <form onSubmit={handleSearch} className="flex items-center">
            <div
              className={`flex items-center border border-white/50 rounded transition-all duration-300 ${
                showSearch ? "w-40 md:w-64 px-2" : "w-0 px-0 overflow-hidden border-transparent"
              }`}
            >
              <Search className="w-5 h-5" />
              <input
                type="text"
                placeholder="Titoli, persone, generi"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none px-2 py-1 text-sm w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="p-1"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          <Bell className="w-5 h-5 cursor-pointer hover:text-gray-300" />

          <div
            className="relative flex items-center gap-2 cursor-pointer"
            onMouseEnter={() => setShowMenu(true)}
            onMouseLeave={() => setShowMenu(false)}
          >
            <div className="w-8 h-8 bg-netflix-gray rounded flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            {showMenu && (
              <div className="absolute right-0 top-full pt-2 w-40">
                <div className="bg-netflix-black border border-white/10 rounded shadow-lg">
                  <div className="px-4 py-2 text-sm text-white/80 border-b border-white/10 truncate">
                    {user?.email}
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:underline text-left"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
