# Favio Jasso - Portfolio Website

<div align="center">

[![Live Site](https://img.shields.io/badge/Live-faviojasso.com-orange?style=for-the-badge)](https://faviojasso.com)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.4-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

## 👨‍💻 About Me

**Favio Jasso** - Founder & CEO of [Camino Code](https://caminocode.com), an Applied AI and Data Science startup transforming New Jersey businesses through intelligent automation and data-driven solutions.

As a Software Engineer at Transparent Energy, I architect full-stack web applications, design ETL pipelines, and build automation systems that deliver measurable impact. Currently advancing my expertise in Applied A.I. at the New Jersey Institute of Technology.

### What I Do

- 🚀 **Full-Stack Development** - Building scalable web applications with modern frameworks
- 🤖 **Applied AI & Data Science** - Leveraging machine learning and data analytics to solve real business problems
- ⚙️ **Workflow Automation** - Creating systems that save teams time and resources
- 📊 **ETL Pipeline Architecture** - Designing robust data pipelines for enterprise applications

### Get In Touch

Open to collaborations, technical discussions, and helping fellow builders bring their ideas to life.

- 🌐 [Portfolio](https://faviojasso.com)
- 💼 [LinkedIn](https://www.linkedin.com/in/faviojasso/)
- 🐙 [GitHub](https://github.com/FavioJasso)
- 📧 [Email](mailto:faviojasso@gmail.com)

---

## 🛠 Tech Stack

A 3D, console-themed portfolio. The console, stage and audio are generated in code. Photos and logos are the only image files.

- **Framework**: [Vue.js 3](https://vuejs.org/) and [Vue Router](https://router.vuejs.org/) for content, menus and URLs
- **3D**: [three.js](https://threejs.org/) r187 (pinned), [postprocessing](https://github.com/pmndrs/postprocessing)
- **Motion**: [GSAP](https://gsap.com/) for authored sequences, hand-written springs for anything the pointer touches
- **Audio**: synthesized at runtime with the Web Audio API
- **Build Tool**: [Vite](https://vitejs.dev/), plus a prerender step so all content ships as HTML
- **Styling**: [TailwindCSS](https://tailwindcss.com/) base with custom CSS
- **Email Integration**: [EmailJS](https://www.emailjs.com/)

Research and design decisions are in [docs/console-redesign.md](docs/console-redesign.md).

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```sh
# Clone the repository
git clone https://github.com/FavioJasso/favio_jasso.git

# Navigate to project directory
cd favio_jasso

# Install dependencies
npm install
```

### Development

```sh
# Run development server with hot-reload
npm run dev
```

Visit `http://localhost:5173` to view the site locally.

### Production Build

```sh
# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality

```sh
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## 📁 Project Structure

```
favio_jasso/
├── public/              # Static assets (resume, icons, images)
├── scripts/
│   └── prerender.mjs    # Writes the full portfolio into dist/index.html
├── src/
│   ├── data/content.js  # All site copy. Edit content here.
│   ├── components/      # Section panels, plain version, contact form
│   ├── engine/          # three.js scene, boot timeline, audio, quality tiers
│   ├── App.vue          # Phases, routing, keyboard and gamepad input
│   └── main.js          # Application entry point
├── index.html           # HTML entry point and SEO metadata
└── vercel.json          # Serves index.html for section URLs
```

## 🎨 Features

- 💿 **Boot it your way** - Drag a disc into the console, or power on empty for the system menu
- 🧊 **One body of blocks** - The same cubes form the boot monogram and every menu icon
- 🕹 **Every input** - Mouse, touch, keyboard and gamepad
- 🔊 **Original sound** - Every chime, click and whir is synthesized
- ♿ **Plain version** - All content as ordinary HTML at `/plain`, used automatically without WebGL
- 🎯 **Crawlable** - The full portfolio is prerendered into the home page, and each section has a shareable URL
- 📬 **Contact Form** - Integrated email functionality with EmailJS

Handy for testing: `?quality=low|mid|high` forces a quality tier and `?reduced` previews reduced motion.

## 👥 Credits

**Designed & Developed by**: Favio Jasso & John Rey Calesa

## 📄 License

© Favio Jasso. All rights reserved.

---

<div align="center">

**Building the future, one line of code at a time.** 🚀

</div>
