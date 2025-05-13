import WeatherWidget from './components/WeatherWidget';
import AboutBlurb from './components/AboutBlurb';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-items-center p-8 pb-20 gap-8 sm:p-20 w-full">
      <main className="flex flex-col gap-[32px] items-center max-w-4xl w-full">
        <h1 className="text-4xl">Daily Profile</h1>
        
        {/* Daily Profile Section */}
        <section className="w-full border-t border-b border-gray-200 py-6 my-4">
          
          {/* About Blurb */}
          <div className="mb-6">
            <AboutBlurb />
          </div>
          
          {/* Weather Widget */}
          <div className="">
            <WeatherWidget />
          </div>
        </section>
      </main>
      <footer className="text-center mt-4">
        <p>&copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
