// All site copy lives here, so the 3D site and the plain version can never drift
// apart. `**text**` marks bold. Wording carried over from the previous site.

export const person = {
  name: 'Favio Jasso',
  greeting: "Hi! I'm",
  tagline: 'Lead Software Engineer & AI Startup Founder',
  photo: '/image/favio.png',
  photoAlt: 'Portrait of Favio Jasso',
  resume: '/FavioJassoResume2026.pdf',
  bio: [
    { text: 'Founder & CEO of ' },
    { text: 'Camino Code', href: 'https://caminocode.com' },
    {
      text: ', an Applied AI and Data Science startup transforming New Jersey businesses through intelligent automation. As a Software Engineer at Transparent Energy, I architect full-stack applications, design ETL pipelines, and build automation systems that deliver measurable impact. Currently advancing my expertise in Applied A.I. at the New Jersey Institute of Technology.'
    }
  ]
}

export const education = [
  {
    school: 'New Jersey Institute of Technology',
    degree: 'B.S. in Enterprise Artificial Intelligence',
    honors: null,
    location: 'Newark, NJ',
    date: 'Expected Fall 2027'
  },
  {
    school: 'County College of Morris',
    degree: 'A.A. in Data Analytics & Liberal Arts',
    honors: 'Cum Laude',
    location: 'Randolph, NJ',
    date: 'Fall 2025'
  }
]

export const skills = [
  { name: 'HTML', icon: '/icons/html.svg', color: '#E44D26' },
  { name: 'CSS', icon: '/icons/css.svg', color: '#1172B8' },
  { name: 'Javascript', icon: '/icons/javascript.svg', color: '#FFCA28' },
  { name: 'Bootstrap', icon: '/icons/bootstrap.svg', color: '#563D7C' },
  { name: 'Java', icon: '/icons/java.svg', color: '#E76F00' },
  { name: 'Python', icon: '/icons/python.svg', color: '#2170B0' },
  { name: 'Go', icon: '/icons/go.svg', color: '#00ACD7' },
  { name: 'MySQL', icon: '/icons/mysql.svg', color: '#F8981D' },
  { name: 'DBeaver', icon: '/icons/dbeaver.svg', color: '#45352F' },
  { name: 'Git', icon: '/icons/git.svg', color: '#EE513B' },
  { name: 'R', icon: '/icons/r.svg', color: '#2066B8' },
  { name: 'Microsoft Excel', icon: '/icons/msexcel.svg', color: '#215037' },
  { name: 'Matplotlib', icon: '/icons/matplotlib.svg', color: '#E4925C' },
  { name: 'pandas', icon: '/icons/pandas.svg', color: '#130754' },
  { name: 'Tableau', icon: '/icons/tableau.svg', color: '#E8762C' }
]

export const experience = [
  {
    org: 'Transparent Energy',
    position: 'Lead Software Engineer',
    location: 'Fairfield, NJ',
    date: 'Apr 2025 - Present',
    image: '/image/transparent.svg',
    bullets: [
      'Architect, develop, and maintain full-stack internal platforms (**Vue.js, Laravel, Python, MySQL**) supporting energy pricing, operations, and analytics company-wide.',
      'Designed and implemented **AI-assisted automation pipelines** that eliminated manual analyst workflows, generating **$100,000+ in annual productivity savings**.',
      'Led adoption of AI-augmented engineering practices using **Claude and Cursor**, contributing to a **35%+ increase in delivery velocity** across the team.',
      'Owned delivery reliability, deployments, and operational risk across **AWS-hosted platforms**, introducing monitoring and standardized SDLC practices.'
    ],
    note: 'Earlier role: **Junior Data Engineer / Associate Data Analyst** (Nov 2024 – Apr 2025).'
  },
  {
    org: 'Camino Code LLC',
    position: 'Founder & Chief of Product',
    location: 'Newark, NJ',
    date: 'Jan 2025 - Present',
    image: '/image/CaminoCodeSquareLogo.png',
    bullets: [
      'Launched **Applied AI and Data-driven SaaS** Services and Consulting company specializing in SaaS tools, Data Automation, ETL engineering, and custom web applications.',
      'Led an agile team of **2-5 developers** through the full SDLC, translating complex business requirements into actionable technical specifications and managing sprint backlogs.',
      'Defined the **product vision and roadmap** for multiple 0-to-1 SaaS MVPs.',
      'Successfully launched **5+ custom automation & web products**, managing stakeholder expectations & alignment.'
    ]
  },
  {
    org: 'County College of Morris',
    position: 'Software Developer & IT Intern',
    location: 'Randolph, NJ',
    date: 'May 2024 - Aug 2024',
    image: '/image/college.png',
    bullets: [
      'Developed dynamic macros in **VBA & Python**, automating business processes and **increasing productivity by 50%** in given roles.',
      'Provided technical support and troubleshooting for hardware and software issues, ensuring optimal performance for **over 200 users** across the college.',
      'Helped in the setup, configuration, and maintenance of servers, workstations, and other IT equipment.',
      'Designed and implemented **SQL queries** to support data analysis and reporting needs, reducing manual data manipulation by **40%**.'
    ]
  },
  {
    org: 'County College of Morris',
    position: 'Data Analyst Intern',
    location: 'Randolph, NJ',
    date: 'May 2023 - May 2024',
    image: '/image/college.png',
    bullets: [
      'Maintained, cleaned, and updated a **Microsoft Excel** records tracking student enrollment in continuing education certifications, ensuring **data accuracy for over 500,000 records**.',
      'Leveraged **Python** to manipulate, explore, clean, analyze and report data on student enrollment.',
      'Developed **Tableau** dashboards visualizing net spend, conducting enrollment analysis and creating key insights.',
      'Assisted staff on research projects by gathering information and automating processes, leading to a **35% reduction in manual data entry tasks**.'
    ]
  }
]

export const leadership = [
  {
    org: 'NJIT Center of Student Entrepreneurship',
    position: 'Peer Entrepreneur in Residence',
    location: 'Newark, NJ',
    date: 'Feb 2026 - Present',
    bullets: [
      'Helped **5+ early-stage startups** gain entry into the **NSF Regional I-Corps** program and supported teams that have collectively raised **$25,000+ in NSF funding**.',
      'Served as **Technical Lead** for **3 startup teams**, conducting customer discovery, competitive analysis, market research, and business model evaluation aligned with venture analyst responsibilities.'
    ]
  }
]

// The old cards were titled by role. Each disc now needs a title to print on its
// label, so the project name comes first and the role stays as the subtitle.
export const projects = [
  {
    title: 'Camino Code',
    role: 'Founder & Chief of Product',
    image: '/image/CaminoCodeSquareLogo.png',
    description:
      'Applied AI startup delivering 5+ projects with ongoing clients. Transforming businesses through intelligent automation and machine learning solutions.',
    links: [{ label: 'Visit Website', href: 'https://caminocode.com' }],
    colors: ['#ff8800', '#ffb740', '#c66800']
  },
  {
    title: 'D3D',
    role: 'Front-End Developer',
    image: '/image/ap.png',
    description:
      'Hackathon project for HackTCNJ2024. Built a 3D augmented reality environment using HTML, CSS, JavaScript, A-Frame, and Three.js.',
    links: [
      { label: 'Github', href: 'https://github.com/FavioJasso/D3DFrontend' },
      { label: 'Video', href: 'https://youtu.be/_2OsnLILwTI' }
    ],
    colors: ['#4a3ce0', '#8d7dff', '#2b1f9c']
  },
  {
    title: 'A.S.A. DataFest 2024',
    role: 'Analyst & Team Captain',
    image: '/image/asa.png',
    description:
      'Won Best Statistical Analysis at A.S.A. Data Fest 2024. Analyzed 3+ million data points demonstrating advanced Data Science techniques.',
    links: [
      {
        label: 'Presentation',
        href: 'https://drive.google.com/file/d/1pu0Z-T2j5GHh1wjnm0cjQdD2ENWWBx1o/view'
      },
      { label: 'Video', href: 'https://youtu.be/G3K2Pz4gKl0?si=VYJFETQ8ZBMEP0eU' }
    ],
    colors: ['#0d8f8a', '#37c9b6', '#0a5c63']
  }
]

export const contact = {
  heading: 'Connect with me!',
  quote: 'Always open to collaborations and helping builders bring their ideas to life.',
  socials: [
    { label: 'LinkedIn', value: 'in/faviojasso', href: 'https://www.linkedin.com/in/faviojasso/' },
    { label: 'GitHub', value: 'FavioJasso', href: 'https://github.com/FavioJasso' },
    { label: 'Email', value: 'faviojasso@gmail.com', href: 'mailto:faviojasso@gmail.com' },
    { label: 'Phone', value: '(973) 234-2073', href: 'tel:+19732342073' }
  ],
  emailjs: {
    // These are EmailJS's browser-side identifiers, public by design.
    service: 'service_wctmbgh',
    template: 'template_2xgtcqw',
    publicKey: 'nKYHmb69A350_7kwn'
  }
}

export const disclaimer =
  'An original tribute to the home consoles of the early 2000s. Not affiliated with or endorsed by Nintendo.'

export const sections = [
  { id: 'profile', path: '/profile', label: 'Profile', blurb: 'Who I am and where I studied', shape: 'profile' },
  { id: 'discs', path: '/discs', label: 'Discs', blurb: 'Projects you can pick up and spin', shape: null },
  { id: 'memory', path: '/memory-card', label: 'Memory Card', blurb: 'Experience and leadership saves', shape: 'card' },
  { id: 'skills', path: '/skills', label: 'Skills', blurb: 'The blocks I build with', shape: 'skills' },
  { id: 'connect', path: '/connect', label: 'Connect', blurb: 'Plug in and say hello', shape: 'connect' }
]

/** One block per month, the way a memory card counts saves. */
export function blocksFor(date, now = new Date()) {
  const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
  const m = date.match(/([A-Z][a-z]{2}) (\d{4}) - (?:([A-Z][a-z]{2}) (\d{4})|Present)/)
  if (!m) return 1
  const start = +m[2] * 12 + months[m[1]]
  const end = m[3] ? +m[4] * 12 + months[m[3]] : now.getFullYear() * 12 + now.getMonth()
  return Math.max(1, end - start)
}

/** Splits `**bold**` copy into runs that a template can render without v-html. */
export function runs(text) {
  return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) =>
    part.startsWith('**') ? { bold: true, text: part.slice(2, -2) } : { bold: false, text: part }
  )
}
