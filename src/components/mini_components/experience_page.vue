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
        <div class="w-1/2 md:w-full flex justify-center items-center text-center flex-col gap-3">
          <h1 class="text-xl sm:text-2xl font-bold text-secondary w-full transition-colors duration-300 group-hover:text-primary">{{ item.college }}</h1>
          <h1 class="text-lg font-medium md:max-w-[220px]">{{ item.position }}</h1>
          <button
            type="button"
            class="text-sm sm:text-xl text-secondary border-2 bg-[#fff5ee] border-secondary p-2 w-full rounded shadow-normal hover:bg-secondary hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
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
        <h2 class="text-2xl md:text-3xl font-bold mb-4 text-primary">{{ selectedExperience.college }}</h2>
        <p class="text-sm md:text-lg mb-6 leading-relaxed" v-html="selectedExperience.description"></p>
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
    position: 'Software Engineer',
    image: '/image/transparent.svg',
    description: `<ul class="ml-3 list-disc">
    <li>Develop and maintain full-stack web applications using <b>Vue.js, HTML, CSS, and Laravel</b>, supporting the company's core software platform and enhancing user experience across multiple product areas.</li>
    <li>Develop <b>Python</b>-based data processing tools, automating workflows for cross-functional teams, reducing processing time by <b>~8 hours/week per team member and $100,000+ in total company time saved</b>.</li>
    <li>Architect ETL pipelines & scripts (<b>Apache Airflow, Python</b>) to extract, transform, and load unstructured data (CSV, XLSX, PDF) into <b>MariaDB</b>, while extracting over <b>4,250,000+ data points</b>.</li>
    <li>Lead Software Engineering initiatives creating Software Documentation (<b>ERD, PRD</b>, etc), and recruit and interview candidates leading to <b>2 hires</b>.</li>
  </ul>`
  },
  {
    college: 'County College of Morris',
    position: 'Software Dev. & IT, Intern',
    image: '/image/college.png',
    description: `<ul class="ml-3 list-disc">
    <li>Developed dynamic macros in <b>VBA & Python</b>, automating business processes and <b>increasing productivity by 50%</b> across the company.</li>
    <li>Provided technical support and troubleshooting for hardware and software issues, ensuring optimal performance for over 200 users across the college.</li>
    <li>Helped in the setup, configuration, and maintenance of servers, workstations, and other IT equipment.</li>
    <li>Designed and implemented <b>SQL queries</b> to support data analysis and reporting needs, reducing manual data manipulation by <b>40%</b>.</li>
  </ul>`
  },
  {
    college: 'County College of Morris',
    position: 'Data Analyst and Research, Intern',
    image: '/image/college.png',
    description: `<ul class="ml-3 list-disc">
    <li>Maintained, cleaned, and updated a <b>Microsoft Excel database</b> tracking student enrollment in continuing education certifications, ensuring <b>data accuracy for over 500,000 records</b>.</li>
    <li>Leveraged <b>Python</b> to manipulate, explore, clean analyze and report data on student enrollment.</li>
    <li>Developed <b>Tableau</b> dashboards visualizing net spend, conducting enrollment analysis and creating key insights.</li>
    <li>Assisted staff on research projects by gathering information and automating processes, leading to a <b>30% reduction in manual data entry tasks</b>, while also providing occasional IT solutions to improve overall efficiency.</li>
      </ul> 
    `
  },
  {
    college: 'LetsPlott Incorporated',
    position: 'Social Media Analyst',
    image: '/image/plott.png',
    description: `<ul class="ml-3 list-disc">
    <li>Implement and monitor A/B tests for website, app, and social media pages, using relevant tools and platforms (e.g., <strong> Google Analytics, Facebook Ads Manager </strong> ), which increased e-commerce sales growth of 20% for 3 quarters. </li>
    <li>Directed all content and strategy on TikTok, YouTube Instagram, and Facebook; Instagram engagement increased by <strong> 50% over 6 months </strong>, 35 million global impressions combined. </li>
    <li>Developed and implemented a social media strategy that increased followers on Instagram by <strong> 30% in 3 months </strong> and engagement by 50% in 6 months. </li>
    <li>Best in App honoree at CES 2022 for our newest advancements in XR and AR within our App, assisted in Awards submission, in-app testing, taking photos, coordinating slides, and more. </li>
    </ul> 
    `
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
