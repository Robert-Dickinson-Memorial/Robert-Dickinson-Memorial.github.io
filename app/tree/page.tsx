import { ArrowLeft, ExternalLink, Sprout } from "lucide-react";
import Link from "next/link";
import { SiteNav } from "../site-chrome";
import { getSiteContent } from "../site-data";
import ContributionLink from "./contribution-link";
import ContributionReturnBar from "./contribution-return-bar";
import DedicationForm from "./dedication-form";

export const dynamic = "force-dynamic";

const restorationProjects = [
  {
    region: "Amazon rainforest",
    title: "Reforest the Amazon Basin",
    text: "Robert’s work on tropical deforestation makes the Amazon a scientifically meaningful part of this tribute. Tree-Nation’s Rioterra project funds individual trees for restoration of deforested areas in the Brazilian Amazon.",
    provider: "Tree-Nation · Rioterra",
    route: "amazon-tree-nation",
    donateLabel: "Plant trees in the Amazon",
    donateUrl: "https://tree-nation.com/projects/amazonia-rioterra-brazil/vqs",
    sourceLabel: "View project details",
    sourceUrl: "https://tree-nation.com/projects/amazonia-rioterra-brazil/vqs",
    note: "Exact-tree route: report the number of trees shown by the provider after successful payment.",
    alternative: {
      route: "amazon-conservation",
      label: "Support broader Amazon conservation",
      url: "https://www.amazonconservation.org/take-action/donate/",
      note: "Amazon Conservation gifts are recorded as restoration contributions because the standard donation does not assign an exact tree quantity.",
    },
  },
  {
    region: "Arizona",
    title: "Arizona forest restoration",
    text: "Arizona was Robert’s home during his University of Arizona years. A Living Tribute offers exact tree quantities for Arizona forest restoration, including projects in National Forest landscapes affected by wildfire and disease.",
    provider: "A Living Tribute",
    route: "arizona-living-tribute",
    donateLabel: "Plant trees in Arizona",
    donateUrl: "https://shop.alivingtribute.org/products/plant-a-tree-arizona",
    sourceLabel: "Arizona planting details",
    sourceUrl: "https://shop.alivingtribute.org/products/plant-a-tree-arizona",
    note: "Exact-tree route. Current and past planting locations depend on restoration need and provider availability.",
  },
  {
    region: "Georgia",
    title: "Georgia forest restoration",
    text: "Georgia became another home during Robert’s Georgia Tech years. A Living Tribute currently describes restoration in Georgia forests including the Chattahoochee–Oconee landscape and other high-need public lands.",
    provider: "A Living Tribute",
    route: "georgia-living-tribute",
    donateLabel: "Plant trees in Georgia",
    donateUrl: "https://shop.alivingtribute.org/products/plant-a-tree-georgia",
    sourceLabel: "Georgia planting details",
    sourceUrl: "https://shop.alivingtribute.org/products/plant-a-tree-georgia",
    note: "Exact-tree route: choose the number of trees at the provider’s checkout.",
  },
  {
    region: "Texas",
    title: "Texas landscape restoration",
    text: "Texas was Robert’s home during his UT Austin chapter. A Living Tribute supports exact-tree restoration in Texas, including Central and South Texas forests, floodplains, and wildfire-affected landscapes.",
    provider: "A Living Tribute",
    route: "texas-living-tribute",
    donateLabel: "Plant trees in Texas",
    donateUrl: "https://shop.alivingtribute.org/products/plant-a-tree-texas",
    sourceLabel: "Texas planting details",
    sourceUrl: "https://shop.alivingtribute.org/products/plant-a-tree-texas",
    note: "Exact-tree route. Planting areas follow active restoration projects within Texas.",
  },
  {
    region: "Colorado",
    title: "Restoring Colorado’s Forests Fund",
    text: "Colorado was central to Robert’s long NCAR chapter. The Colorado State Forest Service uses this donor-funded program to provide seedlings for reforestation of Colorado lands damaged by wildfire and other natural disasters.",
    provider: "Colorado State Forest Service · Colorado State University",
    route: "colorado-csfs",
    donateLabel: "Support Colorado reforestation",
    donateUrl: "https://give.colostate.edu/campaigns/45077/donations/new",
    sourceLabel: "Official program details",
    sourceUrl: "https://csfs.colostate.edu/seedling-tree-nursery/restoring-colorados-forests-fund-program/",
    note: "Exact conversion: the program states that every $2 donated funds one seedling.",
  },
  {
    region: "California · Los Angeles connection",
    title: "California forest restoration",
    text: "Robert’s final professional chapter was at UCLA. A Living Tribute lets contributors choose exact tree quantities for California restoration and currently lists Angeles National Forest among its California forest choices.",
    provider: "A Living Tribute",
    route: "california-living-tribute",
    donateLabel: "Plant trees in California",
    donateUrl: "https://shop.alivingtribute.org/products/plant-a-tree-california",
    sourceLabel: "California planting details",
    sourceUrl: "https://shop.alivingtribute.org/products/plant-a-tree-california",
    note: "Exact-tree route. Select Angeles National Forest when it is offered at checkout; provider availability can change.",
  },
  {
    region: "Massachusetts · Boston",
    title: "Charles River Esplanade tree stewardship",
    text: "Massachusetts connects to Robert’s Harvard and MIT years. The Esplanade Association, working with Massachusetts DCR, offers sponsorship of a new tree along the Charles River Esplanade with planting and long-term care.",
    provider: "Esplanade Association · Massachusetts DCR partner",
    route: "massachusetts-esplanade",
    donateLabel: "Plant a new tree in Boston",
    donateUrl: "https://esplanade.org/donate/sponsor-the-park/",
    sourceLabel: "Tree stewardship details",
    sourceUrl: "https://esplanade.org/donate/sponsor-the-park/",
    note: "Exact-tree route: a new-tree sponsorship represents one newly planted tree. This is an urban-canopy tribute rather than a forest reforestation project.",
    alternative: {
      route: "new-england-neff",
      label: "Support New England forest stewardship",
      url: "https://newenglandforestry.org/support/donate/",
      note: "NEFF gifts support regional forest conservation and stewardship and are recorded as restoration gifts, not as an exact tree quantity.",
    },
  },
] as const;

export default async function TreeDedicationPage() {
  const content = await getSiteContent();
  const copy = content.pageCopy;

  return (
    <main className="tree-page" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
      <SiteNav active="tree" />
      <header id="top" className="tree-page-intro">
        <h1>{copy["tree.pageTitle"]}</h1>
        <p>{copy["tree.pageIntro"]}</p>
        <small>{copy["tree.v3HeroNote"]}</small>
        <div className="tree-page-intro-actions">
          <a className="tree-intro-primary" href="#restoration-projects">Choose a planting location ↓</a>
          <a className="tree-intro-record" href="#record-tribute">Already contributed? Record your trees →</a>
        </div>
      </header>

      <section id="restoration-projects" className="tree-project tree-project-featured">
        <div>
          <p className="section-kicker light">Featured tribute · Minnesota</p>
          <h2>Chippewa National Forest</h2>
          <p>{content.treeTribute}</p>
          <p>{content.treeDetail}</p>

          <div className="tree-project-actions tree-project-actions-stacked">
            <ContributionLink
              className="tree-project-donate"
              href="https://shop.arborday.org/tree-dedication/commemorative-trees-for-others?producttype=TIM"
              route="chippewa-arbor-day"
            >
              Dedicate trees through Arbor Day Foundation
            </ContributionLink>
            <ContributionLink
              className="tree-project-secondary-action"
              href="https://shop.alivingtribute.org/products/plant-a-tree-national-forest"
              route="chippewa-living-tribute"
            >
              Plant a smaller grove through A Living Tribute
            </ContributionLink>
          </div>

          <div className="tree-featured-options">
            <p><strong>Arbor Day Foundation:</strong> choose an exact tree quantity and select Chippewa National Forest. Its direct commemorative checkout currently has a 10-tree minimum for custom quantities.</p>
            <p><strong>A Living Tribute:</strong> useful for smaller gifts; select Minnesota → Chippewa National Forest and the number of trees. Planting preferences remain subject to the provider’s active project availability.</p>
            <p><strong>Official Forest Service fallback:</strong> <ContributionLink href="https://plantatree.fs.usda.gov/tree-donation" route="chippewa-usda">USDA Plant-A-Tree</ContributionLink>. Because USDA does not assign an exact number of trees to an individual gift, we preserve it as a restoration contribution rather than estimate a tree count.</p>
          </div>
        </div>
        <div className="tree-project-note">
          <strong>{copy["tree.v3ChippewaNoteTitle"]}</strong>
          <p>{copy["tree.v3ChippewaNoteText"]}</p>
        </div>
      </section>

      <section className="tree-restoration-collection" aria-labelledby="tree-places-title">
        <div className="tree-section-heading tree-collection-heading">
          <p className="section-kicker">Other landscapes</p>
          <h2 id="tree-places-title">Places that shaped his life and science</h2>
          <p>{copy["tree.v3CollectionIntro"]}</p>
        </div>

        <div className="tree-project-grid">
          {restorationProjects.map((project) => (
            <article className="tree-project-card" key={project.region}>
              <p className="tree-project-region">{project.region}</p>
              <h3>{project.title}</h3>
              <p>{project.text}</p>
              <span className="tree-project-provider">{project.provider}</span>
              <div className="tree-card-links">
                <ContributionLink href={project.donateUrl} route={project.route}>{project.donateLabel}</ContributionLink>
                <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">{project.sourceLabel} <ExternalLink size={14} aria-hidden="true" /></a>
              </div>
              <small className="tree-card-note">{project.note}</small>
              {"alternative" in project && project.alternative && <div className="tree-card-alternative">
                <strong>Alternative</strong>
                <ContributionLink href={project.alternative.url} route={project.alternative.route}>{project.alternative.label}</ContributionLink>
                <small>{project.alternative.note}</small>
              </div>}
            </article>
          ))}
        </div>

        <p className="tree-projects-footnote"><strong>How the memorial counts:</strong> {copy["tree.v3CollectionNote"]}</p>
      </section>

      <section className="tree-faq" aria-labelledby="tree-faq-title">
        <div className="tree-section-heading"><p className="section-kicker">Questions</p><h2 id="tree-faq-title">Before you give</h2></div>
        <details open><summary>{copy["tree.v3Faq1Q"]}</summary><p>{copy["tree.v3Faq1A"]}</p></details>
        <details><summary>{copy["tree.v3Faq2Q"]}</summary><p>{copy["tree.v3Faq2A"]}</p></details>
        <details><summary>{copy["tree.v3Faq3Q"]}</summary><p>{copy["tree.v3Faq3A"]}</p></details>
        <details><summary>{copy["tree.v3Faq4Q"]}</summary><p>{copy["tree.v3Faq4A"]}</p></details>
      </section>

      <section id="record-tribute" className="tree-dedication-report" aria-labelledby="tree-dedication-title">
        <p className="section-kicker">A growing tribute</p>
        <h2 id="tree-dedication-title">Already completed your contribution?</h2>
        <p>{copy["tree.v3ReportIntro"]}</p>
        <DedicationForm />
      </section>

      <section className="tree-final-cta">
        <Sprout size={42} aria-hidden="true" />
        <h2>Choose the landscape that holds meaning.</h2>
        <p>Minnesota comes first in this tribute, while every other project carries forward another place or ecosystem connected to Robert’s life and science.</p>
        <a className="tree-primary-action" href="#restoration-projects">Explore the projects again <span aria-hidden="true">↑</span></a>
      </section>

      <ContributionReturnBar />

      <footer className="site-footer">
        <div className="wordmark footer-mark"><span className="wordmark-mark">∞</span><span>{copy["global.footerName"]}</span></div>
        <p>{copy["global.footerText"]}</p>
        <div className="footer-links"><Link href="/"><ArrowLeft size={14} /> Return to memorial</Link><a href="#top">Return to top ↑</a></div>
      </footer>
    </main>
  );
}
