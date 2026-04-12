import React from "react";
import {
  MapPin,
  Clock,
  ArrowRight,
  Church,
  Navigation,
  Users,
  Heart,
  Music,
} from "lucide-react";

/* --------------------------------
   CONSTANTS
-------------------------------- */
const CHURCH_NAME = "Slavic Evangelical Church";
const SERVICE_SCHEDULE = [
  { time: "Sunday Service — 10:00 AM", desc: "Main Worship & Word", day: "Sun" },
  { time: "Friday Service — 7:00 PM", desc: "Prayer & Fellowship", day: "Fri" },
];
const ADDRESS = "16339 Mountain Rd, Montpelier, VA 23192";
const GOOGLE_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=16339+Mountain+Rd,+Montpelier,+VA+23192";

const HERO_IMAGE_SRC = "/churchBackground.png";

/* --------------------------------
   COMPONENTS
-------------------------------- */

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-gray-600 max-w-2xl mx-auto">{subtitle}</p>}
    </div>
  );
}

/* --------------------------------
   HERO SECTION
-------------------------------- */
function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      <img
        src={HERO_IMAGE_SRC}
        alt="Church Sanctuary"
        className="absolute inset-0 w-full h-full object-cover scale-105 animate-subtle-zoom"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-teal-900/40" />

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-100 text-xs font-medium backdrop-blur-md mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          Join us this Sunday at 10:00 AM
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tighter mb-6">
          Welcome to {CHURCH_NAME}
        </h1>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#location" className="w-full sm:w-auto px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2">
            Plan Your Visit <ArrowRight className="h-5 w-5" />
          </a>
          <a href="https://www.youtube.com/@slavicevangchurch/streams" className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-md border border-white/20 transition-all">
            Watch Online
          </a>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------
   SERVICE SCHEDULE
-------------------------------- */
function ServiceSchedule() {
  return (
    <section id="services" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <SectionHeading title="Service Times" subtitle="We invite you to join us for worship and fellowship throughout the week." />
        
        <div className="grid md:grid-cols-2 gap-8">
          {SERVICE_SCHEDULE.map((item) => (
            <div key={item.day} className="relative group bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-8 right-8 text-6xl font-black text-gray-50 group-hover:text-teal-50 transition-colors">
                {item.day}
              </div>
              <div className="relative z-10">
                <div className="h-12 w-12 bg-teal-600 rounded-xl flex items-center justify-center text-white mb-6">
                  <Clock size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{item.time}</h3>
                <p className="text-gray-500 font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------
   LOCATION
-------------------------------- */
function Location() {
  return (
    <section id="location" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-gray-900 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row">
          <div className="p-12 lg:p-16 lg:w-1/2 flex flex-col justify-center">
            <h2 className="text-4xl font-bold text-white mb-6">Visit Us</h2>
            <div className="flex items-start gap-4 mb-8 text-teal-100/80">
              <MapPin className="mt-1 text-teal-400" />
              <p className="text-lg leading-relaxed">{ADDRESS}</p>
            </div>
            <a 
              href={GOOGLE_MAPS_URL} 
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-teal-400 transition-colors"
            >
              <Navigation size={20} /> Get Directions
            </a>
          </div>
          <div className="h-[400px] lg:h-auto lg:w-1/2 bg-gray-200 grayscale hover:grayscale-0 transition-all duration-700">
             <iframe
              title="Church location map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.72477123!2d-77.728956!3d37.82281!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b140889c8949c3%3A0xc6a8a07c34d3d4b6!2s16339%20Mountain%20Rd%2C%20Montpelier%2C%20VA%2023192!5e0!3m2!1sen!2sus!4v1712800000000!5m2!1sen!2sus"
              className="w-full h-full border-0"
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------
   PAGE WRAPPER
-------------------------------- */
export default function Page() {
  return (
    <div className="antialiased selection:bg-teal-100 selection:text-teal-900">
      <main>
        <Hero />
        <ServiceSchedule />
        <Location />
      </main>
      
      <footer className="bg-gray-50 py-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Church className="text-teal-600" />
            <span className="font-bold text-gray-900">{CHURCH_NAME}</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} {CHURCH_NAME}. Built with faith and purpose.
          </p>
        </div>
      </footer>
    </div>
  );
}