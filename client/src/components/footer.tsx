import { Link } from "wouter";
import { SiInstagram, SiX, SiFacebook } from "react-icons/si";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h4 className="text-2xl font-bold text-spotify-green mb-4">TinyAmp</h4>
            <p className="text-muted-text text-sm mb-4">
              Connecting music lovers with the vibrant independent music scene in San Francisco.
            </p>
            <div className="flex space-x-3">
              <a 
                href="#" 
                className="text-muted-text hover:text-spotify-green transition-colors"
                aria-label="Instagram"
              >
                <SiInstagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-muted-text hover:text-spotify-green transition-colors"
                aria-label="Twitter"
              >
                <SiX className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-muted-text hover:text-spotify-green transition-colors"
                aria-label="Facebook"
              >
                <SiFacebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Discover */}
          <div>
            <h5 className="font-semibold mb-4 text-white">Discover</h5>
            <ul className="space-y-2 text-sm text-muted-text">
              <li>
                <Link href="/events">
                  <span className="hover:text-white transition-colors cursor-pointer">Tonight's Shows</span>
                </Link>
              </li>
              <li>
                <Link href="/events">
                  <span className="hover:text-white transition-colors cursor-pointer">This Weekend</span>
                </Link>
              </li>
              <li>
                <Link href="/artists">
                  <span className="hover:text-white transition-colors cursor-pointer">Featured Artists</span>
                </Link>
              </li>
              <li>
                <Link href="/artists">
                  <span className="hover:text-white transition-colors cursor-pointer">New Releases</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Venues */}
          <div>
            <h5 className="font-semibold mb-4 text-white">Venues</h5>
            <ul className="space-y-2 text-sm text-muted-text">
              <li>
                <Link href="/venues/the-independent">
                  <span className="hover:text-white transition-colors cursor-pointer">The Independent</span>
                </Link>
              </li>
              <li>
                <Link href="/venues/the-fillmore">
                  <span className="hover:text-white transition-colors cursor-pointer">The Fillmore</span>
                </Link>
              </li>
              <li>
                <Link href="/venues/cafe-du-nord">
                  <span className="hover:text-white transition-colors cursor-pointer">Cafe du Nord</span>
                </Link>
              </li>
              <li>
                <Link href="/venues">
                  <span className="hover:text-white transition-colors cursor-pointer">View All Venues</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h5 className="font-semibold mb-4 text-white">Support</h5>
            <ul className="space-y-2 text-sm text-muted-text">
              <li>
                <a href="#" className="hover:text-white transition-colors">Add Your Venue</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Artist Resources</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Contact Us</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">About</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-muted-text">
          <p>&copy; {currentYear} TinyAmp. Built with ❤️ for the San Francisco music community.</p>
        </div>
      </div>
    </footer>
  );
}
