import EventsSection from "../events-section";
import { InteriorHero, SiteFooter, SiteNav } from "../site-chrome";
import { getPublishedEvents, getSiteContent } from "../site-data";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const [events, content] = await Promise.all([getPublishedEvents(), getSiteContent()]);
  const copy = content.pageCopy;
  return <main className="interior-page" data-body-font={content.bodyFont} data-heading-font={content.headingFont}><SiteNav active="events" /><InteriorHero kicker={copy["events.heroKicker"]} title={copy["events.heroTitle"]} intro={copy["events.heroIntro"]} /><EventsSection events={events} copy={copy} /><SiteFooter /></main>;
}
