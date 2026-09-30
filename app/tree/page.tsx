import { ArrowLeft, ExternalLink, Globe2, MapPin, ShieldCheck, Sprout } from "lucide-react";
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
    region: "Amazon rainforest",
    title: "Reforest the Amazon Basin",
    text: "Robert’s work on tropical deforestation makes the Amazon a scientifically meaningful part of this tribute. Tree-Nation’s Rioterra project funds individual trees in a specific Brazilian Amazon restoration project.",
    provider: "Tree-Nation · Rioterra",
    route: "amazon-tree-nation",
    donateLabel: "Plant trees in the Amazon",
    donateUrl: "https://tree-nation.com/projects/amazonia-rioterra-brazil/vqs",
    sourceLabel: "View project details",
    sourceUrl: "https://tree-nation.com/projects/amazonia-rioterra-brazil/vqs",
    geography: "Specific project · Brazilian Amazon",
    note: "Exact tree quantity. Card, PayPal and bank-transfer options may make this route useful for international contributors.",
    alternative: {
      route: "amazon-conservation",
      label: "Support broader Amazon conservation",
      url: "https://www.amazonconservation.org/take-action/donate/",
      note: "Broader Amazon restoration/conservation gift; recorded separately because no exact tree quantity is assigned.",
    },
  },
  {
    region: "Arizona",
    title: "Arizona forest restoration",
    text: "Arizona was Robert’s home during his University of Arizona years. A Living Tribute offers exact tree quantities for restoration within Arizona forests affected by wildfire, disease, and environmental stress.",
    provider: "A Living Tribute",
    route: "arizona-living-tribute",
    donateLabel: "Plant trees in Arizona",
    donateUrl: "https://shop.alivingtribute.org/products/plant-a-tree-arizona",
    sourceLabel: "Arizona planting details",
    sourceUrl: "https://shop.alivingtribute.org/products/plant-a-tree-arizona",
    geography: "State-level · Arizona",
    note: "The tree count is exact; the memorial records these trees to Arizona, not to a specific forest unless the provider explicitly guarantees that forest at checkout.",
  },
  {
    region: "Georgia",
    title: "Georgia forest restoration",
    text: "Georgia became another home during Robert’s Georgia Tech years. This route supports exact-tree restoration within Georgia, including high-need public forest landscapes.",
    provider: "A Living Tribute",
    route: "georgia-living-tribute",
    donateLabel: "Plant trees in Georgia",
    donateUrl: "https://shop.alivingtribute.org/products/plant-a-tree-georgia",
    sourceLabel: "Georgia planting details",
    sourceUrl: "https://shop.alivingtribute.org/products/plant-a-tree-georgia",
    geography: "State-level · Georgia",
    note: "Exact tree quantity; attributed to Georgia rather than to an individual forest unless explicitly guaranteed at checkout.",
  },
  {
    region: "Texas",
    title: "Texas landscape restoration",
    text: "Texas was Robert’s home during his UT Austin chapter. This route funds exact-tree restoration across Texas forests, floodplains, and wildfire-affected landscapes.",
    provider: "A Living Tribute",
    route: "texas-living-tribute",
    donateLabel: "Plant trees in Texas",
    donateUrl: "https://shop.alivingtribute.org/products/plant-a-tree-texas",
    sourceLabel: "Texas planting details",
    sourceUrl: "https://shop.alivingtribute.org/products/plant-a-tree-texas",
    geography: "State-level · Texas",
    note: "Exact tree quantity; the memorial records Texas as the geographic attribution.",
  },
  {
    region: "Colorado",
    title: "Restoring Colorado’s Forests Fund",
    text: "Colorado was central to Robert’s long NCAR chapter. The Colorado State Forest Service provides seedlings for reforestation of Colorado lands damaged by wildfire and other major disturbances.",
    provider: "Colorado State Forest Service · Colorado State University",
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
    route: "california-living-tribute",
    donateLabel: "Plant trees in California",
    donateUrl: "https://shop.alivingtribute.org/products/plant-a-tree-california",
    sourceLabel: "California planting details",
    sourceUrl: "https://shop.alivingtribute.org/products/plant-a-tree-california",
    geography: "State-level · California",
    note: "Angeles National Forest appears among the provider’s California restoration landscapes, but the memorial attributes the gift only to California unless checkout explicitly guarantees Angeles.",
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
    geography: "Specific project · Charles River Esplanade",
    note: "One new-tree sponsorship represents one newly planted tree. This is an urban-canopy tribute rather than forest reforestation.",
    alternative: {
      route: "new-england-neff",
      label: "Support New England forest stewardship",
      url: "https://newenglandforestry.org/support/donate/",
      note: "Regional forest stewardship gift; recorded separately because no exact tree quantity is assigned.",
    },
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
          <p className="section-kicker light">Featured tribute · Minnesota</p>
          <h2>Chippewa National Forest</h2>
          <p>{content.treeTribute}</p>
          <p>{content.treeDetail}</p>

          <div className="tree-chippewa-routes">
            <article className="tree-route-card tree-route-primary">
              <span className="tree-route-location">Chippewa National Forest</span>
              <h3>Arbor Day Foundation</h3>
              <p>For U.S. contributors. U.S. address required; select Chippewa National Forest at checkout.</p>
              <ContributionLink
                className="tree-project-donate"
                href="https://shop.arborday.org/tree-dedication/commemorative-trees-for-others?producttype=TIM"
                route="chippewa-arbor-day"
              >
                Continue with Arbor Day
              </ContributionLink>
            </article>

            <article className="tree-route-card tree-route-alternative">
              <span className="tree-route-location">Alternative · Minnesota Forests</span>
              <h3>A Living Tribute</h3>
              <p>For smaller gifts and international contributors. Trees support Minnesota forests; the specific forest depends on current need.</p>
              <ContributionLink
                className="tree-project-secondary-action"
                href="https://shop.alivingtribute.org/products/plant-a-tree-minnesota"
                route="minnesota-living-tribute"
              >
                Continue with A Living Tribute
              </ContributionLink>
            </article>
          </div>

          <div className="tree-international-fallback">
            <Globe2 size={22} aria-hidden="true" />
            <div>
              <strong>Outside the U.S. or having payment trouble?</strong>
              <p>Use our global reforestation fallback. One Tree Planted lets you choose an exact number of memorial trees and uses a secure Shopify checkout, but the trees are planted where restoration is needed most rather than assigned to Chippewa or another Robert-specific location.</p>
              <ContributionLink href="https://onetreeplanted.org/products/gift-trees-in-memory" route="global-one-tree-planted">Plant trees where needed most</ContributionLink>
            </div>
          </div>

          <details className="tree-official-fallback">
            <summary>Official U.S. Forest Service option</summary>
            <p>USDA Plant-A-Tree remains available for U.S.-accessible visitors who specifically want a Forest Service contribution. USDA does not assign an exact tree quantity to an individual gift and may redirect funds if the requested forest has no immediate planting need, so we record it as a restoration gift rather than as exact trees.</p>
            <ContributionLink href="https://plantatree.fs.usda.gov/tree-donation" route="chippewa-usda">Open USDA Plant-A-Tree</ContributionLink>
          </details>
        </div>

        <div className="tree-project-note">
          <strong>Why Chippewa comes first</strong>
          <p>Minnesota was Robert’s childhood home, so Chippewa National Forest remains the anchor of this living tribute. Chippewa National Forest is the first choice; Minnesota forests provide a simpler alternative for smaller gifts and international contributors.</p>
        </div>
      </section>

      <section className="tree-geography-principle" aria-labelledby="geography-principle-title">
        <div>
          <p className="section-kicker">How we keep the record honest</p>
          <h2 id="geography-principle-title">We count the trees exactly—and the location only as precisely as the provider guarantees.</h2>
        </div>
        <div className="tree-geography-levels">
          <span><MapPin size={17} /><strong>Exact forest/project</strong><small>Chippewa · Amazon/Rioterra · Charles River Esplanade</small></span>
          <span><MapPin size={17} /><strong>State/region</strong><small>Minnesota · Arizona · Georgia · Texas · Colorado · California</small></span>
          <span><Globe2 size={17} /><strong>Where needed most</strong><small>Exact trees, but not assigned to a Robert-specific landscape</small></span>
        </div>
      </section>

      <section className="tree-restoration-collection" aria-labelledby="tree-places-title">
        <div className="tree-section-heading tree-collection-heading">
          <p className="section-kicker">Other landscapes</p>
          <h2 id="tree-places-title">Places that shaped his life and science</h2>
          <p>Each landscape is connected to Robert’s life or scientific work. We favor exact-tree routes tied to the named project, state, or region; when a provider cannot guarantee a particular forest, the memorial does not imply that it can.</p>
        </div>

        <div className="tree-project-grid">
          {restorationProjects.map((project) => (
            <article className="tree-project-card" key={project.region}>
              <p className="tree-project-region">{project.region}</p>
              <h3>{project.title}</h3>
              <p>{project.text}</p>
              <span className="tree-project-provider">{project.provider}</span>
              <span className="tree-geography-tag"><MapPin size={13} aria-hidden="true" /> {project.geography}</span>
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

        <div className="tree-universal-fallback">
          <ShieldCheck size={24} aria-hidden="true" />
          <div>
            <strong>Payment from your country is not working?</strong>
            <p>Use One Tree Planted’s memorial-tree checkout as a global, non-location-specific fallback when its checkout is available in your country. Your exact tree quantity still joins Robert’s lifetime total, but its geographic attribution is recorded as <em>Where needed most</em>.</p>
            <ContributionLink href="https://onetreeplanted.org/products/gift-trees-in-memory" route="global-one-tree-planted">Use the global tree option</ContributionLink>
          </div>
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
