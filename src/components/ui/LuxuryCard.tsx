"use client";

import Image from "next/image";
import Link from "next/link";

interface LuxuryCardProps {
  title: string;
  description: string;
  imageUrl: string;
  price?: string;
  location?: string;
  href: string;
  badge?: string;
}

export function LuxuryCard({ title, description, imageUrl, price, location, href, badge }: LuxuryCardProps) {
  return (
    <div
      className="animate-fade-up group relative rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-2xl hover:shadow-[#C49A2A]/20 transition-all duration-300"
    >
      <Link href={href} className="block w-full h-full">
        {/* Image Container with Zoom Effect */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
          
          {badge && (
            <div className="absolute top-4 right-4 bg-[#C49A2A] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              {badge}
            </div>
          )}
          
          {price && (
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-2xl font-bold font-serif text-[#C49A2A] drop-shadow-md">{price}</p>
              {location && <p className="text-sm text-gray-200 mt-1 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-white/50" /> {location}</p>}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-[#1B2D4F] mb-2 group-hover:text-[#C49A2A] transition-colors">{title}</h3>
          <p className="text-gray-500 text-sm line-clamp-2">{description}</p>
        </div>
        
        {/* Decorative Bottom Bar */}
        <div className="h-1 w-full bg-gray-100 group-hover:bg-[#C49A2A] transition-colors duration-300" />
      </Link>
    </div>
  );
}
