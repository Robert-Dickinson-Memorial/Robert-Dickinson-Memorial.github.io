import { ArrowLeft, ExternalLink, Globe2, MapPin, Sprout } from "lucide-react";
import Link from "next/link";
import { env } from "cloudflare:workers";
import { SiteNav } from "../site-chrome";
import { getSiteContent } from "../site-data";
import ContributionLink from "./contribution-link";
import ContributionReturnBar from "./contribution-return-bar";
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
    <main className="tree-page" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
      <SiteNav active="tree" />

      <header id="top" className="tree-page-intro">
        <h1>{copy["tree.pageTitle"]}</h1>
        <p>{copy["tree.pageIntro"]}</p>
        <small>Payments are completed on each provider’s official website. The memorial never receives card numbers, CVVs, bank details, or payment credentials.</small>
        <div className="tree-live-total"><span><strong>{treeTotal}</strong> {treeTotal === 1 ? "tree dedicated" : "trees dedicated"} in Robert’s memory{restorationGifts > 0 ? ` · ${restorationGifts} additional restoration ${restorationGifts === 1 ? "gift" : "gifts"}` : ""}</span></div>
        <div className="tree-page-intro-actions">
          <a className="tree-intro-primary" href="#restoration-projects">Choose a planting location ↓</a>
          <a className="tree-intro-record" href="#record-tribute">Already contributed? Record your trees →</a>
        </div>
      </header>

      <section id="restoration-projects" className="tree-project tree-project-featured">
        <div>
          <p className="section-kicker light">{copy["tree.featuredKicker"]}</p>
          <h2>{copy["tree.featuredTitle"]}</h2>
          <p>{content.treeTribute}</p>
          <p>{content.treeDetail}</p>

          <div className="tree-chippewa-routes">
            <article className="tree-route-card tree-route-primary">
              <span className="tree-route-location">{copy["tree.arborLocation"]}</span>
              <h3>{copy["tree.arborProvider"]}</h3>
              <small className="tree-provider-note">{copy["tree.arborProviderNote"]}</small>
              <p>{copy["tree.arborText"]}</p>
              <ContributionLink
                className="tree-project-donate"
                href="https://shop.arborday.org/tree-dedication/commemorative-trees-for-others?producttype=TIM"
                route="chippewa-arbor-day"
              >
                {copy["tree.arborButton"]}
              </ContributionLink>
            </article>

            <article className="tree-route-card tree-route-alternative">
              <span className="tree-route-location">{copy["tree.minnesotaLocation"]}</span>
              <h3>{copy["tree.minnesotaProvider"]}</h3>
              <small className="tree-provider-note">{copy["tree.minnesotaProviderNote"]}</small>
              <p>{copy["tree.minnesotaText"]}</p>
              <ContributionLink
                className="tree-project-secondary-action"
                href="https://shop.alivingtribute.org/products/plant-a-tree-ecertificate"
                route="minnesota-living-tribute"
              >
                {copy["tree.minnesotaButton"]}
              </ContributionLink>
            </article>
          </div>

        </div>

        <div className="tree-project-note">
          <strong>{copy["tree.chippewaWhyTitle"]}</strong>
          <p>{copy["tree.chippewaWhyText"]}</p>
        </div>
      </section>

      <section className="tree-restoration-collection" aria-labelledby="tree-places-title">
        <div className="tree-section-heading tree-collection-heading">
          <p className="section-kicker">{copy["tree.projectsKicker"]}</p>
          <h2 id="tree-places-title">{copy["tree.projectsTitle"]}</h2>
          <p className="tree-payment-availability-note">{copy["tree.projectsPaymentNote"]}</p>
          <p>{copy["tree.projectsIntro"]}</p>
        </div>

        <div className="tree-project-grid">
          {restorationProjects.map((project) => {
            const prefix = `tree.card.${project.copyId}`;
            const isInternational = project.copyId === "international";
            return <article className={`tree-project-card${isInternational ? " tree-project-card-international" : ""}`} key={project.route}>
              <p className="tree-project-region">{copy[`${prefix}.region`] || project.region}</p>
              {isInternational && <Globe2 className="tree-international-card-icon" size={30} aria-hidden="true" />}
              <h3>{copy[`${prefix}.title`] || project.title}</h3>
              <p>{copy[`${prefix}.text`] || project.text}</p>
              <span className="tree-project-provider">{copy[`${prefix}.provider`] || project.provider}</span>
              <span className="tree-geography-tag"><MapPin size={13} aria-hidden="true" /> {copy[`${prefix}.geography`] || project.geography}</span>
              <div className="tree-card-links">
                <ContributionLink href={project.donateUrl} route={project.route}>{copy[`${prefix}.button`] || project.donateLabel}</ContributionLink>
                {"sourceUrl" in project && <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">{copy[`${prefix}.detailsButton`] || project.sourceLabel} <ExternalLink size={14} aria-hidden="true" /></a>}
              </div>
              <small className="tree-card-note">{copy[`${prefix}.note`] || project.note}</small>
              {"alternative" in project && project.alternative && <div className="tree-card-alternative">
                <strong>{copy[`${prefix}.alternativeLabel`] || "Alternative"}</strong>
                <ContributionLink href={project.alternative.url} route={project.alternative.route}>{copy[`${prefix}.alternativeButton`] || project.alternative.label}</ContributionLink>
                <small>{copy[`${prefix}.alternativeNote`] || project.alternative.note}</small>
              </div>}
            </article>;
          })}
        </div>

      </section>

      <section className="tree-faq" aria-labelledby="tree-faq-title">
        <div className="tree-section-heading"><p className="section-kicker">Questions</p><h2 id="tree-faq-title">Before you give</h2></div>
        <details open><summary>Does the memorial website handle my payment?</summary><p>No. Payment takes place entirely on the selected provider’s website. The memorial stores only the contribution record you report afterward and never receives your card or banking credentials.</p></details>
        <details><summary>How are tree totals and locations counted?</summary><p>After successful payment, report the exact tree quantity shown by the provider. We record both that quantity and the geographic level the provider actually guarantees: exact forest/project, state/region, or where needed most.</p></details>
        <details><summary>What if the provider does not state an exact number of trees?</summary><p>The gift is preserved as a restoration contribution but is not converted into an estimated number of trees.</p></details>
        <details><summary>What if the provider I chose will not accept my international payment?</summary><p>Use the universal One Tree Planted route or another accessible exact-tree option. The trees still count in Robert’s lifetime total; they are simply attributed to the location level the provider can honestly support.</p></details>
      </section>

      <section id="record-tribute" className="tree-dedication-report" aria-labelledby="tree-dedication-title">
        <p className="section-kicker">A growing tribute</p>
        <h2 id="tree-dedication-title">Already completed your contribution?</h2>
        <p>After payment succeeds on the provider’s website, return here to record it. Exact provider-reported tree quantities join Robert’s lifetime total immediately, together with the geographic level the provider actually guarantees. General restoration gifts are preserved separately. No payment information is collected here.</p>
        <DedicationForm />
      </section>

      <section className="tree-final-cta">
        <Sprout size={42} aria-hidden="true" />
        <h2>One living tribute, many meaningful landscapes.</h2>
        <p>Choose the place that holds meaning. We will preserve the tree count and geographic attribution as carefully as the provider allows.</p>
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
