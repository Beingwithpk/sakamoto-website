import { Globe, Mail } from "lucide-react";

const FOOTER_LINKS = {
  Shop: ["New Arrivals", "Clothing", "Accessories", "Sale", "Gift Cards"],
  Company: ["About Us", "Careers", "Lookbook", "Stores", "Press"],
  Support: ["Shipping & Returns", "Size Guide", "FAQs", "Contact", "Care Guide"],
};

interface FooterProps {
  onLinkClick?: (target: string) => void;
}

export default function Footer({ onLinkClick }: FooterProps) {
  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-8 px-5 sm:px-10 md:px-14">
      <div className="max-w-7xl mx-auto">
        {/* Top row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-16">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <svg
                width="22"
                height="22"
                viewBox="0 0 256 256"
                fill="#ffffff"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
              </svg>
              <span className="text-white text-xl font-playfair italic">
                SAKAMOTO
              </span>
            </div>
            <p className="text-white/50 text-xs leading-relaxed mb-5 max-w-[200px]">
              Premium streetwear crafted in Tokyo. Where Japanese heritage meets
              modern design.
            </p>
            {/* Social */}
            <div className="flex gap-3">
              <a
                href="#"
                className="bg-white/10 hover:bg-[#e8702a] text-white rounded-full p-2.5 transition-all duration-300"
                aria-label="Instagram"
              >
                <Globe size={16} />
              </a>
              <a
                href="#"
                className="bg-white/10 hover:bg-[#e8702a] text-white rounded-full p-2.5 transition-all duration-300"
                aria-label="Email"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-white text-sm font-semibold mb-4 tracking-wide">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => {
                  let targetId = "";
                  if (link === "FAQs") targetId = "FAQs";
                  else if (link === "Contact") targetId = "Contact";
                  else if (link === "About Us") targetId = "About";
                  else if (link === "Stores") targetId = "Stores";
                  else if (link === "Size Guide") targetId = "SizeGuide";
                  else if (link === "Care Guide") targetId = "CareGuide";

                  return (
                    <li key={link}>
                      <a
                        href={targetId ? `#${targetId}` : "#"}
                        onClick={(e) => {
                          if (targetId && onLinkClick) {
                            e.preventDefault();
                            onLinkClick(targetId);
                          }
                        }}
                        className="text-white/50 text-xs hover:text-white transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © 2025 SAKAMOTO. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-white/30 text-xs hover:text-white/60 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-white/30 text-xs hover:text-white/60 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-white/30 text-xs hover:text-white/60 transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
