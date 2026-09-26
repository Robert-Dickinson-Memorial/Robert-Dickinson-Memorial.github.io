import { sortGalleryByYear } from "./gallery-order";
import { reviseEditorialText } from "./editorial-revision";
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
  id?: string;
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
  url?: string;
  image?: string;
  alt?: string;
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
  publication?: LegacyPublication | null;
  publications?: LegacyPublication[];
};

export type MemorialHonor = {
  year: string;
  title: string;
  detail: string;
};

export type HomeLegacyCard = {
  title: string;
  text: string;
  threadIds: string[];
};

export type LegacyThread = {
  id: string;
  title: string;
  text: string;
};

export type SecondaryLegacyTopic = {
  title: string;
  text: string;
  threadIds: string[];
};

export type CommunityQuote = {
  quote: string;
  attribution: string;
};

export type SiteAsset = {
  asset: string;
  objectKey: string | null;
  alt: string;
  layout?: "portrait" | "landscape";
};

export type SiteAssets = {
  lifePortrait: SiteAsset;
  portrait: SiteAsset;
  horizon: SiteAsset;
};

export type LifePhoto = { milestoneId?: string; id: string; objectKey: string; caption: string; date: string; alt: string };

export type SiteContent = {
  lifePhotos: LifePhoto[];
  heroIntro: string;
  obituaryStory: string;
  treeTribute: string;
  treeDetail: string;
  bodyFont: string;
  headingFont: string;
  homeLegacyIntro: string;
  homeLegacyCards: HomeLegacyCard[];
  homeFrontierLabels: string[];
  secondaryLegacyTopics: SecondaryLegacyTopic[];
  lifeMilestones: LifeMilestone[];
  legacyChapters: LegacyChapter[];
  legacyThreads: LegacyThread[];
  communityQuotes: CommunityQuote[];
  honors: MemorialHonor[];
  honorsNote: string;
  pageCopy: Record<string, string>;
  siteAssets: SiteAssets;
};

const lifeMilestones: LifeMilestone[] = [
  { year: "1961", title: "Harvard University", text: "B.A. in Chemistry and Physics." },
  { year: "1961–1968", title: "MIT", text: "S.M. (1962) and Ph.D. (1966) in Meteorology; Research Associate through 1968." },
  { year: "1968–1990", title: "NCAR", text: "Scientist, Climate Section Head, and Deputy Director of Climate and Global Dynamics." },
  { year: "1990–1999", title: "University of Arizona", text: "Professor of Atmospheric Sciences, then Regents Professor." },
  { year: "1999–2008", title: "Georgia Tech", text: "Professor of Earth and Atmospheric Sciences; Georgia Power/Georgia Research Alliance Endowed Chair." },
  { year: "2008–2018", title: "The University of Texas at Austin", text: "Professor in the Jackson School of Geosciences." },
  { year: "2018–2026", title: "UCLA", text: "Distinguished Professor in Residence in Atmospheric and Oceanic Sciences." },
];

const legacyChapters: LegacyChapter[] = [
  {
    id: "legacy-mit",
    number: "01",
    years: "1961–1968",
    institution: "MIT",
    scale: "Planetary waves & stratospheric dynamics",
    title: "Dynamics was the key",
    summary: "Robert’s earliest work asked how planetary-scale waves move through the atmosphere and reshape its circulation. The result was a set of theories that made wave propagation, critical lines, and wave–mean-flow interaction physically intelligible.",
    contributions: [
      "Developed fundamental theory for the vertical propagation of planetary-scale Rossby waves through a rotating, stratified atmosphere.",
      "Clarified how waveguides, critical lines, and radiative damping control where planetary-wave energy can propagate and where it is absorbed.",
      "Developed a fundamental framework for planetary wave–zonal-flow interaction, showing how waves can alter the mean atmospheric circulation through dissipation and critical-line processes.",
      "Helped lay foundations for modern stratospheric dynamics; later assessments noted that this work anticipated concepts underlying EP-flux diagnostics and two-dimensional refractive-index analysis.",
    ],
    impact: "His early work helped establish the dynamical language still used to understand how planetary waves shape the stratosphere and large-scale atmospheric circulation.",
    threads: ["Planetary waves", "Stratospheric dynamics", "Wave–mean-flow interaction", "Atmospheric dynamics"],
    photo: null,
    publication: null,
    publications: [
      {
        year: "1969",
        title: "Theory of Planetary Wave–Zonal Flow Interaction",
        citation: "Journal of the Atmospheric Sciences, 26, 73–81",
        note: "A major step toward a generalized theory of wave–mean-flow interaction, growing directly from Robert’s MIT-era work on planetary-wave propagation and critical lines.",
        url: "https://doi.org/10.1175/1520-0469(1969)026%3C0073:TOPWZF%3E2.0.CO;2",
        image: "landmarks/mit-wave-zonal.svg",
        alt: "Publication preview for Theory of Planetary Wave–Zonal Flow Interaction by Robert E. Dickinson, 1969",
      },
    ],
  },
  {
    id: "legacy-ncar",
    number: "02",
    years: "1968–1990",
    institution: "NCAR",
    scale: "Climate change, Land surface models",
    title: "From global atmospheres to global climate — and then down to the land",
    summary: "At NCAR, Robert’s scientific range expanded from upper-atmospheric and planetary dynamics into global climate modeling, greenhouse change, and finally the physics of the land surface.",
    contributions: [
      "Extended atmospheric dynamics and radiative physics into global models of the thermosphere and planetary atmospheres, including Earth, Venus, and Mars.",
      "Moved into global climate modeling and helped frame climate as a coupled physical system governed by energy balance, feedbacks, circulation, and interacting processes.",
      "Made seminal contributions to understanding greenhouse forcing, climate sensitivity, CO₂ and other trace gases, helping establish the quantitative basis for assessing anthropogenic climate change.",
      "Brought the climate model down to the ground: vegetation, soils, snow, albedo, evapotranspiration, and hydrology became active physical processes, culminating in BATS and pioneering studies of tropical deforestation.",
    ],
    impact: "At NCAR, Robert’s science widened dramatically: from atmospheric circulation to global climate and then to the biosphere. The land was beginning to become an active part of the climate system rather than simply its lower boundary.",
    threads: ["Planetary atmospheres", "Climate modeling", "Climate change", "BATS"],
    photo: null,
    publication: null,
    publications: [
      {
        year: "1974",
        title: "Climate Modeling",
        citation: "Schneider, S. H. & Dickinson, R. E. · Reviews of Geophysics and Space Physics, 12, 447–493",
        note: "A foundational synthesis of climate-model hierarchy, physical feedbacks, energy balance, and the emerging challenge of understanding and predicting climate change.",
        url: "https://agupubs.onlinelibrary.wiley.com/doi/abs/10.1029/RG012i003p00447",
        image: "landmarks/ncar-climate-modeling.svg",
        alt: "Publication preview for Climate Modeling by Stephen H. Schneider and Robert E. Dickinson, 1974",
      },
      {
        year: "1986",
        title: "Biosphere–Atmosphere Transfer Scheme (BATS) for the NCAR Community Climate Model",
        citation: "Dickinson, R. E., Henderson-Sellers, A., Kennedy, P. J. & Wilson, M. F. · NCAR Technical Note NCAR/TN-275+STR",
        note: "A landmark in physically representing vegetation, soils, water, snow, and surface exchange within a global climate model.",
        url: "https://doi.org/10.5065/D6668B58",
        image: "landmarks/ncar-bats.svg",
        alt: "Publication preview for the Biosphere–Atmosphere Transfer Scheme BATS technical note, 1986",
      },
    ],
  },
  {
    id: "legacy-arizona",
    number: "03",
    years: "1990–1999",
    institution: "University of Arizona",
    scale: "Land-model intercomparison & land–atmosphere interaction",
    title: "The Age of Intercomparison — broader and deeper",
    summary: "At Arizona, the land model became a laboratory for comparison, observation, and biological realism. Robert helped make its processes testable while vegetation itself became increasingly interactive.",
    contributions: [
      "Helped create PILPS, bringing land-surface models into systematic community intercomparison, evaluation, and validation instead of developing individual schemes in isolation.",
      "Deepened representations of soil moisture, roots, snow, evapotranspiration, runoff, energy exchange, and hydrology, increasingly testing these processes against observations.",
      "Moved vegetation from prescribed properties toward a dynamic component of climate models, including carbon uptake, allocation, leaf growth, roots, drought stress, and vegetation feedbacks.",
      "Strengthened connections among land models, field observations, and satellite measurements, setting the stage for increasingly observation-constrained Earth-system models.",
    ],
    impact: "Land modeling became both more testable and more alive: a community science grounded in observations, while vegetation increasingly responded to—and fed back on—the climate system.",
    threads: ["PILPS", "Land–atmosphere interactions", "Interactive vegetation", "Model evaluation"],
    photo: null,
    publication: null,
    publications: [
      {
        year: "1993",
        title: "The Project for Intercomparison of Land-Surface Parameterization Schemes (PILPS)",
        citation: "Henderson-Sellers, A., Yang, Z.-L. & Dickinson, R. E. · Bulletin of the American Meteorological Society, 74, 1335–1350",
        note: "Established a framework for systematic community comparison, documentation, and validation of land-surface schemes.",
        url: "https://journals.ametsoc.org/view/journals/bams/74/7/1520-0477_1993_074_1335_tpfiol_2_0_co_2.xml",
        image: "landmarks/arizona-pilps.svg",
        alt: "Publication preview for the PILPS paper by Henderson-Sellers, Yang, and Dickinson, 1993",
      },
      {
        year: "1998",
        title: "Interactive Canopies for a Climate Model",
        citation: "Dickinson, R. E., Shaikh, M., Bryant, R. & Graumlich, L. · Journal of Climate, 11, 2823–2836",
        note: "Moved vegetation toward an interactive component of climate models through carbon uptake, allocation, roots, leaves, and environmental stress.",
        url: "https://journals.ametsoc.org/view/journals/clim/11/11/1520-0442_1998_011_2823_icfacm_2.0.co_2.xml",
        image: "landmarks/arizona-interactive-canopies.svg",
        alt: "Publication preview for Interactive Canopies for a Climate Model by Dickinson and colleagues, 1998",
      },
    ],
  },
  {
    id: "legacy-georgia-tech",
    number: "04",
    years: "1999–2008",
    institution: "Georgia Tech",
    scale: "IPCC, remote sensing, and radiative transfer",
    title: "From land model to Earth-system component",
    summary: "At Georgia Tech, Robert connected land-surface science with broader Earth-system questions through community modeling, remote sensing, radiative transfer, and his role as a Lead Author of the IPCC Fourth Assessment Report.",
    contributions: [
      "Helped develop the Common Land Model, bringing soil, snow, runoff, vegetation, photosynthesis, energy balance, and water exchange into a modular community modeling framework.",
      "Served as a Lead Author of IPCC AR4 Working Group I, Chapter 7, synthesizing how land, carbon, biogeochemical cycles, atmospheric composition, and climate interact.",
      "Advanced the use of satellite remote sensing to evaluate land-surface properties and model behavior, including vegetation, albedo, and surface energy exchange.",
      "Advanced canopy and land-surface radiative-transfer treatments, connecting vegetation structure and optical properties to climate-model energy balance.",
    ],
    impact: "This period connected detailed land processes to the larger Earth system: community models, observations from space, radiative transfer, and the climate–biogeochemistry synthesis reflected in IPCC AR4.",
    threads: ["IPCC", "Remote sensing", "Radiative transfer", "Community Land Model"],
    photo: null,
    publication: null,
    publications: [
      {
        year: "2003",
        title: "The Common Land Model",
        citation: "Dai, Y. et al. · Bulletin of the American Meteorological Society, 84, 1013–1023",
        note: "A community-developed modular land model bringing physical, hydrological, and vegetation processes into a shared framework for weather and climate studies.",
        url: "https://journals.ametsoc.org/doi/10.1175/BAMS-84-8-1013",
        image: "landmarks/georgia-common-land-model.svg",
        alt: "Publication preview for The Common Land Model by Dai and colleagues, 2003",
      },
      {
        year: "2007",
        title: "Couplings Between Changes in the Climate System and Biogeochemistry",
        citation: "Denman, K. L., G. Brasseur, A. Chidthaisong, P. Ciais, P. M. Cox, R. E. Dickinson, et al. · IPCC AR4 Working Group I, Chapter 7, 499–587",
        note: "Robert served as a Lead Author of this chapter, which synthesized interactions among climate, terrestrial and ocean carbon cycles, atmospheric chemistry, aerosols, and biogeochemical feedbacks.",
        url: "https://www.ipcc.ch/report/ar4/wg1/coupling-between-changes-in-the-climate-system-and-biogeochemistry/",
        image: "landmarks/georgia-ipcc-ar4-ch7.svg",
        alt: "Publication preview for IPCC AR4 Working Group I Chapter 7, Couplings Between Changes in the Climate System and Biogeochemistry, 2007",
      },
    ],
  },
  {
    id: "legacy-ut",
    number: "05",
    years: "2008–2018",
    institution: "UT Austin",
    scale: "Drought, ET, and vegetation physiology",
    title: "From the globe to the leaf — and back again",
    summary: "Robert worked simultaneously across scales: from global evapotranspiration and hydroclimate to processes within leaves, while using satellite observations to test how the living land behaves.",
    contributions: [
      "Synthesized the physics, observations, satellite retrievals, and modeling of global terrestrial evapotranspiration, one of the central exchanges linking land, water, vegetation, and atmosphere.",
      "Went deeper into plant physiology—stomatal regulation, mesophyll conductance, CO₂ fertilization, hydraulic redistribution, canopy radiation, and carbon–water coupling.",
      "Connected those fine-scale processes back to drought, Amazon hydroclimate, Great Plains precipitation, terrestrial greening, and global water and carbon cycles.",
      "Expanded the use of satellite observations, including solar-induced chlorophyll fluorescence and other vegetation products, to observe photosynthesis, drought stress, and ecosystem change from space.",
    ],
    impact: "Robert’s Earth-system science became simultaneously broader and deeper—linking processes inside leaves to vegetation, drought, the terrestrial water cycle, and climate at planetary scale.",
    threads: ["Evapotranspiration", "Plant physiology", "Remote sensing", "Drought & hydroclimate"],
    photo: null,
    publication: null,
    publications: [
      {
        year: "2012",
        title: "A Review of Global Terrestrial Evapotranspiration: Observation, Modeling, Climatology, and Climatic Variability",
        citation: "Wang, K. C. & Dickinson, R. E. · Reviews of Geophysics, 50, RG2005",
        note: "A mature synthesis uniting physical theory, ground observations, satellite retrievals, land-surface models, and global hydroclimate.",
        url: "https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2011RG000373",
        image: "landmarks/ut-evapotranspiration.svg",
        alt: "Publication preview for the global terrestrial evapotranspiration review by Wang and Dickinson, 2012",
      },
      {
        year: "2014",
        title: "Impact of Mesophyll Diffusion on Estimated Global Land CO₂ Fertilization",
        citation: "Sun, Y., L. Gu, R. E. Dickinson, R. J. Norby, S. G. Pallardy & F. M. Hoffman · Proceedings of the National Academy of Sciences, 111, 15774–15779",
        note: "Showed that explicitly representing CO₂ diffusion inside leaves materially changes estimates of the global terrestrial CO₂ fertilization effect, linking leaf-scale physiology to the global carbon cycle.",
        url: "https://doi.org/10.1073/pnas.1418075111",
        image: "landmarks/ut-sun-pnas-2014.svg",
        alt: "Publication preview for Impact of Mesophyll Diffusion on Estimated Global Land CO2 Fertilization by Sun and colleagues, PNAS, 2014",
      },
    ],
  },
  {
    id: "legacy-ucla",
    number: "06",
    years: "2018–2026",
    institution: "UCLA",
    scale: "Synthesis and mentoring",
    title: "Curious about everything — still connecting the system",
    summary: "Even after retirement, Robert continued to apply connected Earth-system thinking to new climate questions and to synthesize the land–atmosphere science he had helped build.",
    contributions: [
      "Continued to frame the land and atmosphere as a coupled system, integrating vegetation, soil, radiation, water, energy, and atmospheric response.",
      "Applied Earth-system thinking to new problems, including fire-weather risk, urbanization and climate teleconnections, surface-wind changes, and aviation impacts of a warming atmosphere.",
      "Continued work on vegetation, hydrology, and tropical climate, including Amazonian plant-water dynamics and the Congo Basin water cycle.",
      "Continued collaborating with and mentoring younger scientists rather than treating retirement as the end of scientific inquiry.",
    ],
    impact: "The chronicle closes not with a new field, but with a synthesis: atmosphere, land, vegetation, water, and climate understood through their connections. The questions kept changing; the instinct to connect them did not.",
    threads: ["Land–atmosphere synthesis", "Climate attribution", "Tropical hydroclimate", "Mentorship"],
    photo: null,
    publication: null,
    publications: [
      {
        year: "3rd ed.",
        title: "Land–Atmosphere Interactions | Overview",
        citation: "Wang, G. & Dickinson, R. E. · Encyclopedia of Atmospheric Sciences, 3rd edition · DOI 10.1016/B978-0-323-96026-7.00098-9",
        note: "A capstone synthesis of the coupled exchanges linking land, vegetation, water, energy, and atmosphere—the connections at the center of much of Robert’s scientific life.",
        url: "https://www.sciencedirect.com/science/chapter/referencework/abs/pii/B9780323960267000989?via%3Dihub",
        image: "landmarks/ucla-land-atmosphere.svg",
        alt: "Publication preview for Land–Atmosphere Interactions Overview by Guiling Wang and Robert E. Dickinson",
      },
    ],
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
  { year: "2007", title: "Lead Author, IPCC Fourth Assessment Report", detail: "Chapter 7, Couplings Between Changes in the Climate System and Biogeochemistry. Robert contributed as a Lead Author; the IPCC and Al Gore jointly received the 2007 Nobel Peace Prize." },
  { year: "2014", title: "Honorary Member", detail: "American Meteorological Society" },
];

const legacyThreads: LegacyThread[] = [
  {
    "id": "atmospheric-dynamics",
    "title": "Atmospheric Dynamics",
    "text": "Robert advanced the theory of planetary waves and the dynamics of Earth’s upper atmosphere, extending his work to the atmospheres of Venus and Mars."
  },
  {
    "id": "climate-change",
    "title": "Climate Change",
    "text": "His work on radiative forcing, climate sensitivity, and greenhouse gases helped explain how changes in Earth’s energy balance lead to global warming."
  },
  {
    "id": "climate-modeling",
    "title": "Climate Modeling",
    "text": "Robert developed and improved models that connect atmospheric circulation and radiation with land processes, making them tools for understanding how the climate system works."
  },
  {
    "id": "land-atmosphere",
    "title": "Land-Atmosphere Interactions",
    "text": "He brought vegetation, soils, water, and surface energy exchange into global climate models, transforming land from a passive boundary into an active part of climate."
  },
  {
    "id": "observation-space",
    "title": "Satellite Remote Sensing",
    "text": "Robert used satellite observations of vegetation, surface temperature, and reflectance to study the land surface and test the processes represented in climate models."
  },
  {
    "id": "coupled-earth",
    "title": "A Coupled Earth",
    "text": "His work connected atmosphere, biosphere, and hydrosphere through exchanges of water, energy, and carbon, helping build a fuller picture of the Earth system."
  }
];

const homeLegacyCards: HomeLegacyCard[] = [
  {
    title: "He opened new frontiers in planetary-atmosphere science",
    text: "Robert advanced the theory of planetary waves and developed pioneering global models of upper-atmospheric dynamics and radiation, extending from Earth’s stratosphere and thermosphere to the atmospheres of Venus and Mars.",
    threadIds: ["atmospheric-dynamics", "climate-modeling"],
  },
  {
    title: "He established a quantitative foundation for understanding global warming",
    text: "Robert’s seminal work on radiative forcing, climate sensitivity, and greenhouse gases helped establish how changes in Earth’s energy balance translate into global temperature change, a foundation for modern assessments of greenhouse warming and global change.",
    threadIds: ["climate-change", "atmospheric-dynamics", "climate-modeling"],
  },
  {
    title: "He pioneered integration of land processes into global climate models",
    text: "Robert transformed the land process from a passive boundary into an active, interacting component of global climate models. He connected atmosphere, biosphere, and hydrosphere into a fuller and faithful picture of the Earth system.",
    threadIds: ["land-atmosphere", "climate-modeling", "observation-space", "coupled-earth"],
  },
  {
    title: "He inspired generations of scientists",
    text: "Robert passed on more than knowledge. His rigor, curiosity, breadth of vision, and generosity live on through generations of students, postdocs, collaborators, and scientific communities.",
    threadIds: ["atmospheric-dynamics", "climate-change", "climate-modeling", "land-atmosphere", "observation-space", "coupled-earth"],
  },
];

const secondaryLegacyTopics: SecondaryLegacyTopic[] = [
  {
    "title": "Tropical Deforestation",
    "text": "How land-cover change in the Amazon reshapes regional energy, water, and climate.",
    "threadIds": [
      "land-atmosphere",
      "climate-change",
      "coupled-earth"
    ]
  },
  {
    "title": "Carbon & Nitrogen cycling",
    "text": "Coupling biogeochemistry with water and energy cycles in land and Earth-system models.",
    "threadIds": [
      "land-atmosphere",
      "coupled-earth"
    ]
  },
  {
    "title": "Regional Climate Modeling",
    "text": "Early development of regional models for resolving climate processes below the global scale.",
    "threadIds": [
      "climate-modeling",
      "climate-change"
    ]
  },
  {
    "title": "Solar Geoengineering",
    "text": "Early analysis of deliberate changes to Earth’s energy balance and their climatic implications.",
    "threadIds": [
      "climate-change",
      "climate-modeling"
    ]
  },
  {
    "title": "Canopy Radiative Transfer",
    "text": "How vegetation absorbs, transmits, and scatters radiation, connecting canopy reflectance and satellite observations with land-surface modeling.",
    "threadIds": [
      "land-atmosphere",
      "observation-space",
      "climate-modeling"
    ]
  }
];

const communityQuotes: CommunityQuote[] = [
  { quote: "A way of thinking.", attribution: "Yongkang Xue" },
  { quote: "Grand visions and attention to details.", attribution: "Fei Chen" },
  { quote: "A towering figure.", attribution: "V. Ramaswamy" },
  { quote: "A pioneer of Earth-system modeling and biosphere–atmosphere interaction.", attribution: "Richard Betts" },
  { quote: "The world's authority on the understanding and modeling of the land component of the Earth system.", attribution: "2020 AMS Dickinson Symposium foreword" },
  { quote: "A giant in the field and the kindest person he had met.", attribution: "Venkataraman Lakshmi" },
  { quote: "An inspiration, mentor, and groundbreaking researcher.", attribution: "Christa Peters-Lidard" },
  { quote: "A respected expert who was generous with his time.", attribution: "Mike Kuperberg" },
  { quote: "A gentleman of uncommon humility, kindness, and intellectual generosity.", attribution: "Zong-Liang Yang" },
];

export const defaultPageCopy: Record<string, string> = {
  "global.wordmark": "Robert Dickinson",
  "global.footerName": "Robert E. Dickinson",
  "global.footerText": "Created with love by his academic community.",
  "global.footerHome": "Memorial home ↑",
  "nav.home": "Home",
  "nav.life": "His Life",
  "nav.legacy": "Scientific Legacy",
  "nav.tree": "Living Tribute",
  "tree.pageTitle": "Living Tribute",
  "tree.pageIntro": "Honor Robert by supporting forests and ecosystems connected to his life and work.",
  "nav.events": "Events",
  "nav.gallery": "Gallery",
  "nav.memories": "Share A Memory",

  "home.heroEyebrow": "Celebrating a life in science",
  "home.heroNameLine1": "Robert E.",
  "home.heroNameLine2": "Dickinson",
  "home.lifeDates": "March 26, 1940 – September 11, 2026",
  "home.readStory": "Read his story",
  "home.portraitQuote": "“The wonderful people I collaborated with” were among the great highlights of his career.",
  "home.portraitCaption": "Portrait courtesy of the Jackson School of Geosciences",
  "home.storyKicker": "His Life",
  "home.storyTitleLine1": "A curious mind.",
  "home.storyTitleLine2": "A generous spirit.",
  "home.storyYears": "1940–2026",
  "home.storyReadLink": "Read Robert’s full story",
  "home.tributeKicker": "Living tributes",
  "home.tributeParticipationIntro": "Honor Robert through a living tribute or a memory shared with his community.",
  "home.shareMemoryKicker": "Add your voice",
  "home.shareMemoryTitle": "Share A Memory",
  "home.shareMemoryText": "Share a story, photograph, or moment that helps us remember Robert.",
  "home.shareMemoryCta": "Share your memory →",
  "home.tributeTitle": "Two lasting ways to remember Robert",
  "home.tributeIntro": "Carry his memory into a living landscape, or preserve the community’s stories in a keepsake collection.",
  "home.treeKicker": "Living tribute",
  "home.treeTitle": "Plant a tree in his memory",
  "home.treeText": "Dedicate trees, add a message, and receive a personalized certificate.",
  "home.treeCta": "Begin a dedication →",
  "home.bookKicker": "Community keepsake",
  "home.bookTitle": "Turn memories into a book",
  "home.bookText": "Read or print an editorial collection of approved stories and photographs.",
  "home.bookCta": "Open the memory book →",
  "home.legacyKicker": "Scientific Legacy",
  "home.legacyTitle": "Science that transformed how we understand and model the Earth system",
  "home.legacyMapPrimary": "Enduring threads",
  "home.legacyMapSecondary": "Other frontiers with pioneer contribution",
  "home.legacyMapHint": "The same scientific threads reappear, combine, and widen across Robert’s work.",
  "home.legacyCta": "Explore his scientific journey",
  "home.communityKicker": "Explore the memorial",
  "home.communityTitle": "A life remembered in many forms",
  "home.communityIntro": "Visit each collection when you are ready. The homepage offers a quiet starting point rather than the entire archive at once.",
  "home.eventsKicker": "Gather together",
  "home.eventsTitle": "Events",
  "home.eventsEmpty": "Memorial gatherings and scientific tributes will be shared here.",
  "home.eventsCountOne": "1 memorial event currently listed.",
  "home.eventsCountMany": "{count} memorial events currently listed.",
  "home.eventsCta": "View events →",
  "home.galleryKicker": "Photos & film",
  "home.galleryTitle": "Gallery",
  "home.galleryEmpty": "Photographs and videos tracing a life in science and community.",
  "home.galleryCountOne": "1 photograph or video in the public collection.",
  "home.galleryCountMany": "{count} photographs or videos in the public collection.",
  "home.galleryCta": "Open the gallery →",
  "home.memoriesKicker": "From the community",
  "home.memoriesTitle": "Memories",
  "home.memoriesText": "Read approved stories from students, colleagues, friends, and family—and add your own.",
  "home.memoriesCta": "Read or share memories →",

  "life.photosKicker": "Childhood in MN",
  "life.photosTitle": "Early life in photographs",
  "life.photosEmpty": "Photographs from Robert’s early years will be shared here.",
  "life.timelineChildhoodLabel": "Childhood",
  "life.childhoodSummary": "Born in Millersburg, Ohio, and raised in Minnesota, Robert brought an early curiosity about the natural world into a lifetime of discovery.",
  "life.storyHeading": "Robert’s story",
  "life.qualitiesHeading": "A life remembered",
  "life.qualityCuriosity": "Curiosity",
  "life.qualityHumility": "Humility",
  "life.qualityKindness": "Kindness",
  "life.qualityMentorship": "Mentorship",
  "life.qualityLeadership": "Leadership",
  "life.qualityFriendship": "Friendship",
  "life.personalPortraitIntro": "Robert’s way of thinking combined a grand vision with close attention to detail, grounded in curiosity, physical insight, rigor, and intellectual generosity.",
  "life.personalPortraitText": "A patient and generous mentor, he made time for students, postdoctoral scholars, and young scientists, listening carefully and helping them find their way. He valued the people he worked with as deeply as the questions they explored together.",
  "life.fullStoryLink": "Read the full story in the memory book",
  "life.heroKicker": "His Life",
  "life.heroName": "Robert E. Dickinson",
  "life.heroTitle": "A curious Mind. A generous spirit",
  "life.heroIntro": "Robert’s path through life and career.",
  "life.years": "1940–2026",
  "life.mentorKicker": "Beyond the timeline",
  "life.mentorTitle": "The mentor he was",
  "life.mentorBody": "Robert was a patient and generous mentor who made time for students, postdoctoral scholars, and young scientists, listened carefully to their ideas, and helped them find their way. He passed on more than knowledge - a way of thinking that combined grand vision and close attention to detail, grounded in curiosity, physical insight, rigor, and intellectual generosity. He valued the people he worked with as deeply as the questions they explored together.",
  "life.mentorText": "His influence continues through the questions they ask, the models they build, and the people they mentor in turn.",
  "life.sourcesIntro": "Biographical information was drawn from Robert’s curriculum vitae and institutional sources.",
  "life.sourceJacksonLabel": "Jackson School profile",
  "life.sourceJacksonUrl": "https://www.jsg.utexas.edu/researcher/robert_dickinson/",
  "life.sourceNasLabel": "National Academy of Sciences",
  "life.sourceNasUrl": "https://www.nasonline.org/directory-entry/robert-e-dickinson-75xqut/",

  "legacy.quote2018Text": "I found climate a fascinating issue and continued to learn about it",
  "legacy.quote2018Attribution": "Robert E. Dickinson · 2018",
  "legacy.quote1996Text": "Perhaps my most profound personal insight is that this has all been a response to the dynamics of exchanging ideas with the large number of people with whom I have interacted over the course of my career",
  "legacy.quote1996Attribution": "Robert E. Dickinson · 1996",
  "legacy.serviceKicker": "Community service",
  "legacy.serviceTitle": "Serving the scientific community",
  "legacy.serviceIntro": "Robert helped shape the institutions, collaborations, and journals through which Earth science advances.",
  "legacy.serviceLeadershipTitle": "Leading scientific societies",
  "legacy.serviceLeadershipText": "He served as President of the American Geophysical Union (2002–2004), following his presidency of its Atmospheric Sciences Section (1988–1992). He also chaired the AAAS Section on Atmospheric and Hydrospheric Sciences (2001–2002).",
  "legacy.serviceAdviceTitle": "Bringing science to national decisions",
  "legacy.serviceAdviceText": "As chair of the National Research Council’s Climate Research Committee (1990–1992) and a member of numerous later committees, he advised on climate modeling, prediction, global change research, and continuity of satellite observations. He also served on the UCAR Board of Trustees (2006–2009).",
  "legacy.serviceCollaborationTitle": "Connecting international research",
  "legacy.serviceCollaborationText": "Robert was a Lead Author of Chapter 7 of the IPCC Fourth Assessment Report (2004–2007). He co-chaired the IGBP–IHDP–WCRP Joint Carbon Project Committee (2001–2006) and U.S. CLIVAR (2001–2002), helping connect research across disciplines and institutions.",
  "legacy.servicePublishingTitle": "Stewarding scientific publishing",
  "legacy.servicePublishingText": "His editorial service included Editor of the Journal of the Atmospheric Sciences (1991–1993), Associate Editor of the Journal of Climate (1993–1995), and Editor-in-Chief of Carbon Balance and Management (2005–2010). He also served on the PNAS Editorial Board.",
  "legacy.serviceSources": "Sources: Robert E. Dickinson’s curriculum vitae; foreword to the 2020 AMS Robert E. Dickinson Symposium, prepared by Xubin Zeng, Leo Donner, Ricky Rood, and Alan Robock.",
  "legacy.heroKicker": "Scientific Legacy",
  "legacy.heroTitle": "Science that transformed how we understand and model the Earth system",
  "legacy.heroIntro": "The questions Robert asked, the ideas he advanced, and the ways his work changed our understanding of Earth.",
  "legacy.scaleKicker": "A widening scientific horizon",
  "legacy.scaleTitle": "He repeatedly changed the scale of the problem.",
  "legacy.scaleIntro": "Across six decades, each question opened into a larger one—without losing the physical clarity of the question that came before it.",
  "legacy.chaptersLabel": "Scientific Contribution Chronicle",
  "legacy.focusLabel": "Scientific focus",
  "legacy.contributionsLabel": "Key contributions",
  "legacy.impactLabel": "Legacy",
  "legacy.publicationLabel": "Landmark Publication",
  "legacy.photoCredit": "Photo shared for the Robert E. Dickinson memorial.",
  "legacy.threadsKicker": "Ideas that connect his work",
  "legacy.threadsTitle": "Enduring research threads",
  "legacy.threadsIntro": "These research threads connect Robert’s discoveries across decades, from atmospheric motion to the coupled Earth system.",
  "legacy.frontiersKicker": "Beyond the central threads",
  "legacy.frontiersTitle": "Other frontiers he helped open",
  "legacy.frontiersIntro": "These five frontiers, also highlighted on the homepage, show the breadth of Robert’s contributions beyond the six central research threads.",
  "legacy.honorsKicker": "Honors, awards & recognition",

  "events.heroKicker": "Gather together",
  "events.heroTitle": "Memorial events",
  "events.heroIntro": "Services, gatherings, lectures, and scientific tributes honoring Robert will be shared here.",
  "events.sectionKicker": "Gather in remembrance",
  "events.sectionTitle": "Events",
  "events.sectionIntro": "Memorial gatherings, scientific tributes, and community events will be listed here.",
  "events.empty": "No events have been announced yet.",
  "events.defaultLink": "Event details",

  "gallery.heroKicker": "Photos & film",
  "gallery.heroTitle": "A life remembered in images",
  "gallery.heroIntro": "Photographs and recordings from Robert’s life, scientific work, collaborations, and community.",
  "gallery.sectionKicker": "Images and voices",
  "gallery.sectionTitle": "Photo & video gallery",
  "gallery.bookButton": "Turn photos into a book",
  "gallery.empty": "Photos and videos added by the memorial editors will appear here.",
  "gallery.watchVideo": "Watch video ↗",

  "memories.heroKicker": "From the community",
  "memories.heroTitle": "Memories, in many voices",
  "memories.heroIntro": "Stories from Robert’s students, postdoctoral scholars, colleagues, friends, and family—shared here after review.",
  "memories.sectionKicker": "Remembering Robert",
  "memories.sectionTitle": "Stories that carry forward",
  "memories.bookButton": "Open the memory book",
  "memories.voicesKicker": "In the words of his colleagues",
  "memories.voicesTitle": "Voices from the scientific community",
  "memories.voicesIntro": "A few words from scientists whose work and lives were shaped by Robert.",
  "memories.poemKicker": "A tribute in verse",
  "memories.poemText": "So as we honor Bob today\nBy science he was smitten\nHis legacy is guaranteed\nSo many papers written!",
  "memories.poemAttribution": "",
  "memories.shareKicker": "Add your voice",
  "memories.shareTitle": "Share a memory",
  "memories.shareText": "A conversation after seminar. A line of code he helped untangle. The question that changed your research. Small stories often reveal the truest measure of a mentor’s life.",
  "memories.moderation": "Every submission, attachment, and link is reviewed before appearing publicly.",
  "memories.loading": "Gathering stories…",
  "memories.emptyTitle": "The first stories are being gathered.",
  "memories.emptyText": "Be among the first to share a memory with the community.",
  "memories.emptyCta": "Share a memory",
  "memories.formName": "Your name",
  "memories.formNamePlaceholder": "Full name",
  "memories.formRelationship": "Your connection",
  "memories.formRelationshipPlaceholder": "Student, colleague, friend…",
  "memories.formEmail": "Email",
  "memories.formEmailNote": "(kept private)",
  "memories.formEmailPlaceholder": "you@example.edu",
  "memories.formTitle": "A title for your memory",
  "memories.formTitlePlaceholder": "The lesson I still carry",
  "memories.formStory": "Your story",
  "memories.formStoryNote": "(optional if you share a PDF or public post)",
  "memories.formStoryPlaceholder": "Tell us what you remember…",
  "memories.formSocial": "Public social-media or web post",
  "memories.formSocialNote": "(optional)",
  "memories.formSocialPlaceholder": "https://…",
  "memories.formPdf": "Upload your story as a PDF",
  "memories.formPdfHelp": "PDF · up to 12 MB",
  "memories.formPhoto": "Add a photo",
  "memories.formPhotoHelp": "JPG, PNG or WebP · up to 8 MB",
  "memories.pdfLink": "Read the shared PDF",
  "memories.socialLink": "View the shared public post",
  "memories.formConsent": "I give permission for this story, photo, PDF, and/or shared public link to be published on this memorial site after review.",
  "memories.formSubmit": "Submit for review",
  "memories.formSending": "Sending…",
  "memories.successTitle": "Your story is safely with us.",
  "memories.successMessage": "Thank you. Your memory has been received for review.",
  "memories.shareAnother": "Share another memory",
  "memories.formError": "Please try again.",

  "tree.v2HeroKicker": "A living tribute",
  "tree.v2HeroTitle": "Let Robert’s memory take root.",
  "tree.v2HeroText": "Support forest and ecosystem restoration in places connected to Robert’s life and science—from the Minnesota forests of his childhood to landscapes he studied, lived in, and returned to through his work.",
  "tree.v2HeroCta": "Choose a restoration project",
  "tree.v2HeroNote": "Donations go directly to the independent public agencies and nonprofit organizations listed below. The memorial site does not collect funds.",
  "tree.v2HowKicker": "Choose a place",
  "tree.v2HowTitle": "A tribute rooted in landscapes that mattered",
  "tree.v2HowIntro": "Chippewa National Forest remains the central tribute because Robert grew up in Minnesota. The other projects are presented equally, each representing another place or ecosystem connected to his life and scientific work.",
  "tree.v2Step1Title": "Begin with Minnesota",
  "tree.v2Step1Text": "The Chippewa National Forest is the featured project—a direct connection to the forests and lakes of the state where Robert grew up.",
  "tree.v2Step2Title": "Or follow another chapter",
  "tree.v2Step2Text": "Choose the Amazon, Arizona, Georgia, Texas, Colorado, California, or Massachusetts to honor another place connected to his science and career.",
  "tree.v2Step3Title": "Give directly",
  "tree.v2Step3Text": "Each link goes to the responsible agency or conservation organization. Where available, use the provider’s tribute or certificate fields to enter Robert E. Dickinson’s name.",
  "tree.v2ChippewaKicker": "Featured tribute · Minnesota",
  "tree.v2ChippewaTitle": "Chippewa National Forest",
  "tree.v2ChippewaNoteTitle": "Why this one comes first",
  "tree.v2ChippewaNoteText": "Minnesota was Robert’s childhood home, so the Chippewa National Forest remains the anchor of this living tribute. The Forest Service notes that if a selected forest has no immediate planting need, a Plant-A-Tree donation may be used for tree planting on another National Forest.",
  "tree.v2CollectionKicker": "Other landscapes",
  "tree.v2CollectionTitle": "Places that shaped his life and science",
  "tree.v2CollectionIntro": "These projects have equal weight in the memorial. Each was selected for a strong connection to place, credible restoration work, and a direct giving route through a public agency or established conservation organization.",
  "tree.v2CollectionNote": "USDA Plant-A-Tree allows you to request a specific National Forest, but the Forest Service may redirect the gift if that forest has no immediate planting need. The Amazon, Colorado, and New England options support the named organization or fund rather than an individually marked tree. Donation terms can change, so the provider’s page is the authoritative source at the time of giving.",
  "tree.v2FaqKicker": "Questions",
  "tree.v2FaqTitle": "Before you give",
  "tree.v2Faq1Q": "Does the memorial website collect donations?",
  "tree.v2Faq1A": "No. Every donation button takes you directly to the responsible public agency or nonprofit organization. The Robert Dickinson Memorial does not process, pool, or receive these gifts.",
  "tree.v2Faq2Q": "Can I dedicate the gift specifically to Robert?",
  "tree.v2Faq2A": "For USDA Plant-A-Tree gifts, yes: the federal form offers a certificate and a recipient field for the person being honored or remembered. Other organizations have their own tribute options; where no tribute field is offered, the donation still serves as a living tribute chosen in Robert’s memory.",
  "tree.v2Faq3Q": "Will my donation stay in the exact forest shown here?",
  "tree.v2Faq3A": "It depends on the provider. The Forest Service lets donors request a specific National Forest but states that it may use the gift on another National Forest if the selected forest has no immediate reforestation need. Other funds support the geography or program described on their own donation pages.",
  "tree.v2Faq4Q": "Are these gifts tax-deductible?",
  "tree.v2Faq4A": "Several listed organizations are U.S. charitable nonprofits, and public-agency programs provide their own receipts or documentation. Tax treatment depends on the donor and the provider; rely on the provider’s current receipt and guidance.",
  "tree.v2FinalTitle": "Choose the landscape that holds meaning.",
  "tree.v2FinalText": "Minnesota comes first in this tribute, but every project carries forward something central to Robert’s life: curiosity about the living Earth and care for the systems that sustain it.",
  "tree.v2FinalCta": "Explore the projects again",

  "tree.heroKicker": "A living tribute",
  "tree.heroTitle": "Let Robert’s memory grow.",
  "tree.heroText": "Dedicate trees in Robert E. Dickinson’s name and support native reforestation—an enduring tribute to a scientist whose work helped us understand the living Earth.",
  "tree.heroCta": "Dedicate trees in Robert’s memory",
  "tree.heroNote": "Continues to One Tree Planted, an independent 501(c)(3) nonprofit.",
  "tree.heroCardName": "Robert E. Dickinson",
  "tree.heroCardDates": "1940–2026",
  "tree.heroCardText": "Born in Ohio and raised in Minnesota, Robert devoted his life to understanding the connections among land, atmosphere, water, vegetation, and climate.",
  "tree.howKicker": "How it works",
  "tree.howTitle": "A thoughtful dedication in three steps",
  "tree.howIntro": "The nonprofit provider handles the planting and sends the keepsake materials directly.",
  "tree.step1Title": "Choose the number of trees",
  "tree.step1Text": "Select one or more trees to be planted in Robert’s memory where restoration is most needed.",
  "tree.step2Title": "Personalize the tribute",
  "tree.step2Text": "Enter Robert E. Dickinson as the honoree, write a memorial message, and choose an e-card design and delivery date.",
  "tree.step3Title": "Receive a certificate",
  "tree.step3Text": "A personalized certificate recognizes the dedication, and project updates help show the wider reforestation impact.",
  "tree.projectKicker": "Minnesota connection",
  "tree.projectTitle": "The Chippewa National Forest",
  "tree.projectLink": "Explore the Chippewa restoration project",
  "tree.projectUrl": "https://www.memorialtree.com/chippewa-national-forest-project",
  "tree.noteTitle": "Good to know",
  "tree.noteText": "The dedication provider plants where restoration is most needed. The Chippewa link explains a Minnesota project connected to Robert’s story, but it does not guarantee that a particular gift tree will be planted there.",
  "tree.faqKicker": "Questions",
  "tree.faqTitle": "Before you dedicate",
  "tree.faq1Q": "Will I receive a certificate?",
  "tree.faq1A": "Yes. One Tree Planted states that donors receive a personalized tree certificate with the honoree’s name.",
  "tree.faq2Q": "Can I include a personal message?",
  "tree.faq2A": "Yes. The dedication flow includes a custom Tree-Card message, image choice, and delivery date.",
  "tree.faq3Q": "Will I know the exact tree location?",
  "tree.faq3A": "The gift supports native reforestation projects where trees are most needed. It represents a living forest tribute rather than an individually marked tree.",
  "tree.faq4Q": "Is the donation tax-deductible?",
  "tree.faq4A": "One Tree Planted is a U.S. 501(c)(3). Tax treatment depends on your circumstances; keep the provider’s receipt for your records.",
  "tree.finalTitle": "Plant hope. Preserve memory.",
  "tree.finalText": "Continue to the provider when you are ready to create Robert’s dedication.",
  "tree.finalCta": "Begin the dedication",
  "tree.dedicationUrl": "https://onetreeplanted.org/products/gift-trees-in-memory",
  "tree.footerReturn": "Return to memorial",

  "book.toolbarReturn": "Return to memorial",
  "book.print": "Print or save as PDF",
  "book.coverKicker": "Community memories",
  "book.coverNameLine1": "Robert E.",
  "book.coverNameLine2": "Dickinson",
  "book.coverDates": "1940–2026",
  "book.coverSubtitle": "A life in science, mentorship, and friendship",
  "book.profileRunning": "Robert E. Dickinson · Community memories",
  "book.profileLabel": "Robert E. Dickinson (1940–2026)",
  "book.profileTitle": "Earth-system scientist, mentor, and friend",
  "book.galleryRunning": "Robert E. Dickinson · A life in photographs",
  "book.memoryRunning": "Robert E. Dickinson · Community memories",
  "book.messagesTitle": "Messages from Robert’s community",
  "book.memoryPrefix": "A memory from",
  "book.emptyTitle": "The book is ready to grow.",
  "book.emptyText": "Approved stories and gallery photographs will automatically appear here.",
  "book.endTitle": "His questions continue.",
  "book.endFooter": "Robert E. Dickinson Memorial · 1940–2026"
};

export const defaultSiteAssets: SiteAssets = {
  lifePortrait: { asset: "robert-dickinson.jpg", objectKey: null, alt: "Robert E. Dickinson outdoors" },
  portrait: { asset: "robert-dickinson.jpg", objectKey: null, alt: "Robert E. Dickinson outdoors", layout: "landscape" },
  horizon: { asset: "memorial-horizon.png", objectKey: null, alt: "Earth horizon artwork" },
};

export const defaultContent: SiteContent = {
  lifePhotos: [],
  heroIntro: "Pioneering climate scientist, visionary Earth-system modeler, devoted teacher, and generous mentor.",
  obituaryStory: "Robert Earl Dickinson helped change how humanity understands the living Earth.\n\nBorn in Millersburg, Ohio, and raised in Minnesota, Robert carried an expansive curiosity into a lifetime of science. He studied chemistry and physics at Harvard University, graduating in 1961, then turned to meteorology at the Massachusetts Institute of Technology, earning his master’s degree in 1962 and Ph.D. in 1966.\n\nRobert was known as a patient and exacting mentor. He gave care and attention to students, postdoctoral scholars, and visiting scientists, and valued the people he worked with as much as the questions they explored together.\n\nHis career took him from MIT and NCAR to the University of Arizona, Georgia Tech, UT Austin, and UCLA. After retiring from UT Austin, he remained active in collaboration and mentorship. Curiosity, physical insight, and generosity continued to shape his conversations with colleagues across generations.",
  treeTribute: "Robert grew up in Minnesota. A memorial tree in the Chippewa National Forest honors that connection while helping restore a landscape of pine, spruce, cedar, lakes, and headwater streams.",
  treeDetail: "Reforestation projects in the Chippewa restore native trees, strengthen wildlife habitat—including habitat for bald eagles—and improve the forest’s resilience to wind damage, insects, disease, and a changing climate.",
  bodyFont: "system-sans",
  headingFont: "classic-serif",
  homeLegacyIntro: "Rather than a single linear path, Robert’s work formed a connected scientific landscape. Foundational ideas in atmospheric dynamics, climate change, modeling, land–atmosphere exchange, observations from space, and the coupled Earth repeatedly converged as the scale of his questions widened.",
  homeLegacyCards,
  homeFrontierLabels: ["Tropical Deforestation", "Carbon & Nitrogen cycling", "Regional Climate Modeling", "Solar Geoengineering", "Canopy Radiative Transfer"],
  secondaryLegacyTopics,
  lifeMilestones,
  legacyChapters,
  legacyThreads,
  communityQuotes,
  honors,
  honorsNote: "Robert served as a Lead Author of the IPCC Fourth Assessment Report. The IPCC and Al Gore jointly received the 2007 Nobel Peace Prize.",
  pageCopy: defaultPageCopy,
  siteAssets: defaultSiteAssets,
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

function alignSiteAssets(value: string | undefined): SiteAssets {
  const saved = parseJson<Partial<SiteAssets>>(value, {});
  return {
    lifePortrait: { ...defaultSiteAssets.lifePortrait, ...(saved.lifePortrait ?? {}) },
    portrait: { ...defaultSiteAssets.portrait, ...(saved.portrait ?? {}), layout: saved.portrait?.layout === "portrait" ? "portrait" : "landscape" },
    horizon: { ...defaultSiteAssets.horizon, ...(saved.horizon ?? {}) },
  };
}

// Requested childhood display sequence; keep career-photo positions and all metadata intact.
function orderChildhoodPhotos(photos: LifePhoto[]): LifePhoto[] {
  const ids = ["b5bc1fa4-f273-43c1-9957-bd6838a3aa92", "4f6d7172-ac22-42d3-944d-a65a552e98da", "df3e2926-a02c-416e-abb2-32a0120d9091"];
  const rank = (photo: LifePhoto) => { const index = ids.indexOf(photo.id); return index < 0 ? ids.length : index; };
  const early = photos.filter((photo) => !photo.milestoneId).sort((a, b) => rank(a) - rank(b));
  let index = 0;
  return photos.map((photo) => photo.milestoneId ? photo : early[index++]);
}


const previousThreadCopy: LegacyThread[] = [{"id":"atmospheric-dynamics","title":"Atmospheric dynamics","text":"Planetary waves, circulation, radiation, and the physics that set atmospheres in motion."},{"id":"climate-change","title":"Climate change","text":"Physical understanding of radiative forcing, greenhouse warming, climate sensitivity, and feedbacks."},{"id":"climate-modeling","title":"Climate modeling","text":"Models used not merely to predict, but to reveal how interacting processes create climate."},{"id":"land-atmosphere","title":"Land–atmosphere interactions","text":"Vegetation, soils, water, snow, roots, and surface energy made active parts of the climate system."},{"id":"observation-space","title":"Observation from space","text":"Remote sensing used to confront models with the changing temperature and condition of land."},{"id":"coupled-earth","title":"A coupled Earth","text":"Water, energy, carbon, ecosystems, and human influence brought into one scientific picture."}];
const previousFrontierCopy: SecondaryLegacyTopic[] = [{"title":"Planetary atmospheres","text":"Global circulation, radiation, and upper-atmosphere modeling for Earth, Venus, and Mars.","threadIds":["atmospheric-dynamics","climate-modeling"]},{"title":"Tropical deforestation","text":"How land-cover change in the Amazon reshapes regional energy, water, and climate.","threadIds":["land-atmosphere","climate-change","coupled-earth"]},{"title":"Regional climate modeling","text":"Early development of regional models for resolving climate processes below the global scale.","threadIds":["climate-modeling","climate-change"]},{"title":"Carbon & nitrogen cycles","text":"Coupling biogeochemistry with water and energy cycles in land and Earth-system models.","threadIds":["land-atmosphere","coupled-earth"]},{"title":"Dynamic vegetation","text":"Representing vegetation change as an active part of climate and Earth-system feedbacks.","threadIds":["land-atmosphere","coupled-earth"]},{"title":"Solar geoengineering","text":"Early analysis of deliberate changes to Earth’s energy balance and their climatic implications.","threadIds":["climate-change","climate-modeling"]},{"title":"Hydrology & drought","text":"Soil moisture, evapotranspiration, groundwater, drought, and land–climate feedbacks.","threadIds":["land-atmosphere","coupled-earth"]},{"title":"Aerosols & radiation","text":"Radiative effects of aerosols, greenhouse gases, and atmospheric composition across climate scales.","threadIds":["atmospheric-dynamics","climate-change"]}];

// Update the reviewed older copy while leaving subsequent editor changes intact.
function alignLegacyThreads(items: LegacyThread[]): LegacyThread[] {
  return items.map((item) => {
    const before = previousThreadCopy.find((entry) => entry.id === item.id);
    const after = legacyThreads.find((entry) => entry.id === item.id);
    if (!before || !after) return item;
    return { ...item, title: item.title === before.title ? after.title : item.title,
      text: item.text === before.text ? after.text : item.text };
  });
}
function alignLegacyFrontiers(items: SecondaryLegacyTopic[]): SecondaryLegacyTopic[] {
  const unchanged = items.length === previousFrontierCopy.length && items.every((item, index) => {
    const before = previousFrontierCopy[index];
    return item.title === before.title && item.text === before.text && JSON.stringify(item.threadIds) === JSON.stringify(before.threadIds);
  });
  return unchanged ? secondaryLegacyTopics : items;
}

function alignLegacyChapters(items: LegacyChapter[]): LegacyChapter[] {
  const previousScales: Record<string, string> = {
    "legacy-arizona": "Land-model intercomparison & interactive vegetation",
    "legacy-ncar": "Planetary atmospheres, climate & land",
    "legacy-georgia-tech": "Community land modeling & remote sensing",
    "legacy-ut": "Water, vegetation physiology & observations",
    "legacy-ucla": "Synthesis, impacts & tropical hydroclimate",
  };
  const oldGeorgiaContributions = [
    "Helped develop the Common Land Model, bringing soil, snow, runoff, vegetation, photosynthesis, energy balance, and water exchange into a modular community modeling framework.",
    "Advanced the integration of plant physiology, carbon, nitrogen, hydrology, and vegetation dynamics, moving land models further toward full Earth-system models.",
    "Pioneered the use of MODIS observations to evaluate and improve land boundary conditions, albedo, leaf area, vegetation properties, and surface states in climate models.",
    "Extended land hydrology through work on soil moisture, runoff, groundwater, snow, evapotranspiration, and their interactions with atmospheric variability.",
  ];

  return legacyChapters.map((template) => {
    const saved = items.find((chapter) => chapter.id === template.id);
    if (!saved) return template;
    const next: LegacyChapter = { ...saved };

    if (!Array.isArray(saved.publications)) {
      next.publication = null;
      next.publications = template.publications;
    }

    if (previousScales[saved.id] && saved.scale === previousScales[saved.id]) {
      next.scale = template.scale;
    }

    if (saved.id === "legacy-mit" && saved.photo?.asset === "dickinson-1967-mit-phd.jpg" && !saved.photo.objectKey) {
      next.photo = null;
    }

    if (saved.id === "legacy-georgia-tech") {
      if (saved.summary === "At Georgia Tech, Robert’s land science matured into community Earth-system modeling, joining water, energy, vegetation, carbon, biogeochemistry, and observations from space.") next.summary = template.summary;
      if (JSON.stringify(saved.contributions) === JSON.stringify(oldGeorgiaContributions)) next.contributions = template.contributions;
      if (saved.impact === "The physical land model became a community Earth-system component, increasingly joining hydrology, vegetation, carbon and biogeochemistry with observations from space.") next.impact = template.impact;
      if (JSON.stringify(saved.threads) === JSON.stringify(["Community Land Model", "Biogeochemistry", "MODIS", "Land hydrology"])) next.threads = template.threads;
      const publications = Array.isArray(next.publications) ? next.publications : [];
      if (publications.some((publication) => publication.title === "Land Boundary Conditions from MODIS Data and Consequences for the Albedo of a Climate Model")) {
        next.publications = template.publications;
      }
    }

    if (saved.id === "legacy-ut") {
      const publications = Array.isArray(next.publications) ? next.publications : [];
      if (publications.some((publication) => publication.title === "A Review of Global Terrestrial Evapotranspiration: Observation, Modeling, Climatology, and Climatic Variability") &&
          !publications.some((publication) => publication.title === "Impact of Mesophyll Diffusion on Estimated Global Land CO₂ Fertilization")) {
        next.publications = template.publications;
      }
    }

    return next;
  });
}

export async function getSiteContent(): Promise<SiteContent> {
  if (!env.DB) return defaultContent;
  try {
    const result = await env.DB.prepare("SELECT key, value FROM site_content").all<{ key: string; value: string }>();
    const values = Object.fromEntries((result.results ?? []).map((row) => [row.key, row.value]));
    return {
      lifePhotos: orderChildhoodPhotos(parseJson<LifePhoto[]>(values.lifePhotos, [])),
      heroIntro: values.heroIntro || defaultContent.heroIntro,
      obituaryStory: reviseEditorialText(values.obituaryStory || defaultContent.obituaryStory),
      treeTribute: values.treeTribute || defaultContent.treeTribute,
      treeDetail: values.treeDetail || defaultContent.treeDetail,
      bodyFont: values.bodyFont || defaultContent.bodyFont,
      headingFont: values.headingFont || defaultContent.headingFont,
      // Refresh the original saved introduction while preserving custom editor text.
      homeLegacyIntro: !values.homeLegacyIntro || values.homeLegacyIntro === defaultContent.homeLegacyIntro.replace("Robert’s work", "Bob’s work")
        ? defaultContent.homeLegacyIntro
        : values.homeLegacyIntro,
      homeLegacyCards: parseJson(values.homeLegacyCards, defaultContent.homeLegacyCards),
      homeFrontierLabels: parseJson<string[]>(values.homeFrontierLabels, defaultContent.homeFrontierLabels).map((label) => label === "Canopy radiative transfer" ? "Canopy Radiative Transfer" : label),
      secondaryLegacyTopics: alignLegacyFrontiers(parseJson<SecondaryLegacyTopic[]>(values.secondaryLegacyTopics, defaultContent.secondaryLegacyTopics)),
      lifeMilestones: parseJson<LifeMilestone[]>(values.lifeMilestones, defaultContent.lifeMilestones).map((item) => ({ ...item, text: reviseEditorialText(item.text) })),
      legacyChapters: alignLegacyChapters(parseJson<LegacyChapter[]>(values.legacyChapters, defaultContent.legacyChapters)).map((chapter) => ({ ...chapter, summary: reviseEditorialText(chapter.summary) })),
      legacyThreads: alignLegacyThreads(parseJson<LegacyThread[]>(values.legacyThreads, defaultContent.legacyThreads)),
      communityQuotes: parseJson(values.communityQuotes, defaultContent.communityQuotes),
      honors: parseJson<MemorialHonor[]>(values.honors, defaultContent.honors).map((honor) => honor.year === "2007" && honor.title === "Lead Author, IPCC Fourth Assessment Report" && honor.detail === "Chapter 7, Couplings Between Changes in the Climate System and Biogeochemistry" ? { ...honor, detail: "Chapter 7, Couplings Between Changes in the Climate System and Biogeochemistry. Robert contributed as a Lead Author; the IPCC and Al Gore jointly received the 2007 Nobel Peace Prize." } : honor),
      honorsNote: values.honorsNote || defaultContent.honorsNote,
      pageCopy: (() => {
        const saved = parseJson<Record<string, string>>(values.pageCopy, {});
        if (saved["nav.memories"] === "Memories") saved["nav.memories"] = "Share A Memory";
        if (saved["legacy.frontiersIntro"] === "Robert’s range extended well beyond the six enduring threads. These smaller constellations show important areas where his ideas opened new questions, models, and communities.") saved["legacy.frontiersIntro"] = "These five frontiers, also highlighted on the homepage, show the breadth of Robert’s contributions beyond the six central research threads.";
        if (saved["life.photosKicker"] === "Early years" || saved["life.photosKicker"] === "Early Years") saved["life.photosKicker"] = "Childhood in MN";
        Object.keys(saved).filter((key) => key.startsWith("legacy.voices")).forEach((key) => delete saved[key]);
        if (saved["legacy.chaptersLabel"] === "Scientific contributions") saved["legacy.chaptersLabel"] = "Scientific Contribution Chronicle";
        if (saved["legacy.publicationLabel"] === "Landmark publication") saved["legacy.publicationLabel"] = "Landmark Publication";
        if (saved["memories.moderation"] === "Every submission and photograph is reviewed before appearing publicly.") saved["memories.moderation"] = "Every submission, attachment, and link is reviewed before appearing publicly.";
        if (saved["memories.formConsent"] === "I give permission for this story and photo to be published on this memorial site after review.") saved["memories.formConsent"] = "I give permission for this story, photo, PDF, and/or shared public link to be published on this memorial site after review.";
        if (saved["life.heroTitle"] === "A curious mind. A generous spirit.") saved["life.heroTitle"] = "A curious Mind. A generous spirit";
        if (saved["life.heroIntro"] === "Robert’s beginnings, his path through life, and the curiosity and generosity colleagues remember.") saved["life.heroIntro"] = "Robert’s path through life and career.";
        delete saved["life.mentorQuote"];
        const merged = { ...defaultContent.pageCopy, ...saved };
        merged["legacy.heroTitle"] = merged["home.legacyTitle"];
        return Object.fromEntries(Object.entries(merged).map(([key, value]) => [key, reviseEditorialText(value)]));
      })(),
      siteAssets: alignSiteAssets(values.siteAssets),
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
    return sortGalleryByYear(result.results ?? []);
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
