import React from 'react';
import { MapPin, Phone, Mail, Award, Calendar, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#000A1A] text-gray-400 border-t border-white/5 pt-12 pb-16 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1: Brand & Logo */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/Logo.png" alt="Srusti Crossfire" className="w-10 h-10 object-contain rounded-full bg-white p-0.5" />
              <div>
                <span className="text-xl font-black text-white tracking-wider">
                  CROSS<span className="text-orange-500">FIRE</span> 2026
                </span>
                <p className="text-[11px] text-gray-400">State-Level Talent Hunt</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-gray-400">
              The premier talent showdown for +2 Final Year students across Odisha, organized by Srusti Academy of Graduate Studies.
            </p>
            <div className="flex items-center gap-2 text-xs text-orange-400 font-semibold">
              <Calendar className="w-4 h-4" />
              <span>Event Date: November 15, 2026</span>
            </div>
          </div>

          {/* Column 2: Event Tracks */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-orange-500" />
              6 Competitive Tracks
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-white transition-colors cursor-pointer">• Brain Buzz (Quiz) - ₹13,500</li>
              <li className="hover:text-white transition-colors cursor-pointer">• Glam Walk (Ramp Walk) - ₹13,500</li>
              <li className="hover:text-white transition-colors cursor-pointer">• Shorts / Reels - ₹13,500</li>
              <li className="hover:text-white transition-colors cursor-pointer">• War of Words (Debate) - ₹13,500</li>
              <li className="hover:text-white transition-colors cursor-pointer">• Canvas Craft (Poster) - ₹13,500</li>
              <li className="hover:text-white transition-colors cursor-pointer">• Campus Quest (Treasure Hunt) - ₹13,500</li>
            </ul>
          </div>

          {/* Column 3: Venue & Campus */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-orange-500" />
              Venue & Coordinates
            </h4>
            <div className="text-xs space-y-2 leading-relaxed">
              <p className="text-white font-semibold">Srusti Academy of Graduate Studies</p>
              <p>Plot No. 38/1, Chandaka Industrial Estate, Near Infocity, Patia, Bhubaneswar, Odisha 751024</p>
              <a 
                href="https://maps.google.com" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-semibold mt-2"
              >
                <span>Google Maps Directions</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Column 4: Contact & Support */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-orange-500" />
              Coordinator Desk
            </h4>
            <div className="text-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                <span>+91 94370 00000 / 0674-2744444</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                <span>crossfire2026@srusti.edu.in</span>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-[11px] mt-3">
                <span className="text-amber-400 font-bold block mb-0.5">Eligibility Notice</span>
                Exclusively for +2 2nd Year (Class 12) students from CBSE, ICSE & CHSE councils. Max 2 events per student.
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© 2026 Srusti Academy of Graduate Studies. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-gray-300 cursor-pointer">Terms of Participation</span>
            <span>•</span>
            <span className="hover:text-gray-300 cursor-pointer">POSH & Safety Policy</span>
            <span>•</span>
            <span className="hover:text-gray-300 cursor-pointer">Supabase Auth Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
