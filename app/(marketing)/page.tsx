import Hero from "@/components/landing/Hero";
import EventsSection from "@/components/landing/EventsSection";
import HowItWorks from "@/components/landing/HowItWorks";
import CategoryGrid from "@/components/landing/CategoryGrid";
import OrganizerCTA from "@/components/landing/OrganizerCTA";
import Testimonials from "@/components/landing/Testimonials";
import Reveal from "@/components/ui/Reveal";
import { getHotEvents } from "@/lib/events";

export default async function HomePage() {
  /* The «داغ و برگزیده» grid is the database's nearest published events —
     same tagged cache the rest of the site invalidates on every mutation. */
  const events = await getHotEvents();

  return (
    <>
      <Reveal distance={16}>
        <Hero />
      </Reveal>
      <Reveal>
        <EventsSection events={events} />
      </Reveal>
      <Reveal>
        <HowItWorks />
      </Reveal>
      <Reveal>
        <CategoryGrid />
      </Reveal>
      <Reveal>
        <OrganizerCTA />
      </Reveal>
      <Reveal>
        <Testimonials />
      </Reveal>
    </>
  );
}
