import WeatherWidget from './components/WeatherWidget';
import AboutBlurb from './components/AboutBlurb';
import FeedlyArticlesWidget from './components/FeedlyArticlesWidget';
import SpotifyWidget from './components/SpotifyWidget';

export default function Home() {
  return (
    <>
      {/* Initial Viewport Section - Simple flex layout with centered heading */}
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 88px)' }}>
        {/* Spacer to push heading to vertical center */}
        <div className="flex-grow" />
        
        {/* Professional Heading at left side - vertically centered */}
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium text-gray-800 dark:text-gray-200 leading-relaxed max-w-6xl">
          Head of Product at Standard Education;
          Product Design & Strategic Direction at Signal Lantern
        </h1>
        
        {/* Spacer to push blurb to bottom */}
        <div className="flex-grow" />

        {/* Blurb positioned at bottom right */}
        <div className="ml-auto max-w-md pb-8">
          <AboutBlurb />
        </div>
      </div>
      
      {/* Below the fold - All widgets */}
      <section className="w-full bg-gray-50 dark:bg-gray-900 py-16 -mx-4 px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">Daily Profile</h2>
        
        {/* Weather and Spotify Widgets - side-by-side on desktop */}
        <div className="flex flex-col md:flex-row md:gap-6 mb-8">
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
        <div className="mt-8">
          <FeedlyArticlesWidget />
        </div>
      </section>
      
      <footer className="text-center py-6">
        <p>&copy; {new Date().getFullYear()}</p>
      </footer>
    </>
  );
}
