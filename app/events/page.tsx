import EventsSection from "../events-section";
import { InteriorHero, SiteFooter, SiteNav } from "../site-chrome";
import { getPublishedEvents } from "../site-data";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getPublishedEvents();
  return <main className="interior-page"><SiteNav active="events" /><InteriorHero kicker="Gather together" title="Memorial events" intro="Services, gatherings, lectures, and scientific tributes honoring Robert will be shared here." /><EventsSection events={events} /><SiteFooter /></main>;
}
