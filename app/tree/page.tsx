import { ArrowLeft, ExternalLink, Globe2, MapPin } from "lucide-react";
import Link from "next/link";
import { env } from "cloudflare:workers";
import { SiteNav } from "../site-chrome";
import { getSiteContent } from "../site-data";
import ContributionLink from "./contribution-link";
import ContributionReturnBar from "./contribution-return-bar";
import TreeTotal from "./tree-total";
import DedicationForm from "./dedication-form";

export const dynamic = "force-dynamic";

const restorationProjects = [
  {
    region: "Brazil · Amazon–Cerrado",
    title: "Restore Brazil’s Amazon–Cerrado corridor",
    text: "Robert’s work on tropical deforestation makes Brazil’s forests a meaningful part of this tribute. Black Jaguar Foundation restores native vegetation with local landowners in the Araguaia Biodiversity Corridor, spanning the Amazon rainforest and Cerrado.",
    provider: "Black Jaguar Foundation",
    copyId: "blackjaguar",
    route: "brazil-black-jaguar",
    donateLabel: "Plant trees with Black Jaguar",
    donateUrl: "https://www.black-jaguar.org/donate-tree/",
    geography: "Brazil · Amazon–Cerrado",
    note: "Choose a tree quantity at checkout and record that number here after payment. Guest payment is available. Trees support the Amazon–Cerrado corridor, not an Amazon-only site. A memorial certificate is not promised; your dedication is recorded on Robert’s website.",
  },
  {
    region: "Arizona",
    title: "Arizona forest restoration",
    text: "Arizona was Robert’s home during his University of Arizona years. A Living Tribute offers exact tree quantities for restoration within Arizona forests affected by wildfire, disease, and environmental stress.",
    provider: "A Living Tribute",
    copyId: "arizona",
    route: "arizona-living-tribute",
    donateLabel: "Plant trees in Arizona",
    donateUrl: "https://shop.alivingtribute.org/products/plant-a-tree-ecertificate",
    geography: "State-level · Arizona",
    note: "The tree count is exact; the memorial records these trees to Arizona, not to a specific forest unless the provider explicitly guarantees that forest at checkout.",
  },
  {
    region: "Georgia",
    title: "Georgia forest restoration",
    text: "Georgia became another home during Robert’s Georgia Tech years. This route supports exact-tree restoration within Georgia, including high-need public forest landscapes.",
    provider: "A Living Tribute",
    copyId: "georgia",
    route: "georgia-living-tribute",
    donateLabel: "Plant trees in Georgia",
    donateUrl: "https://shop.alivingtribute.org/products/plant-a-tree-ecertificate",
    geography: "State-level · Georgia",
    note: "Exact tree quantity; attributed to Georgia rather than to an individual forest unless explicitly guaranteed at checkout.",
  },
  {
    region: "Texas",
    title: "Texas landscape restoration",
    text: "Texas was Robert’s home during his UT Austin chapter. This route funds exact-tree restoration across Texas forests, floodplains, and wildfire-affected landscapes.",
    provider: "A Living Tribute",
    copyId: "texas",
    route: "texas-living-tribute",
    donateLabel: "Plant trees in Texas",
    donateUrl: "https://shop.alivingtribute.org/products/plant-a-tree-ecertificate",
    geography: "State-level · Texas",
    note: "Exact tree quantity; the memorial records Texas as the geographic attribution.",
  },
  {
    region: "Colorado",
    title: "Restoring Colorado’s Forests Fund",
    text: "Colorado was central to Robert’s long NCAR chapter. The Colorado State Forest Service provides seedlings for reforestation of Colorado lands damaged by wildfire and other major disturbances.",
    provider: "Colorado State Forest Service · Colorado State University",
    copyId: "colorado",
    route: "colorado-csfs",
    donateLabel: "Support Colorado reforestation",
    donateUrl: "https://give.colostate.edu/campaigns/45077/donations/new",
    sourceLabel: "Official program details",
    sourceUrl: "https://csfs.colostate.edu/seedling-tree-nursery/restoring-colorados-forests-fund-program/",
    geography: "State-level · Colorado",
    note: "The program publishes a $2-per-seedling conversion, allowing the memorial to record an exact funded-seedling quantity.",
  },
  {
    region: "California · Los Angeles connection",
    title: "California forest restoration",
    text: "Robert’s final professional chapter was at UCLA. This route supports exact-tree restoration within California forests affected by wildfire and other disturbances.",
    provider: "A Living Tribute",
    copyId: "california",
    route: "california-living-tribute",
    donateLabel: "Plant trees in California",
    donateUrl: "https://shop.alivingtribute.org/products/plant-a-tree-ecertificate",
    geography: "State-level · California",
    note: "Angeles National Forest appears among the provider’s California restoration landscapes, but the memorial attributes the gift only to California unless checkout explicitly guarantees Angeles.",
  },
  {
    region: "Massachusetts · Boston",
    title: "Grow Boston’s urban forest",
    text: "Massachusetts connects to Robert’s Harvard and MIT years. Tree Boston offers practical one-tree impact levels: $100 provides a free tree to a Boston community member to plant, while $500 or $1,000 supports planting one tree in a backyard or public/community space.",
    provider: "Tree Boston",
    copyId: "boston",
    route: "massachusetts-tree-boston",
    donateLabel: "Support one tree in Boston",
    donateUrl: "https://treeboston.org/support/online/",
    geography: "Boston · Massachusetts",
    note: "For Robert’s tree total, record 1 tree only when you choose one of Tree Boston’s listed one-tree options ($100, $500, or $1,000). Other donation amounts should not be converted into a tree count.",
    alternative: {
      route: "new-england-neff",
      label: "Support New England forest stewardship",
      url: "https://newenglandforestry.org/support/donate/",
      note: "Regional forest conservation/restoration gift; recorded separately because NEFF does not assign an exact tree quantity.",
    },
  },
  {
    region: "International option",
    title: "Outside the U.S. or having payment trouble?",
    text: "One Tree Planted is a simple fallback when another provider’s checkout is not practical. Choose the number of memorial trees directly; the trees are planted where restoration is needed most rather than assigned to a Robert-specific location.",
    provider: "One Tree Planted",
    copyId: "international",
    route: "global-one-tree-planted",
    donateLabel: "Continue with One Tree Planted",
    donateUrl: "https://onetreeplanted.org/products/gift-trees-in-memory",
    geography: "Where needed most",
    note: "Exact tree quantity; recorded in Robert’s lifetime total without assigning the trees to a specific landscape.",
  },
] as const;

export default async function TreeDedicationPage() {
  const content = await getSiteContent();
  const copy = content.pageCopy;
  let treeTotal = 0;
  let restorationGifts = 0;
  try {
    if (env.DB) {
      const [trees, restoration] = await Promise.all([
        env.DB.prepare("SELECT COALESCE(SUM(reported_tree_count), 0) AS total FROM tree_dedications WHERE status = 'approved' AND contribution_type = 'tree' AND payment_confirmed = 1").first<{ total: number }>(),
        env.DB.prepare("SELECT COUNT(*) AS total FROM tree_dedications WHERE status = 'approved' AND contribution_type = 'restoration' AND payment_confirmed = 1").first<{ total: number }>(),
      ]);
      treeTotal = Number(trees?.total ?? 0);
      restorationGifts = Number(restoration?.total ?? 0);
    }
  } catch {}

  return (
    <main className="tree-page tree-redesign" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
      <SiteNav active="tree" />

      <header id="top" className="tree-design-hero">
        <div className="tree-hero-copy"><h1>{copy["tree.design.title"]}</h1><h2>{copy["tree.design.subtitle"]}</h2><p>{copy["tree.design.intro"]}</p>
        <a className="tree-gold-button" href="#restoration-projects">{copy["tree.ui.heroButton"]}</a><a className="tree-record-shortcut" href="#record-tribute">{copy["tree.ui.recordShortcut"]}</a></div>
        <TreeTotal copy={copy} initialTotal={treeTotal} initialGifts={restorationGifts} />
      </header>
      <div className="tree-steps"><ol><li><span>1</span>{copy["tree.ui.stepChoose"]}</li><li><span>2</span>{copy["tree.ui.stepDonate"]}</li><li><span>3</span>{copy["tree.ui.stepRecord"]}</li></ol><p className="tree-payment-disclaimer">{copy["tree.design.paymentDisclaimer"]}</p></div>

      <section id="restoration-projects" className="tree-project tree-project-featured">
        <div className="tree-landscape tree-scene-minnesota" role="img" aria-label="Illustrated Minnesota forest and lake" />
        <div className="tree-featured-copy">
          <p className="section-kicker light">{copy["tree.featuredKicker"]}</p>
          <h2>{copy["tree.featuredTitle"]}</h2>
          <p className="tree-featured-intro">{copy["tree.ui.featuredIntro"]}</p>
          <p className="tree-featured-summary">{copy["tree.chippewaWhyText"]}</p>

        </div>
          <div className="tree-chippewa-routes">
            <article className="tree-route-card tree-route-primary">
              <h3>{copy["tree.arborProvider"]}</h3><span className="tree-route-location">{copy["tree.arborLocation"]}</span>
              <small className="tree-provider-note">{copy["tree.arborProviderNote"]}</small>
              <details className="tree-project-preview"><summary><span className="tree-preview-text tree-minnesota-description">{copy["tree.arborText"]}</span><span className="tree-expand-label">{copy["tree.ui.expand"]}</span></summary></details>
              <ContributionLink
                className="tree-project-donate"
                href="https://shop.arborday.org/tree-dedication/commemorative-trees-for-others?producttype=TIM"
                route="chippewa-arbor-day"
              >
                {copy["tree.arborButton"]}
              </ContributionLink>
            </article>

            <article className="tree-route-card tree-route-alternative">
              <h3>{copy["tree.minnesotaProvider"]}</h3><span className="tree-route-location">{copy["tree.minnesotaLocation"]}</span>
              <small className="tree-provider-note">{copy["tree.minnesotaProviderNote"]}</small>
              <details className="tree-project-preview"><summary><span className="tree-preview-text tree-minnesota-description">{copy["tree.minnesotaText"]}</span><span className="tree-expand-label">{copy["tree.ui.expand"]}</span></summary></details>
              <ContributionLink
                className="tree-project-secondary-action"
                href="https://shop.alivingtribute.org/products/plant-a-tree-ecertificate"
                route="minnesota-living-tribute"
              >
                {copy["tree.minnesotaButton"]}
              </ContributionLink>
            </article>
          </div>

        
      </section>

      <section className="tree-restoration-collection" aria-labelledby="tree-places-title">
        <div className="tree-section-heading tree-collection-heading">
          <p className="section-kicker">{copy["tree.projectsKicker"]}</p>
          <h2 id="tree-places-title">{copy["tree.projectsTitle"]}</h2>
          <p className="tree-payment-availability-note">{copy["tree.projectsPaymentNote"]}</p>
          <p>{copy["tree.ui.placesIntro"]}</p><details><summary>{copy["tree.ui.aboutProjects"]}</summary><p>{copy["tree.projectsIntro"]}</p></details>
        </div>

        <div className="tree-project-grid">
          {restorationProjects.map((project) => {
            const prefix = `tree.card.${project.copyId}`;
            const isInternational = project.copyId === "international";
            return <article className={`tree-project-card tree-card-${project.copyId}${isInternational ? " tree-project-card-international" : ""}`} key={project.route}>
              {!isInternational && <div className={`tree-landscape tree-scene-${project.copyId}`} role="img" aria-label={`Illustrated ${project.region} landscape`} />}
              <p className="tree-project-region">{copy[`${prefix}.region`] ?? project.region}</p>
              {isInternational && <Globe2 className="tree-international-card-icon" size={30} aria-hidden="true" />}

              <span className="tree-project-provider">{copy[`${prefix}.provider`] ?? project.provider}</span>
              <details className="tree-card-details tree-project-preview"><summary><span className="tree-preview-text">{copy[`${prefix}.text`] ?? project.text}</span><span className="tree-expand-label">{copy["tree.ui.expand"]}</span></summary><h3>{copy[`${prefix}.title`] ?? project.title}</h3><p>{copy[`${prefix}.text`] ?? project.text}</p>
              <span className="tree-geography-tag"><MapPin size={13} aria-hidden="true" /> {copy[`${prefix}.geography`] ?? project.geography}</span><small className="tree-card-note">{copy[`${prefix}.note`] ?? project.note}</small>
              {"alternative" in project && project.alternative && <div className="tree-card-alternative">
                <strong>{copy[`${prefix}.alternativeLabel`] || "Alternative"}</strong>
                <ContributionLink href={project.alternative.url} route={project.alternative.route}>{copy[`${prefix}.alternativeButton`] ?? project.alternative.label}</ContributionLink>
                <small>{copy[`${prefix}.alternativeNote`] ?? project.alternative.note}</small>
              </div>}
              </details>
              <div className="tree-card-links">
                <ContributionLink href={project.donateUrl} route={project.route}>{copy[`${prefix}.button`] ?? project.donateLabel}</ContributionLink>
                {"sourceUrl" in project && <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">{copy[`${prefix}.detailsButton`] ?? project.sourceLabel} <ExternalLink size={14} aria-hidden="true" /></a>}
              </div>

            </article>;
          })}
        </div>

      </section>

      <section id="record-tribute" className="tree-dedication-report" aria-labelledby="tree-dedication-title"><div className="tree-record-heading"><h2 id="tree-dedication-title">{copy["tree.ui.recordHeading"]}<br />{copy["tree.ui.recordHeadingLine2"]}</h2><p>{copy["tree.ui.recordIntro"]}</p></div><DedicationForm copy={copy} /></section>
      <section className="tree-faq" aria-labelledby="tree-faq-title">
        <h2 id="tree-faq-title">{copy["tree.ui.faqHeading"]}</h2>
        <details><summary>{copy["tree.ui.faqQuestion1"]}</summary><p>{copy["tree.ui.faqAnswer1"]}</p></details>
        <details><summary>{copy["tree.ui.faqQuestion6"]}</summary><p>{copy["tree.ui.faqAnswer6"]}</p></details>
        <details><summary>{copy["tree.ui.faqQuestion2"]}</summary><p>{copy["tree.ui.faqAnswer2"]}</p></details>
        <details><summary>{copy["tree.ui.faqQuestion3"]}</summary><p>{copy["tree.ui.faqAnswer3"]}</p></details>
        <details><summary>{copy["tree.ui.faqQuestion4"]}</summary><p>{copy["tree.ui.faqAnswer4"]}</p></details>
        <details><summary>{copy["tree.ui.faqQuestion5"]}</summary><p>{copy["tree.ui.faqAnswer5"]}</p></details>
      </section>

      <ContributionReturnBar copy={copy} />

      <footer className="site-footer">
        <div className="wordmark footer-mark"><span className="wordmark-mark">∞</span><span>{copy["global.footerName"]}</span></div>
        <p>{copy["global.footerText"]}</p>
        <div className="footer-links"><Link href="/"><ArrowLeft size={14} />{copy["tree.ui.footerHome"]}</Link><a href="#top">{copy["tree.ui.footerTop"]}</a></div>
      </footer>
    </main>
  );
}
