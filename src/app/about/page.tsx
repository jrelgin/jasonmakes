import AboutBlurb from "@/app/components/AboutBlurb";
import FeedlyArticlesWidget from "@/app/components/FeedlyArticlesWidget";
import SpotifyWidget from "@/app/components/SpotifyWidget";
import WeatherWidget from "@/app/components/WeatherWidget";

export const metadata = {
  title: "About | Jason Makes",
  description:
    "About Jason Elgin, product leader and designer building tools for education, analytics, and creative work.",
};

export default function AboutPage() {
  return (
    <>
      <section className="container mx-auto flex min-h-[calc(100vh-7rem)] flex-col px-4">
        <div className="flex-grow" />

        <div className="max-w-6xl">
          <h1 className="text-2xl font-medium leading-relaxed text-gray-800 dark:text-gray-200 md:text-3xl lg:text-4xl">
            Head of Product at Standard Education
          </h1>
          <p className="font-body mt-2 text-xl font-normal leading-normal text-[var(--color-gray-500)] dark:text-gray-400 md:text-2xl lg:text-2xl">
            Previously product design and strategy at{" "}
            <a
              href="https://signallantern.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors hover:text-gray-800 dark:hover:text-gray-300"
            >
              Signal Lantern
            </a>{" "}
            and{" "}
            <a
              href="https://fullstory.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors hover:text-gray-800 dark:hover:text-gray-300"
            >
              FullStory
            </a>
          </p>
        </div>

        <div className="flex-grow" />

        <div className="ml-auto max-w-md pb-8">
          <AboutBlurb />
        </div>
      </section>

      <section className="w-full bg-gray-50 py-16 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-gray-100 md:text-4xl">
            Daily Profile
          </h2>

          <div className="mb-8 flex flex-col md:flex-row md:gap-6">
            <div className="mb-6 w-full md:mb-0 md:w-1/2">
              <WeatherWidget />
            </div>

            <div className="w-full md:w-1/2">
              <SpotifyWidget />
            </div>
          </div>

          <div className="mt-8">
            <FeedlyArticlesWidget />
          </div>
        </div>
      </section>

      <footer className="py-6 text-center">
        <p>&copy; {new Date().getFullYear()}</p>
      </footer>
    </>
  );
}
