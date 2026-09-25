import { ArrowLeft, ExternalLink, Sprout } from "lucide-react";
import Link from "next/link";
import { SiteNav } from "../site-chrome";
import { getSiteContent } from "../site-data";

export const dynamic = "force-dynamic";

const restorationProjects = [
  {
    region: "Amazon rainforest",
    title: "Amazon Conservation",
    text: "Robert’s research on tropical deforestation made the Amazon an important part of his Earth-system science. Amazon Conservation supports science-based, on-the-ground protection of Amazon forests and works with local and Indigenous communities.",
    provider: "Amazon Conservation Association · U.S. 501(c)(3)",
    donateLabel: "Support the Amazon",
    donateUrl: "https://www.amazonconservation.org/take-action/donate/",
    sourceLabel: "Accountability & financials",
    sourceUrl: "https://www.amazonconservation.org/about/financial-information/",
  },
  {
    region: "Arizona · Tucson region",
    title: "Coronado National Forest · Catalina–Rincon",
    text: "The Catalina–Rincon landscape wraps around the Tucson basin, where Robert spent his University of Arizona years. USDA restoration work addresses wildfire risk, erosion, water quality, wildlife habitat, and forest resilience.",
    provider: "USDA Forest Service / NRCS",
    donateLabel: "Donate to Coronado National Forest",
    donateUrl: "https://plantatree.fs.usda.gov/tree-donation",
    sourceLabel: "Project source",
    sourceUrl: "https://www.nrcs.usda.gov/programs-initiatives/joint-chiefs-landscape-restoration-partnership/fy-2022-joint-chiefs-landscape",
    note: "On Plant-A-Tree: choose Arizona → Coronado National Forest.",
  },
  {
    region: "Georgia",
    title: "Chattahoochee–Oconee National Forests",
    text: "During Robert’s Georgia Tech years, Georgia became another home. These National Forest lands span southern Appalachian and Piedmont ecosystems, with management focused on forest health, watersheds, wildlife habitat, and restoration.",
    provider: "USDA Forest Service",
    donateLabel: "Donate to a Georgia National Forest",
    donateUrl: "https://plantatree.fs.usda.gov/tree-donation",
    sourceLabel: "Forest Service source",
    sourceUrl: "https://www.fs.usda.gov/r08/chattahoochee-oconee",
    note: "On Plant-A-Tree: choose Georgia → Chattahoochee-Oconee National Forests.",
  },
  {
    region: "Texas",
    title: "National Forests & Grasslands in Texas",
    text: "Texas was Robert’s home during his UT Austin chapter. Forest Service restoration across the state includes prescribed fire, forest and watershed work, habitat stewardship, and partnerships that strengthen resilient forest landscapes.",
    provider: "USDA Forest Service",
    donateLabel: "Donate to a Texas National Forest",
    donateUrl: "https://plantatree.fs.usda.gov/tree-donation",
    sourceLabel: "Forest management source",
    sourceUrl: "https://www.fs.usda.gov/r08/texas/natural-resources/forest-management",
    note: "On Plant-A-Tree: select Texas, then choose the National Forest you wish to support.",
  },
  {
    region: "Colorado",
    title: "Restoring Colorado’s Forests Fund",
    text: "Colorado was central to Robert’s long NCAR chapter. Administered by the Colorado State Forest Service, this donor-supported fund provides native seedlings for reforestation on lands damaged by wildfire and other major disturbances.",
    provider: "Colorado State Forest Service · Colorado State University",
    donateLabel: "Donate to the restoration fund",
    donateUrl: "https://give.colostate.edu/campaigns/45077/donations/new",
    sourceLabel: "Program source",
    sourceUrl: "https://csfs.colostate.edu/forest-management/programs-for-homeowners-landowners/",
  },
  {
    region: "California · Los Angeles region",
    title: "Angeles National Forest",
    text: "Robert’s final professional chapter was at UCLA. In the mountains above Los Angeles, current Forest Service work includes post-fire restoration, fuels reduction, watershed management, invasive-plant control, and reforestation.",
    provider: "USDA Forest Service",
    donateLabel: "Donate to Angeles National Forest",
    donateUrl: "https://plantatree.fs.usda.gov/tree-donation",
    sourceLabel: "Restoration source",
    sourceUrl: "https://www.fs.usda.gov/r05/angeles/working-with-us/grants-agreements",
    note: "On Plant-A-Tree: choose California → Angeles National Forest.",
  },
  {
    region: "Massachusetts & New England",
    title: "New England Forestry Foundation",
    text: "Massachusetts connects to Robert’s Harvard and MIT years. Based in Massachusetts, NEFF conserves and stewards New England forests while advancing climate-smart forestry, working-forest conservation, and long-term forest resilience.",
    provider: "New England Forestry Foundation",
    donateLabel: "Support New England forests",
    donateUrl: "https://newenglandforestry.org/support/donate/",
    sourceLabel: "About NEFF’s work",
    sourceUrl: "https://newenglandforestry.org/",
  },
];

export default async function TreeDedicationPage() {
  const content = await getSiteContent();
  const copy = content.pageCopy;
  return (
    <main className="tree-page" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
      <SiteNav active="tree" />
      <header id="top" className="tree-page-intro">
        <h1>{copy["tree.pageTitle"]}</h1>
        <p>{copy["tree.pageIntro"]}</p>
        <small>{copy["tree.v2HeroNote"]}</small>
      </header>

      <section id="restoration-projects" className="tree-project tree-project-featured">
        <div>
          <p className="section-kicker light">{copy["tree.v2ChippewaKicker"]}</p>
          <h2>{copy["tree.v2ChippewaTitle"]}</h2>
          <p>{content.treeTribute}</p>
          <p>{content.treeDetail}</p>
          <div className="tree-project-actions">
            <a className="tree-project-donate" href="https://plantatree.fs.usda.gov/tree-donation" target="_blank" rel="noopener noreferrer">Donate through USDA Forest Service <ExternalLink size={15} /></a>
            <a className="tree-project-source" href="https://www.fs.usda.gov/detail/chippewa/home/?cid=fseprd1097779" target="_blank" rel="noopener noreferrer">About Chippewa National Forest <ExternalLink size={15} /></a>
          </div>
          <p className="tree-designation-note"><strong>To direct the gift:</strong> on the federal Plant-A-Tree form choose “Specify a National Forest,” select Minnesota, then choose Chippewa National Forest. You may also request a memorial certificate in Robert’s name.</p>
        </div>
        <div className="tree-project-note"><strong>{copy["tree.v2ChippewaNoteTitle"]}</strong><p>{copy["tree.v2ChippewaNoteText"]}</p></div>
      </section>

      <section className="tree-restoration-collection" aria-labelledby="tree-places-title">
        <div className="tree-section-heading tree-collection-heading"><p className="section-kicker">{copy["tree.v2CollectionKicker"]}</p><h2 id="tree-places-title">{copy["tree.v2CollectionTitle"]}</h2><p>{copy["tree.v2CollectionIntro"]}</p></div>
        <div className="tree-project-grid">
          {restorationProjects.map((project) => (
            <article className="tree-project-card" key={project.region}>
              <p className="tree-project-region">{project.region}</p>
              <h3>{project.title}</h3>
              <p>{project.text}</p>
              <span className="tree-project-provider">{project.provider}</span>
              <div className="tree-card-links">
                <a href={project.donateUrl} target="_blank" rel="noopener noreferrer">{project.donateLabel} <ExternalLink size={14} /></a>
                <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">{project.sourceLabel} <ExternalLink size={14} /></a>
              </div>
              {project.note && <small className="tree-card-note">{project.note}</small>}
            </article>
          ))}
        </div>
        <p className="tree-projects-footnote"><strong>About project specificity:</strong> {copy["tree.v2CollectionNote"]}</p>
      </section>

      <section className="tree-faq" aria-labelledby="tree-faq-title">
        <div className="tree-section-heading"><p className="section-kicker">{copy["tree.v2FaqKicker"]}</p><h2 id="tree-faq-title">{copy["tree.v2FaqTitle"]}</h2></div>
        <details open><summary>{copy["tree.v2Faq1Q"]}</summary><p>{copy["tree.v2Faq1A"]}</p></details>
        <details><summary>{copy["tree.v2Faq2Q"]}</summary><p>{copy["tree.v2Faq2A"]}</p></details>
        <details><summary>{copy["tree.v2Faq3Q"]}</summary><p>{copy["tree.v2Faq3A"]}</p></details>
        <details><summary>{copy["tree.v2Faq4Q"]}</summary><p>{copy["tree.v2Faq4A"]}</p></details>
      </section>

      <section className="tree-final-cta"><Sprout size={42} aria-hidden="true" /><h2>{copy["tree.v2FinalTitle"]}</h2><p>{copy["tree.v2FinalText"]}</p><a className="tree-primary-action" href="#restoration-projects">{copy["tree.v2FinalCta"]} <span aria-hidden="true">↑</span></a></section>
      <footer className="site-footer"><div className="wordmark footer-mark"><span className="wordmark-mark">∞</span><span>{copy["global.footerName"]}</span></div><p>{copy["global.footerText"]}</p><div className="footer-links"><Link href="/"><ArrowLeft size={14} /> Return to memorial</Link><a href="#top">Return to top ↑</a></div></footer>
    </main>
  );
}
