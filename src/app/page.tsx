import WeatherWidget from './components/WeatherWidget';
import AboutBlurb from './components/AboutBlurb';
import FeedlyArticlesWidget from './components/FeedlyArticlesWidget';
import SpotifyWidget from './components/SpotifyWidget';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-items-center p-8 pb-20 gap-8 sm:p-20 w-full">
      <main className="flex flex-col gap-[32px] items-center max-w-4xl w-full">
        
        {/* Daily Profile Section - Heading and Blurb */}
        <section className="w-full">
          {/* Heading and Blurb in flex layout */}
          <div className="flex flex-col md:flex-row md:items-center md:gap-6 mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold md:w-1/3 mb-4 md:mb-0">Daily Profile</h1>
            <div className="md:w-2/3">
              <AboutBlurb />
            </div>
          </div>
          
          {/* Border between blurb and widgets */}
          <hr className="border-t border-gray-200 mb-8" />
          
          {/* Weather and Spotify Widgets - side-by-side on desktop */}
          <div className="flex flex-col md:flex-row md:gap-6 mb-6">
            {/* Weather Widget */}
            <div className="w-full md:w-1/2 mb-6 md:mb-0">
              <WeatherWidget />
            </div>
            
            {/* Spotify Widget */}
            <div className="w-full md:w-1/2">
              <SpotifyWidget />
            </div>
          </div>
          
          {/* Feedly Articles Widget */}
          <div className="mt-6">
            <FeedlyArticlesWidget />
          </div>
        </section>
      </main>
      <footer className="text-center mt-4">
        <p>&copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
