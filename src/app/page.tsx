import DailyProfileOverlay from "@/app/components/DailyProfileOverlay";
import { SeascapeCanvas } from "@/components/seascape-canvas";

export const revalidate = 3600;

export default function Home() {
  return (
    <section className="home-seascape" aria-label="Jason Makes animated home">
      <SeascapeCanvas />
      <DailyProfileOverlay />
    </section>
  );
}
