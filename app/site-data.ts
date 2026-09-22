import { env } from "cloudflare:workers";

export type MemorialEvent = {
  id: number;
  title: string;
  startAt: string;
  endAt: string | null;
  location: string | null;
  description: string | null;
  linkLabel: string | null;
  linkUrl: string | null;
};

export type GalleryItem = {
  id: number;
  kind: "image" | "video";
  title: string;
  caption: string | null;
  objectKey: string | null;
  externalUrl: string | null;
  createdAt: string;
};

export type LifeMilestone = {
  year: string;
  title: string;
  text: string;
};

export type LegacyChapterPhoto = {
  asset: string | null;
  objectKey: string | null;
  alt: string;
  caption: string;
};

export type LegacyPublication = {
  year: string;
  title: string;
  citation: string;
  note: string;
};

export type LegacyChapter = {
  id: string;
  number: string;
  years: string;
  institution: string;
  scale: string;
  title: string;
  summary: string;
  contributions: string[];
  impact: string;
  threads: string[];
  photo: LegacyChapterPhoto | null;
  publication: LegacyPublication | null;
};

export type MemorialHonor = {
  year: string;
  title: string;
  detail: string;
};

export type HomeLegacyTopic = {
  title: string;
  note: string;
};

export type SiteContent = {
  heroIntro: string;
  obituaryStory: string;
  treeTribute: string;
  treeDetail: string;
  bodyFont: string;
  headingFont: string;
  homeLegacyIntro: string;
  homeLegacyTopics: HomeLegacyTopic[];
  lifeMilestones: LifeMilestone[];
  legacyChapters: LegacyChapter[];
  honors: MemorialHonor[];
  honorsNote: string;
};

const lifeMilestones: LifeMilestone[] = [
  { year: "1961", title: "Harvard University", text: "B.A. in Chemistry and Physics." },
  { year: "1961–1968", title: "MIT", text: "S.M. in Meteorology (1962), Ph.D. in Meteorology (1966), then Research Associate (1966–1968)." },
  { year: "1968–1990", title: "NCAR", text: "Scientist (1968–1975), Head of the Climate Section (1975–1981), and Deputy Director of the Climate and Global Dynamics Division (1981–1990)." },
  { year: "1990–1999", title: "University of Arizona", text: "Professor of Atmospheric Sciences (1990–1993), then Regents Professor (1993–1999), with appointments spanning atmospheric physics, hydrology, and tree-ring research." },
  { year: "1999–2008", title: "Georgia Tech", text: "Professor in Earth and Atmospheric Sciences and Georgia Power/Georgia Research Alliance Endowed Chair." },
  { year: "2008–2018", title: "The University of Texas at Austin", text: "Professor in the Jackson School of Geosciences, continuing research in climate, land-surface processes, drought, remote sensing, and Earth-system science." },
  { year: "2018–2026", title: "UCLA", text: "Distinguished Professor in Residence in the Department of Atmospheric and Oceanic Sciences, continuing scientific collaboration and mentorship." },
];

const legacyChapters: LegacyChapter[] = [
  {
    id: "legacy-mit",
    number: "01",
    years: "1961–1968",
    institution: "MIT",
    scale: "Atmospheric dynamics",
    title: "Finding order in planetary-scale motion",
    summary: "Bob’s scientific career took shape at MIT. He completed his Ph.D. in Meteorology in 1966 with Propagators of Atmospheric Motions, then remained at MIT as a research associate through 1968. His early work centered on a fundamental problem in atmospheric dynamics: how planetary-scale waves propagate through the atmosphere, and how they interact with the circulation around them. In a remarkable series of papers, he showed that the spherical geometry of the Earth matters fundamentally for planetary-wave propagation and how waves can be guided toward critical lines where their energy and momentum are absorbed.",
    contributions: [
      "Showed why Earth’s spherical geometry must be included in theories of vertically propagating planetary Rossby waves.",
      "Developed the first theory of Rossby-wave critical-line absorption and demonstrated the role of atmospheric waveguides.",
      "Helped establish the conceptual foundations for modern understanding of planetary-wave propagation and wave–mean-flow interaction in the stratosphere.",
    ],
    impact: "This early work already reveals Bob’s characteristic scientific style: begin with a fundamental physical question, reduce it to its essential dynamics, and then uncover consequences that reshape how the larger system is understood.",
    threads: ["Atmospheric dynamics", "Planetary waves", "Stratosphere", "Wave–mean-flow interaction"],
    photo: {
      asset: "dickinson-1967-mit-phd.jpg",
      objectKey: null,
      alt: "Robert E. Dickinson seated with a notebook in 1967, during his MIT period",
      caption: "Robert Dickinson during his MIT years, 1967.",
    },
    publication: {
      year: "1968",
      title: "Planetary Rossby Waves Propagating Vertically Through Weak Westerly Wind Wave Guides",
      citation: "Journal of the Atmospheric Sciences, 25, 984–1002",
      note: "This landmark paper developed the first theory of Rossby-wave critical-line absorption, extended the atmospheric refractive-index concept into two dimensions, and introduced a group-velocity framework that anticipated later Eliassen–Palm flux thinking.",
    },
  },
  {
    id: "legacy-ncar",
    number: "02",
    years: "1968–1990",
    institution: "NCAR",
    scale: "Climate change and climate modeling",
    title: "Expanding from atmospheric theory to climate",
    summary: "At the National Center for Atmospheric Research, Bob’s science widened from upper-atmospheric dynamics and planetary atmospheres to global circulation, climate change, and climate modeling. As a scientist, Climate Section head, and deputy director, he helped shape both the models and the community building them.",
    contributions: [
      "Advanced understanding of atmospheric circulation, radiation, and the upper atmospheres of Earth, Venus, and Mars.",
      "Helped establish climate modeling as a framework for studying the interacting processes that govern global change, including service on the 1979 Charney assessment of carbon dioxide and climate.",
      "Pioneered land-surface representations that brought soil, water, and vegetation into global climate models.",
    ],
    impact: "Land was no longer merely the lower boundary of an atmospheric model. It became an active, living participant in climate.",
    threads: ["Climate change", "Climate modeling", "Atmospheric dynamics", "BATS"],
    photo: null,
    publication: null,
  },
  {
    id: "legacy-arizona",
    number: "03",
    years: "1990–1999",
    institution: "University of Arizona",
    scale: "Land–atmosphere interactions",
    title: "Making the living land visible to climate models",
    summary: "Working across atmospheric science, hydrology, and tree-ring research at Arizona, Bob deepened the physical description of the land surface and helped make those models testable against observations.",
    contributions: [
      "Linked vegetation, evapotranspiration, soil moisture, snow, and surface energy exchange in land-surface models.",
      "Advanced model evaluation through international land-surface intercomparison and field observations.",
      "Connected satellite measurements and canopy reflectance with studies of drought, hydrology, and tropical deforestation.",
    ],
    impact: "His work helped turn land modeling into an observational science—one that could be compared, challenged, and improved across places and scales.",
    threads: ["Land–atmosphere interactions", "Hydrology", "Remote sensing", "Model evaluation"],
    photo: null,
    publication: null,
  },
  {
    id: "legacy-georgia-tech",
    number: "04",
    years: "1999–2008",
    institution: "Georgia Tech",
    scale: "Coupled water, energy, and carbon",
    title: "Connecting the exchanges that make an Earth system",
    summary: "At Georgia Tech, Bob brought atmospheric physics, hydrology, ecosystems, biogeochemistry, and observations from space into closer conversation. His research and teaching increasingly treated climate as a coupled Earth system rather than a collection of separate components.",
    contributions: [
      "Advanced land models that connected roots, soil moisture, surface energy, ecosystems, and the carbon cycle.",
      "Used remote sensing and observations to test land temperature, vegetation, albedo, and land–atmosphere exchange.",
      "Extended his scientific leadership globally through the IPCC, the American Geophysical Union, and a growing international group of students and collaborators.",
    ],
    impact: "The scientific question had expanded again: not only how land affects climate, but how water, energy, carbon, vegetation, and atmosphere continually reshape one another.",
    threads: ["Earth-system modeling", "Remote sensing", "Carbon cycle", "Hydrology"],
    photo: null,
    publication: null,
  },
  {
    id: "legacy-ut",
    number: "05",
    years: "2008–2018",
    institution: "UT Austin",
    scale: "Models + observations",
    title: "Synthesis—and a new generation of scientists",
    summary: "At UT Austin’s Jackson School of Geosciences, Bob continued to connect models with observations while giving unusual care to students, postdoctoral scholars, and visiting scientists.",
    contributions: [
      "Studied drought, soil-moisture feedbacks, vegetation, surface temperature, atmospheric circulation, and climate extremes.",
      "Used satellite observations to reveal ecosystem stress and to test the land processes represented in climate models.",
      "Helped frame national priorities for climate modeling, prediction, and sustained Earth observations from space.",
    ],
    impact: "By the end of his full-time career, Bob’s legacy lived in both a more complete representation of Earth and a worldwide community trained to keep improving it.",
    threads: ["Drought", "Remote sensing", "Coupled processes", "Mentorship"],
    photo: null,
    publication: null,
  },
  {
    id: "legacy-ucla",
    number: "06",
    years: "2018–2026",
    institution: "UCLA",
    scale: "Synthesis and mentorship",
    title: "Keeping the scientific conversation alive",
    summary: "After retiring from UT Austin, Bob continued as a Distinguished Professor in Residence in UCLA’s Department of Atmospheric and Oceanic Sciences. He remained engaged in research, collaboration, and mentoring, continuing the habit that had defined his career: moving easily across disciplines while returning to first principles.",
    contributions: [
      "Continued collaborating across atmospheric science, climate, land-surface processes, and Earth-system modeling.",
      "Shared decades of physical insight with students and colleagues working on new generations of models and observations.",
      "Sustained an international scientific community built as much through generosity and conversation as through publications.",
    ],
    impact: "His final professional chapter made clear that his enduring contribution was not only a body of science, but a way of doing science—curious, physical, collaborative, and generous.",
    threads: ["Synthesis", "Earth-system science", "Collaboration", "Mentorship"],
    photo: null,
    publication: null,
  },
];

const honors: MemorialHonor[] = [
  { year: "1973", title: "Clarence Leroy Meisinger Award", detail: "American Meteorological Society" },
  { year: "1984", title: "Fellow", detail: "American Association for the Advancement of Science" },
  { year: "1987", title: "Fellow", detail: "American Geophysical Union" },
  { year: "1988", title: "Member", detail: "U.S. National Academy of Sciences" },
  { year: "1988", title: "Jule G. Charney Award", detail: "American Meteorological Society" },
  { year: "1992", title: "Physics Distinguished Achievement Award", detail: "Outstanding Publication Contribution" },
  { year: "1996", title: "G. Unger Vetlesen Prize", detail: "Lamont-Doherty Earth Observatory of Columbia University" },
  { year: "1996", title: "Roger Revelle Medal", detail: "American Geophysical Union" },
  { year: "1997", title: "Carl-Gustaf Rossby Research Medal", detail: "American Meteorological Society" },
  { year: "2002", title: "Member", detail: "U.S. National Academy of Engineering" },
  { year: "2002", title: "Honorary Member", detail: "European Geophysical Society" },
  { year: "2002–2004", title: "President", detail: "American Geophysical Union" },
  { year: "2002–2008", title: "Georgia Power / Georgia Research Alliance Endowed Chair", detail: "Georgia Institute of Technology" },
  { year: "2003", title: "Highly Cited Researcher", detail: "ISI Web of Knowledge" },
  { year: "2004", title: "Honorary Member", detail: "European Geosciences Union" },
  { year: "2005", title: "Honorary Professor", detail: "Beijing Normal University" },
  { year: "2005", title: "Einstein Lectureship", detail: "Chinese Academy of Sciences, Institute of Remote Sensing" },
  { year: "2006", title: "Outstanding Faculty Research Author", detail: "Georgia Institute of Technology" },
  { year: "2006", title: "Foreign Member", detail: "Chinese Academy of Sciences" },
  { year: "2007", title: "Lead Author, IPCC Fourth Assessment Report", detail: "Chapter 7, Couplings Between Changes in the Climate System and Biogeochemistry" },
  { year: "2014", title: "Honorary Member", detail: "American Meteorological Society" },
];

const homeLegacyTopics: HomeLegacyTopic[] = [
  { title: "Atmospheric Dynamics", note: "Waves, circulation, and the physics of the atmosphere" },
  { title: "Climate Change", note: "How a changing atmosphere reshapes the planet" },
  { title: "Climate Models", note: "A common framework connecting processes and scales" },
  { title: "Land–Atmosphere Interactions", note: "Water, energy, vegetation, and carbon in exchange" },
  { title: "Remote Sensing (Observation from Space)", note: "Observations that test and improve the models" },
];

export const defaultContent: SiteContent = {
  heroIntro: "Pioneering climate scientist, visionary Earth-system modeler, devoted teacher, and generous mentor.",
  obituaryStory: [
    "Robert Earl Dickinson helped change how humanity understands the living Earth.",
    "Born in Millersburg, Ohio, and raised in Minnesota, Robert carried an expansive curiosity into a lifetime of science. He studied chemistry and physics at Harvard University, graduating in 1961, then turned to meteorology at the Massachusetts Institute of Technology, earning his master’s degree in 1962 and Ph.D. in 1966.",
    "He joined the National Center for Atmospheric Research in 1968. Early in his career, he advanced understanding of how planetary waves transfer energy through the atmosphere. Later, as a leader in NCAR’s Climate and Global Dynamics Division, he confronted a central weakness in the era’s climate models: land was treated largely as a passive store of water. Robert helped recast it as a dynamic system of soils, plants, water, energy, and carbon.",
    "That insight reshaped global climate modeling. His pioneering work brought vegetation and land-surface processes into climate models and helped establish the intellectual foundations of modern Earth-system science. Across five decades, his research connected atmospheric dynamics with hydrology, drought, remote sensing, aerosols, tropical deforestation, and the terrestrial carbon cycle.",
    "Robert held professorships at the University of Arizona and Georgia Tech before joining The University of Texas at Austin in 2008. At UT’s Jackson School of Geosciences, he was known not only as a giant of climate science, but as a patient and exacting mentor. After retiring from UT in 2018, he continued as a Distinguished Professor in Residence at UCLA, remaining active in research, collaboration, and mentorship.",
    "His deepest legacy lives in both the models that now describe a more complete Earth and the people he trained to ask better questions of it.",
  ].join("\n\n"),
  treeTribute: "Robert grew up in Minnesota. A memorial tree in the Chippewa National Forest honors that connection while helping restore a landscape of pine, spruce, cedar, lakes, and headwater streams.",
  treeDetail: "Reforestation projects in the Chippewa restore native trees, strengthen wildlife habitat—including habitat for bald eagles—and improve the forest’s resilience to wind damage, insects, disease, and a changing climate.",
  bodyFont: "system-sans",
  headingFont: "classic-serif",
  homeLegacyIntro: "Rather than a single linear path, Bob’s work formed a connected scientific landscape: ideas in atmospheric dynamics, climate change, modeling, land–atmosphere exchange, and observations from space continually informed one another.",
  homeLegacyTopics,
  lifeMilestones,
  legacyChapters,
  honors,
  honorsNote: "Robert served as a Lead Author of the IPCC Fourth Assessment Report. The IPCC and Al Gore jointly received the 2007 Nobel Peace Prize.",
};

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed as T;
  } catch {
    return fallback;
  }
}

export async function getSiteContent(): Promise<SiteContent> {
  if (!env.DB) return defaultContent;
  try {
    const result = await env.DB.prepare("SELECT key, value FROM site_content").all<{ key: string; value: string }>();
    const values = Object.fromEntries((result.results ?? []).map((row) => [row.key, row.value]));
    return {
      heroIntro: values.heroIntro || defaultContent.heroIntro,
      obituaryStory: values.obituaryStory || defaultContent.obituaryStory,
      treeTribute: values.treeTribute || defaultContent.treeTribute,
      treeDetail: values.treeDetail || defaultContent.treeDetail,
      bodyFont: values.bodyFont || defaultContent.bodyFont,
      headingFont: values.headingFont || defaultContent.headingFont,
      homeLegacyIntro: values.homeLegacyIntro || defaultContent.homeLegacyIntro,
      homeLegacyTopics: parseJson(values.homeLegacyTopics, defaultContent.homeLegacyTopics),
      lifeMilestones: parseJson(values.lifeMilestones, defaultContent.lifeMilestones),
      legacyChapters: parseJson(values.legacyChapters, defaultContent.legacyChapters),
      honors: parseJson(values.honors, defaultContent.honors),
      honorsNote: values.honorsNote || defaultContent.honorsNote,
    };
  } catch {
    return defaultContent;
  }
}

export async function getPublishedEvents(): Promise<MemorialEvent[]> {
  if (!env.DB) return [];
  try {
    const result = await env.DB.prepare(
      `SELECT id, title, start_at AS startAt, end_at AS endAt, location, description,
              link_label AS linkLabel, link_url AS linkUrl
       FROM events WHERE published = 1 ORDER BY start_at ASC, id ASC`
    ).all<MemorialEvent>();
    return result.results ?? [];
  } catch {
    return [];
  }
}

export async function getPublishedGallery(): Promise<GalleryItem[]> {
  if (!env.DB) return [];
  try {
    const result = await env.DB.prepare(
      `SELECT id, kind, title, caption, object_key AS objectKey,
              external_url AS externalUrl, created_at AS createdAt
       FROM gallery_items WHERE published = 1 ORDER BY created_at DESC, id DESC`
    ).all<GalleryItem>();
    return result.results ?? [];
  } catch {
    return [];
  }
}

export function videoEmbedUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.endsWith("youtube.com")) {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (url.hostname === "vimeo.com") return `https://player.vimeo.com/video/${url.pathname.split("/").filter(Boolean)[0]}`;
  } catch {
    return null;
  }
  return null;
}
