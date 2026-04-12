import React from "react";
import {
  MapPin,
  Clock,
  ArrowRight,
  Church,
  Navigation,
} from "lucide-react";

/* --------------------------------
   CONSTANTS
-------------------------------- */
const CHURCH_NAME = "Slavic Evangelical Church";
const SERVICE_SCHEDULE = [
  "Sunday Service - 10am",
  "Friday Service - 7pm",
];
const ADDRESS = "16339 Mountain Rd, Montpelier, VA 23192";
const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=16339+Mountain+Rd,+Montpelier,+VA+23192";

/* Replace with your image in /public (e.g., /images/church.jpg) */
const HERO_IMAGE_SRC = "/churchBackground.png";

/* --------------------------------
   REUSABLE COMPONENTS
-------------------------------- */

type ButtonProps = {
  label: string;
  href: string;
  ariaLabel: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary";
};

function Button({
  label,
  href,
  ariaLabel,
  icon,
  variant = "primary",
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantStyles =
    variant === "primary"
      ? "bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-600"
      : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-100 focus:ring-gray-400";

  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className={`${baseStyles} ${variantStyles}`}
    >
      {label}
      {icon}
    </a>
  );
}

/* --------------------------------
   HEADER
-------------------------------- */
function Header() {
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Church className="h-6 w-6 text-teal-600" />
          <span className="font-semibold text-lg">{CHURCH_NAME}</span>
        </div>
      </div>
    </header>
  );
}

/* --------------------------------
   HERO SECTION (IMAGE BACKGROUND)
-------------------------------- */
function Hero() {
  return (
   <section className="relative min-h-[65vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <img
        src={HERO_IMAGE_SRC}
        alt="Church background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-4 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          Welcome to Slavic Evangelical Church
        </h1>
      </div>
    </section>
  );
}

/* --------------------------------
   SERVICE SCHEDULE
-------------------------------- */
function ServiceSchedule() {
  return (
    <section
      id="service"
      className="py-16 md:py-24 bg-white"
      aria-labelledby="service-heading"
    >
      <div className="max-w-6xl mx-auto px-4">
        <h2
          id="service-heading"
          className="text-2xl md:text-3xl font-semibold text-center text-gray-900"
        >
          Service Schedule
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {SERVICE_SCHEDULE.map((service) => (
            <div
              key={service}
              className="rounded-xl shadow-md p-8 bg-teal-600 text-white flex items-center gap-4 justify-center text-center"
            >
              <Clock className="h-6 w-6" />
              <span className="text-xl md:text-2xl font-bold">
                {service}
              </span>
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
    <section
      className="py-16 md:py-24 bg-gray-50"
      aria-labelledby="location-heading"
    >
      <div className="max-w-6xl mx-auto px-4">
        <h2
          id="location-heading"
          className="text-2xl md:text-3xl font-semibold text-center text-gray-900"
        >
          Location & Directions
        </h2>

        <div className="mt-10 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <MapPin className="h-6 w-6 text-teal-600 mt-1" />
              <p className="text-lg text-gray-700">{ADDRESS}</p>
            </div>

            <Button
              label="Open in Google Maps"
              href={GOOGLE_MAPS_URL}
              ariaLabel="Open church location in Google Maps"
              icon={<Navigation className="h-4 w-4" />}
            />
          </div>

          <div className="w-full h-80 rounded-xl overflow-hidden shadow-md">
            <iframe
              title="Church location map"
              src="https://www.google.com/maps?q=16339+Mountain+Rd,+Montpelier,+VA+23192&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------
   FOOTER
-------------------------------- */
function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Slavic Evangelical Church. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* --------------------------------
   PAGE
-------------------------------- */
export default function Page() {
  return (
    <>
      {/* <Header /> */}
      <main>
        <Hero />
        <ServiceSchedule />
        <Location />
      </main>
      <Footer />
    </>
  );
}