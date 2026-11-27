import Hero from "@/components/landing/Hero";
import TopAnnouncement from "@/components/landing/TopAnnouncement";
import SiteBanner from "@/components/landing/SiteBanner";
import EventsSection from "@/components/landing/EventsSection";
import HowItWorks from "@/components/landing/HowItWorks";
import CategoryGrid from "@/components/landing/CategoryGrid";
import OrganizerCTA from "@/components/landing/OrganizerCTA";
import FAQ from "@/components/landing/FAQ";
import Testimonials from "@/components/landing/Testimonials";
import Reveal from "@/components/ui/Reveal";
import { getSiteAnnouncement } from "@/lib/announcement";
import { getPublicCategories } from "@/lib/categories";
import { getHotEvents } from "@/lib/events";
import { isSiteBannerKey } from "@/lib/site-banner";

export default async function HomePage() {
  /* The «داغ و برگزیده» grid is the database's nearest published events —
     same tagged cache the rest of the site invalidates on every mutation.
     The hero's topic picker reads the same visible category rows as the grid. */
  const [events, categories, announcement] = await Promise.all([
    getHotEvents(),
    getPublicCategories(),
    getSiteAnnouncement(),
  ]);

  return (
    <>
      {announcement.text.trim() && (
        <TopAnnouncement text={announcement.text.trim()} link={announcement.link} />
      )}
      <Reveal distance={16}>
        <Hero categories={categories} />
      </Reveal>
      {announcement.bannerKey && isSiteBannerKey(announcement.bannerKey) && (
        <SiteBanner
          bannerKey={announcement.bannerKey}
          link={announcement.bannerLink}
        />
      )}
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
        <FAQ />
      </Reveal>
      <Reveal>
        <Testimonials />
      </Reveal>
    </>
  );
}
