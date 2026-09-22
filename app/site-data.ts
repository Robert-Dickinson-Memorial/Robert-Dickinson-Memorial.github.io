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

export type HomeLegacyCard = {
  title: string;
  text: string;
};

export type LegacyThread = {
  title: string;
  text: string;
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

export type SiteContent = {
  heroIntro: string;
  obituaryStory: string;
  treeTribute: string;
  treeDetail: string;
  bodyFont: string;
  headingFont: string;
  homeLegacyIntro: string;
  homeLegacyTopics: HomeLegacyTopic[];
  homeLegacyCards: HomeLegacyCard[];
  lifeMilestones: LifeMilestone[];
  legacyChapters: LegacyChapter[];
  legacyThreads: LegacyThread[];
  honors: MemorialHonor[];
  honorsNote: string;
  pageCopy: Record<string, string>;
  siteAssets: SiteAssets;
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

const homeLegacyCards: HomeLegacyCard[] = [
  { title: "He changed climate models", text: "Robert helped transform land from a passive boundary into a living, dynamic part of the climate system." },
  { title: "He connected the Earth system", text: "His work joined atmosphere, land, water, vegetation, and carbon into a more faithful picture of Earth." },
  { title: "He multiplied possibility", text: "His deepest influence continues through the students, postdoctoral scholars, and collaborators he guided." },
];

const legacyThreads: LegacyThread[] = [
  { title: "Atmospheric dynamics", text: "Planetary waves, circulation, radiation, and the physics that set atmospheres in motion." },
  { title: "Climate change", text: "Physical understanding of how greenhouse gases and feedbacks reshape the climate system." },
  { title: "Climate modeling", text: "Models used not merely to predict, but to reveal how interacting processes create climate." },
  { title: "Land–atmosphere interactions", text: "Vegetation, soils, water, snow, roots, and surface energy made active parts of the climate system." },
  { title: "Observation from space", text: "Remote sensing used to confront models with the changing temperature and condition of land." },
  { title: "A coupled Earth", text: "Water, energy, carbon, ecosystems, and human influence brought into one scientific picture." },
];

export const defaultPageCopy: Record<string, string> = {
  "global.wordmark": "Robert Dickinson",
  "global.footerName": "Robert E. Dickinson",
  "global.footerText": "Created with love by his academic community.",
  "global.footerHome": "Memorial home ↑",
  "nav.home": "Home",
  "nav.life": "His life",
  "nav.legacy": "Scientific legacy",
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
  "home.storyKicker": "His story",
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
  "home.legacyKicker": "Scientific legacy",
  "home.legacyTitle": "Science that changed how we see Earth",
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

  "life.heroKicker": "His life",
  "life.heroTitle": "A curious mind. A generous spirit.",
  "life.heroIntro": "The story of a scientist who kept widening the questions he asked—and the circle of people he welcomed into them.",
  "life.years": "1940–2026",
  "life.mentorQuote": "For Robert, the people he collaborated with—from students and postdocs to colleagues at every career stage—were among the greatest highlights of his life in science.",
  "life.mentorText": "His influence continues through the questions they ask, the models they build, and the people they mentor in turn.",
  "life.sourcesIntro": "Biographical information was drawn from Robert’s curriculum vitae and institutional sources.",
  "life.sourceJacksonLabel": "Jackson School profile",
  "life.sourceJacksonUrl": "https://www.jsg.utexas.edu/researcher/robert_dickinson/",
  "life.sourceNasLabel": "National Academy of Sciences",
  "life.sourceNasUrl": "https://www.nasonline.org/directory-entry/robert-e-dickinson-75xqut/",

  "legacy.heroKicker": "Scientific legacy",
  "legacy.heroTitle": "Science that changed how we see Earth",
  "legacy.heroIntro": "A chronological journey through the institutions, questions, and enduring ideas that shaped Robert’s work.",
  "legacy.scaleKicker": "A widening scientific horizon",
  "legacy.scaleTitle": "He repeatedly changed the scale of the problem.",
  "legacy.scaleIntro": "Across six decades, each question opened into a larger one—without losing the physical clarity of the question that came before it.",
  "legacy.chaptersLabel": "Career chapters",
  "legacy.focusLabel": "Scientific focus",
  "legacy.contributionsLabel": "Key contributions",
  "legacy.impactLabel": "Legacy",
  "legacy.publicationLabel": "Landmark publication",
  "legacy.photoCredit": "Photo shared for the Robert E. Dickinson memorial.",
  "legacy.threadsKicker": "Across every institution",
  "legacy.threadsTitle": "Enduring research threads",
  "legacy.threadsIntro": "The affiliations mark chapters in Robert’s career. These ideas reveal the deeper continuity running through them.",
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
  heroIntro: "Pioneering climate scientist, visionary Earth-system modeler, devoted teacher, and generous mentor.",
  obituaryStory: [
    "Robert Earl Dickinson helped change how humanity understands the living Earth.",
    "Born in Millersburg, Ohio, and raised in Minnesota, Robert carried an expansive curiosity into a lifetime of science. He studied chemistry and physics at Harvard University, graduating in 1961, then turned to meteorology at the Massachusetts Institute of Technology, earning his master’s degree in 1962 and Ph.D. in 1966.",
    "He joined the National Center for Atmospheric Research in 1968. Early in his career, he advanced understanding of how planetary waves transfer energy through the atmosphere. Later, as a leader in NCAR’s Climate and Global Dynamics Division, he confronted a central weakness in the era’s climate models: land was treated largely as a passive store of water. Robert helped recast it as a dynamic system of soils, plants, water, energy, and carbon.",
    "That insight reshaped global climate modeling. His pioneering work brought vegetation and land-surface processes into climate models and helped establish the intellectual foundations of modern Earth-system science. Across six decades, his research connected atmospheric dynamics with hydrology, drought, remote sensing, aerosols, tropical deforestation, and the terrestrial carbon cycle.",
    "Robert held professorships at the University of Arizona and Georgia Tech before joining The University of Texas at Austin in 2008. At UT’s Jackson School of Geosciences, he was known not only as a giant of climate science, but as a patient and exacting mentor. After retiring from UT in 2018, he continued as a Distinguished Professor in Residence at UCLA, remaining active in research, collaboration, and mentorship.",
    "His deepest legacy lives in both the models that now describe a more complete Earth and the people he trained to ask better questions of it.",
  ].join("\n\n"),
  treeTribute: "Robert grew up in Minnesota. A memorial tree in the Chippewa National Forest honors that connection while helping restore a landscape of pine, spruce, cedar, lakes, and headwater streams.",
  treeDetail: "Reforestation projects in the Chippewa restore native trees, strengthen wildlife habitat—including habitat for bald eagles—and improve the forest’s resilience to wind damage, insects, disease, and a changing climate.",
  bodyFont: "system-sans",
  headingFont: "classic-serif",
  homeLegacyIntro: "Rather than a single linear path, Bob’s work formed a connected scientific landscape: ideas in atmospheric dynamics, climate change, modeling, land–atmosphere exchange, and observations from space continually informed one another.",
  homeLegacyTopics,
  homeLegacyCards,
  lifeMilestones,
  legacyChapters,
  legacyThreads,
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
      heroIntro: values.heroIntro || defaultContent.heroIntro,
      obituaryStory: values.obituaryStory || defaultContent.obituaryStory,
      treeTribute: values.treeTribute || defaultContent.treeTribute,
      treeDetail: values.treeDetail || defaultContent.treeDetail,
      bodyFont: values.bodyFont || defaultContent.bodyFont,
      headingFont: values.headingFont || defaultContent.headingFont,
      homeLegacyIntro: values.homeLegacyIntro || defaultContent.homeLegacyIntro,
      homeLegacyTopics: parseJson(values.homeLegacyTopics, defaultContent.homeLegacyTopics),
      homeLegacyCards: parseJson(values.homeLegacyCards, defaultContent.homeLegacyCards),
      lifeMilestones: parseJson(values.lifeMilestones, defaultContent.lifeMilestones),
      legacyChapters: parseJson(values.legacyChapters, defaultContent.legacyChapters),
      legacyThreads: parseJson(values.legacyThreads, defaultContent.legacyThreads),
      honors: parseJson(values.honors, defaultContent.honors),
      honorsNote: values.honorsNote || defaultContent.honorsNote,
      pageCopy: { ...defaultContent.pageCopy, ...parseJson(values.pageCopy, {}) },
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
