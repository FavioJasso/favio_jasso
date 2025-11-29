<template>
  <div class="wrapper px-0 md:px-2 py-5 md:py-10">
    <div
      class="flex items-center text-center py-5 mb-2 md:mb-10 px-2 md:px-10 slide-bottom-to-top opacity-0 translate-y-10"
    >
      <div class="flex-grow h-1 bg-[#ff9000] rounded-xl"></div>
      <h3 class="px-10 text-xl sm:text-3xl md:text-5xl font-bold uppercase text-primary">
        Experience
      </h3>
      <div class="flex-grow h-1 bg-[#ff9000] rounded-xl"></div>
    </div>
    <div class="flex justify-center w-full flex-wrap gap-2 sm:gap-5">
      <div
        v-for="(item, index) in experiences"
        :key="index"
        class="experience-item border-2 bg-white border-gray-200 border-opacity-60 rounded-xl p-5 lg:p-10 m-2 flex justify-between items-center gap-5 md:flex-col w-full md:w-[40%] lg:w-[30%] hover:shadow-2xl shadow-normal slide-bottom-to-top opacity-0 translate-y-10 transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:border-orange-300 cursor-pointer"
        ref="experienceItem"
      >
        <div class="w-1/2 md:w-full flex justify-center items-center flex-col gap-3">
          <img
            class="w-full object-contain object-center size-[125px] sm:size-[150px] md:size-[200px]"
            :src="item.image"
            :alt="item.college + ' icon'"
          />
        </div>
        <div class="w-1/2 md:w-full flex justify-center items-center text-center flex-col gap-2">
          <h1 class="text-xl sm:text-2xl font-bold text-secondary w-full transition-colors duration-300">{{ item.college }}</h1>
          <h2 class="text-base md:text-lg font-semibold text-gray-700">{{ item.position }}</h2>
          <div class="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-sm text-gray-500">
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {{ item.location }}
            </span>
            <span class="hidden sm:block">•</span>
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ item.date }}
            </span>
          </div>
          <button
            type="button"
            class="text-sm sm:text-lg text-secondary border-2 bg-[#fff5ee] border-secondary p-2 w-full rounded shadow-normal hover:bg-secondary hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 mt-2"
            @click="openPopup(item)"
          >
            Read More
          </button>
        </div>
      </div>
    </div>
    <div
      v-if="showDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 p-4"
      @click.self="closePopup"
    >
      <div class="bg-white p-5 md:p-8 rounded-xl max-w-4xl w-full border-2 border-primary-light shadow-2xl transform transition-all duration-300 animate-modal-in max-h-[90vh] overflow-y-auto scrollbar">
        <div class="mb-6">
          <h2 class="text-2xl md:text-3xl font-bold text-primary">{{ selectedExperience.college }}</h2>
          <h3 class="text-lg md:text-xl font-semibold text-gray-700 mt-1">{{ selectedExperience.position }}</h3>
          <div class="flex flex-wrap items-center gap-4 mt-2 text-sm md:text-base text-gray-500">
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {{ selectedExperience.location }}
            </span>
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ selectedExperience.date }}
            </span>
          </div>
        </div>
        <div class="text-sm md:text-lg mb-6 leading-relaxed" v-html="selectedExperience.description"></div>
        <div class="flex justify-end items-center w-full">
          <button
            @click="closePopup"
            class="text-white bg-primary px-6 py-3 rounded-lg hover:bg-orange-700 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const experiences = [
  {
    college: 'Transparent Energy',
    position: 'Lead Software Engineer',
    location: 'Fairfield, NJ',
    date: 'Nov 2024 - Present',
    image: '/image/transparent.svg',
    description: `<ul class="ml-3 list-disc space-y-2">
    <li>Developed and maintained full-stack applications (<b>Vue.js, Laravel, MySQL</b>) powering internal platforms which host operations company-wide.</li>
    <li>Led product development initiatives for internal workflow automation, saving <b>$100,000+ in annual analyst time</b> and improving operational efficiency across multiple departments.</li>
    <li>Built <b>Python-driven data extraction</b> and transformation workflows to load unstructured data (CSV, XLSX, PDF) into MySQL, processing <b>15 Million+ data points</b>.</li>
    <li>Led initiatives by designing cloud-integrated solutions on <b>AWS</b> & implemented <b>Datadog</b> monitoring for stability, observability, and user-impact tracking.</li>
  </ul>`
  },
  {
    college: 'Camino Code LLC',
    position: 'Founder & Chief of Product',
    location: 'Newark, NJ',
    date: 'Jan 2025 - Present',
    image: '/image/CaminoCodeSquareLogo.png',
    description: `<ul class="ml-3 list-disc space-y-2">
    <li>Launched <b>Applied AI and Data-driven SaaS</b> Services and Consulting company specializing in SaaS tools, Data Automation, ETL engineering, and custom web applications.</li>
    <li>Led an agile team of <b>2-5 developers</b> through the full SDLC, translating complex business requirements into actionable technical specifications and managing sprint backlogs.</li>
    <li>Defined the <b>product vision and roadmap</b> for multiple 0-to-1 SaaS MVPs.</li>
    <li>Successfully launched <b>5+ custom automation & web products</b>, managing stakeholder expectations & alignment.</li>
  </ul>`
  },
  {
    college: 'County College of Morris',
    position: 'Software Developer & IT Intern',
    location: 'Randolph, NJ',
    date: 'May 2024 - Aug 2024',
    image: '/image/college.png',
    description: `<ul class="ml-3 list-disc space-y-2">
    <li>Developed dynamic macros in <b>VBA & Python</b>, automating business processes and <b>increasing productivity by 50%</b> in given roles.</li>
    <li>Provided technical support and troubleshooting for hardware and software issues, ensuring optimal performance for <b>over 200 users</b> across the college.</li>
    <li>Helped in the setup, configuration, and maintenance of servers, workstations, and other IT equipment.</li>
    <li>Designed and implemented <b>SQL queries</b> to support data analysis and reporting needs, reducing manual data manipulation by <b>40%</b>.</li>
  </ul>`
  },
  {
    college: 'County College of Morris',
    position: 'Data Analyst Intern',
    location: 'Randolph, NJ',
    date: 'May 2023 - May 2024',
    image: '/image/college.png',
    description: `<ul class="ml-3 list-disc space-y-2">
    <li>Maintained, cleaned, and updated a <b>Microsoft Excel</b> records tracking student enrollment in continuing education certifications, ensuring <b>data accuracy for over 500,000 records</b>.</li>
    <li>Leveraged <b>Python</b> to manipulate, explore, clean, analyze and report data on student enrollment.</li>
    <li>Developed <b>Tableau</b> dashboards visualizing net spend, conducting enrollment analysis and creating key insights.</li>
    <li>Assisted staff on research projects by gathering information and automating processes, leading to a <b>35% reduction in manual data entry tasks</b>.</li>
  </ul>`
  }
]

const showDialog = ref(false)
const selectedExperience = ref({})

const openPopup = (experience) => {
  selectedExperience.value = experience
  showDialog.value = true
}

const closePopup = () => {
  showDialog.value = false
  selectedExperience.value = {}
}

let observer

const handleScroll = () => {
  const elements = document.querySelectorAll('.slide-bottom-to-top')
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('slide-up')
        } else {
          entry.target.classList.remove('slide-up')
        }
      })
    },
    { threshold: 0.3 }
  )

  elements.forEach((element) => {
    observer.observe(element)
  })
}

onMounted(() => {
  handleScroll()
})
</script>

<style scoped>
@keyframes slideFromBottom {
  from {
    opacity: 0;
    transform: translateY(36px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-modal-in {
  animation: modalIn 0.3s ease-out forwards;
}

.slide-up {
  animation: slideFromBottom 0.5s ease forwards;
}

.slide-bottom-to-top {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  opacity: 0;
  transform: translateY(36px);
}

.experience-item {
  transition: all 0.3s ease;
}

.experience-item:hover img {
  transform: scale(1.05);
  transition: transform 0.3s ease;
}
</style>
