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
};

export type SiteAssets = {
  portrait: SiteAsset;
  horizon: SiteAsset;
};

export type LifePhoto = { id: string; objectKey: string; caption: string; date: string; alt: string };

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
    scale: "Atmospheric dynamics",
    title: "Finding order in planetary-scale motion",
    summary: "How do planetary-scale waves move through the atmosphere and interact with its circulation? Robert showed why Earth’s spherical geometry matters for wave propagation, and how atmospheric waveguides direct energy and momentum toward critical lines where they are absorbed.",
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
    summary: "Robert connected atmospheric circulation and radiation with the problem of climate change. His work helped make climate models a way to investigate interacting physical processes, while bringing soils, water, and vegetation into their representation of land.",
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
    summary: "Robert deepened the physical description of the land surface and helped make land models testable against observations. Vegetation, soil moisture, and surface energy exchange became processes that could be measured, compared, and improved.",
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
    summary: "Robert brought atmospheric physics, hydrology, ecosystems, biogeochemistry, and satellite observations together to study climate as a coupled Earth system. The question became how exchanges of water, energy, and carbon shape one another.",
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
    summary: "Robert used models and observations together to study drought, vegetation stress, soil-moisture feedbacks, and climate extremes. Satellite measurements offered a way to test whether models captured the behavior of the living land.",
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
    summary: "Robert continued to connect ideas across atmospheric science and Earth-system modeling, returning to first principles as new models and observations emerged. Collaboration and mentorship carried that approach into the work of younger scientists.",
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

const legacyThreads: LegacyThread[] = [
  { id: "atmospheric-dynamics", title: "Atmospheric dynamics", text: "Planetary waves, circulation, radiation, and the physics that set atmospheres in motion." },
  { id: "climate-change", title: "Climate change", text: "Physical understanding of radiative forcing, greenhouse warming, climate sensitivity, and feedbacks." },
  { id: "climate-modeling", title: "Climate modeling", text: "Models used not merely to predict, but to reveal how interacting processes create climate." },
  { id: "land-atmosphere", title: "Land–atmosphere interactions", text: "Vegetation, soils, water, snow, roots, and surface energy made active parts of the climate system." },
  { id: "observation-space", title: "Observation from space", text: "Remote sensing used to confront models with the changing temperature and condition of land." },
  { id: "coupled-earth", title: "A coupled Earth", text: "Water, energy, carbon, ecosystems, and human influence brought into one scientific picture." },
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
  { title: "Planetary atmospheres", text: "Global circulation, radiation, and upper-atmosphere modeling for Earth, Venus, and Mars.", threadIds: ["atmospheric-dynamics", "climate-modeling"] },
  { title: "Tropical deforestation", text: "How land-cover change in the Amazon reshapes regional energy, water, and climate.", threadIds: ["land-atmosphere", "climate-change", "coupled-earth"] },
  { title: "Regional climate modeling", text: "Early development of regional models for resolving climate processes below the global scale.", threadIds: ["climate-modeling", "climate-change"] },
  { title: "Carbon & nitrogen cycles", text: "Coupling biogeochemistry with water and energy cycles in land and Earth-system models.", threadIds: ["land-atmosphere", "coupled-earth"] },
  { title: "Dynamic vegetation", text: "Representing vegetation change as an active part of climate and Earth-system feedbacks.", threadIds: ["land-atmosphere", "coupled-earth"] },
  { title: "Solar geoengineering", text: "Early analysis of deliberate changes to Earth’s energy balance and their climatic implications.", threadIds: ["climate-change", "climate-modeling"] },
  { title: "Hydrology & drought", text: "Soil moisture, evapotranspiration, groundwater, drought, and land–climate feedbacks.", threadIds: ["land-atmosphere", "coupled-earth"] },
  { title: "Aerosols & radiation", text: "Radiative effects of aerosols, greenhouse gases, and atmospheric composition across climate scales.", threadIds: ["atmospheric-dynamics", "climate-change"] },
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
  "nav.events": "Events",
  "nav.gallery": "Gallery",
  "nav.memories": "Memories",

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
  "home.legacyTitle": "Science that changed how we see Earth",
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

  "life.photosKicker": "Early years",
  "life.photosTitle": "Early life in photographs",
  "life.photosEmpty": "Photographs from Robert’s early years will be shared here.",
  "life.heroKicker": "His Life",
  "life.heroTitle": "A curious mind. A generous spirit.",
  "life.heroIntro": "Robert’s beginnings, his path through life, and the curiosity and generosity colleagues remember.",
  "life.years": "1940–2026",
  "life.mentorQuote": "For Robert, the people he collaborated with—from students and postdocs to colleagues at every career stage—were among the greatest highlights of his life in science.",
  "life.mentorText": "His influence continues through the questions they ask, the models they build, and the people they mentor in turn.",
  "life.sourcesIntro": "Biographical information was drawn from Robert’s curriculum vitae and institutional sources.",
  "life.sourceJacksonLabel": "Jackson School profile",
  "life.sourceJacksonUrl": "https://www.jsg.utexas.edu/researcher/robert_dickinson/",
  "life.sourceNasLabel": "National Academy of Sciences",
  "life.sourceNasUrl": "https://www.nasonline.org/directory-entry/robert-e-dickinson-75xqut/",

  "legacy.heroKicker": "Scientific Legacy",
  "legacy.heroTitle": "Science that changed how we see Earth",
  "legacy.heroIntro": "The questions Robert asked, the ideas he advanced, and the ways his work changed our understanding of Earth.",
  "legacy.scaleKicker": "A widening scientific horizon",
  "legacy.scaleTitle": "He repeatedly changed the scale of the problem.",
  "legacy.scaleIntro": "Across six decades, each question opened into a larger one—without losing the physical clarity of the question that came before it.",
  "legacy.chaptersLabel": "Scientific contributions",
  "legacy.focusLabel": "Scientific focus",
  "legacy.contributionsLabel": "Key contributions",
  "legacy.impactLabel": "Legacy",
  "legacy.publicationLabel": "Landmark publication",
  "legacy.photoCredit": "Photo shared for the Robert E. Dickinson memorial.",
  "legacy.threadsKicker": "Ideas that connect his work",
  "legacy.threadsTitle": "Enduring research threads",
  "legacy.threadsIntro": "These research threads connect Robert’s discoveries across decades, from atmospheric motion to the coupled Earth system.",
  "legacy.frontiersKicker": "Beyond the central threads",
  "legacy.frontiersTitle": "Other frontiers he helped open",
  "legacy.frontiersIntro": "Robert’s range extended well beyond the six enduring threads. These smaller constellations show important areas where his ideas opened new questions, models, and communities.",
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
  "memories.shareKicker": "Add your voice",
  "memories.shareTitle": "Share a memory",
  "memories.shareText": "A conversation after seminar. A line of code he helped untangle. The question that changed your research. Small stories often reveal the truest measure of a mentor’s life.",
  "memories.moderation": "Every submission and photograph is reviewed before appearing publicly.",
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
  "memories.formStoryPlaceholder": "Tell us what you remember…",
  "memories.formPhoto": "Add a photo",
  "memories.formPhotoHelp": "JPG, PNG or WebP · up to 8 MB",
  "memories.formConsent": "I give permission for this story and photo to be published on this memorial site after review.",
  "memories.formSubmit": "Submit for review",
  "memories.formSending": "Sending…",
  "memories.successTitle": "Your story is safely with us.",
  "memories.successMessage": "Thank you. Your memory has been received for review.",
  "memories.shareAnother": "Share another memory",
  "memories.formError": "Please try again.",

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
  portrait: { asset: "robert-dickinson.jpg", objectKey: null, alt: "Robert E. Dickinson outdoors" },
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

export async function getSiteContent(): Promise<SiteContent> {
  if (!env.DB) return defaultContent;
  try {
    const result = await env.DB.prepare("SELECT key, value FROM site_content").all<{ key: string; value: string }>();
    const values = Object.fromEntries((result.results ?? []).map((row) => [row.key, row.value]));
    return {
      lifePhotos: parseJson<LifePhoto[]>(values.lifePhotos, []),
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
      secondaryLegacyTopics: parseJson(values.secondaryLegacyTopics, defaultContent.secondaryLegacyTopics),
      lifeMilestones: parseJson<LifeMilestone[]>(values.lifeMilestones, defaultContent.lifeMilestones).map((item) => ({ ...item, text: reviseEditorialText(item.text) })),
      legacyChapters: parseJson<LegacyChapter[]>(values.legacyChapters, defaultContent.legacyChapters).map((chapter) => ({ ...chapter, summary: reviseEditorialText(chapter.summary) })),
      legacyThreads: parseJson(values.legacyThreads, defaultContent.legacyThreads),
      communityQuotes: parseJson(values.communityQuotes, defaultContent.communityQuotes),
      honors: parseJson(values.honors, defaultContent.honors),
      honorsNote: values.honorsNote || defaultContent.honorsNote,
      pageCopy: (() => {
        const saved = parseJson<Record<string, string>>(values.pageCopy, {});
        Object.keys(saved).filter((key) => key.startsWith("legacy.voices")).forEach((key) => delete saved[key]);
        return Object.fromEntries(Object.entries({ ...defaultContent.pageCopy, ...saved }).map(([key, value]) => [key, reviseEditorialText(value)]));
      })(),
      siteAssets: { ...defaultContent.siteAssets, ...parseJson(values.siteAssets, {}) },
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
