export const siteConfig = {
  title: 'NLP Applications Group',
  shortTitle: 'NLP',
  description:
    'The NLP Applications Group at Dublin City University develops research-led language technology, multilingual NLP, and responsible AI for academic and real-world impact.',
  mission:
    'We build language technologies that combine strong research foundations with practical value for collaborators, communities, and applied partners.',
  url: 'https://example.invalid/brian-davis-research-group',
  ogImage: '/og-image.svg',
  nav: [
    { label: 'Overview', href: '#overview' },
    { label: 'Research', href: '#research' },
    { label: 'Publications', href: '#publications' },
    { label: 'People', href: '#people' },
    { label: 'Contact', href: '#contact' },
  ],
  partnerLogos: [
    {
      label: 'Google',
      href: 'https://about.google/',
      category: 'Industry',
      image: '/images/partners/google.svg',
      imageAlt: 'Google logo',
      logoClass: 'max-h-8',
      logoImageClass: 'logo-tone-muted',
    },
    {
      label: 'TransPerfect',
      href: 'https://www.transperfect.com/',
      category: 'Industry',
      image: '/images/partners/transperfect.png',
      imageAlt: 'TransPerfect logo',
      logoClass: 'max-h-10',
      logoImageClass: 'logo-tone-muted',
    },
    {
      label: 'Webwise',
      href: 'https://www.webwise.ie/',
      category: 'Education',
      image: '/images/partners/webwise.png',
      imageAlt: 'Webwise logo',
      logoClass: 'max-h-10',
      logoImageClass: 'logo-tone-muted',
    },
    {
      label: 'DCU Anti-Bullying Centre',
      href: 'https://antibullyingcentre.ie/',
      category: 'Research',
      image: '/images/partners/dcu-abc-official.jpg',
      imageAlt: 'DCU Anti-Bullying Centre logo',
      logoClass: 'max-h-14',
      logoImageClass: 'logo-tone-solid',
    },
    {
      label: 'Dublin City University',
      href: 'https://www.dcu.ie/',
      category: 'Academic',
      image: '/images/partners/dcu-official.png',
      imageAlt: 'Dublin City University logo',
      logoClass: 'max-h-12',
      logoImageClass: 'logo-tone-light',
    },
    {
      label: 'DCU School of Computing',
      href: 'https://www.dcu.ie/computing',
      category: 'Academic',
      image: '/images/partners/dcu-computing-official.png',
      imageAlt: 'DCU School of Computing logo',
      logoClass: 'max-h-14',
      logoImageClass: 'logo-tone-solid',
    },
  ],
  homeFeatured: {
    researchThemes: [
      'trustworthy-language-models',
      'multilingual-language-technology',
      'applied-research-partnerships',
    ],
    people: [
      'brian-davis',
      'joachim-wagner',
      'kanishk-verma',
      'sri-balaaji-natarajan-kalaivendan',
      'chinonso-cynthia-osuji',
    ],
    projects: ['cilter', 'bullybench', 'pipeline-data-to-text-generation'],
  },
  homeSections: {
    overview: {
      eyebrow: 'Dublin City University',
      titleLines: [
        'Research-led language technology',
        'for thoughtful collaboration',
      ],
      title: 'Research-led language technology for thoughtful collaboration',
      description:
        'The NLP Applications Group at Dublin City University develops NLP, multilingual systems, and responsible AI with a focus on rigorous research, practical value, and meaningful collaboration.',
      primaryLabel: 'Contact the team',
      primaryHref: '/contact',
      secondaryLabel: 'Explore research',
      secondaryHref: '/research',
    },
  },
  social: [
    {
      label: 'Brian Davis',
      href: 'https://www.dcu.ie/computing/people/brian-davis',
    },
    { label: 'DCU Computing', href: 'https://www.dcu.ie/computing' },
  ],
  contact: {
    email: 'brian.davis@dcu.ie',
    location: 'School of Computing, Dublin City University',
    institution: 'DCU School of Computing',
  },
  researchThemes: [
    {
      id: 'trustworthy-language-models',
      title: 'Trustworthy Language Models',
      description:
        'Evaluation and interpretability methods for language systems that need to be reliable, transparent, and usable in practice.',
    },
    {
      id: 'multilingual-language-technology',
      title: 'Multilingual Language Technology',
      description:
        'Models and datasets that improve access across lower-resource languages, code-switching settings, and Irish-language applications.',
    },
    {
      id: 'human-centred-ai',
      title: 'Human-Centred AI',
      description:
        'Research workflows that keep domain experts, educators, and affected communities meaningfully involved.',
    },
    {
      id: 'applied-research-partnerships',
      title: 'Applied Research Partnerships',
      description:
        'Collaborative work with public-sector and industry partners where research ideas are tested against real constraints.',
    },
  ],
  footerLinks: [
    { label: 'Projects archive', href: '/projects' },
    { label: 'Teaching', href: '/teaching' },
    { label: 'Resources', href: '/resources' },
    { label: 'News archive', href: '/news' },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
