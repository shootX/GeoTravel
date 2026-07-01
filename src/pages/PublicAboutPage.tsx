import { Link } from "react-router-dom";

export default function PublicAboutPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">About GeoTravel</h1>
        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
          We believe that travel should be personal, seamless, and unforgettable. Our mission is to help you explore the world your way, with smart planning and curated local experiences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
        <div className="rounded-3xl overflow-hidden shadow-xl">
          <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop" alt="Travelers" className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Story</h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Founded by a group of passionate explorers, GeoTravel was born out of the frustration of cookie-cutter itineraries. We wanted a tool that understood our unique preferences, time constraints, and travel styles.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Today, we combine advanced AI technology with deep local knowledge to craft personalized journeys that let you experience the true essence of every destination.
          </p>
        </div>
      </div>

      <div className="bg-teal-50 rounded-3xl p-8 md:p-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to start your journey?</h2>
        <p className="text-gray-600 mb-8">Join thousands of travelers who have discovered the world with GeoTravel.</p>
        <Link to="/" className="inline-block bg-[#0B4A46] hover:bg-[#083a37] text-white px-8 py-3.5 rounded-full font-semibold transition-colors">
          Plan Your Trip Now
        </Link>
      </div>
    </div>
  );
}
