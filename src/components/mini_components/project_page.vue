<template>
  <div class="wrapper px-0 md:px-2 py-5 md:py-10">
    <div class="flex items-center text-center py-5 mb-2 md:mb-8 px-2 md:px-10">
      <div class="flex-grow h-1 bg-[#ff9000] rounded-xl"></div>
      <h3 class="px-10 text-xl sm:text-3xl md:text-5xl font-bold uppercase text-primary">
        Projects
      </h3>
      <div class="flex-grow h-1 bg-[#ff9000] rounded-xl"></div>
    </div>
    <div class="flex justify-center w-full flex-wrap gap-2 sm:gap-5">
      <div
        v-for="(item, index) in experiences"
        :key="index"
        class="project-item border-2 bg-white border-gray-200 border-opacity-60 rounded-xl p-3 md:p-5 gap-3 flex flex-col justify-start items-center w-full md:w-[calc(33.333%-1rem)] lg:w-[calc(31%-1rem)] hover:shadow-2xl shadow-normal transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:border-orange-300"
        :class="{
          'slide-from-left': index === 0,
          'slide-from-right': index === experiences.length - 1,
          'slide-from-bottom': index > 0 && index < experiences.length - 1
        }"
        ref="projectItem"
      >
        <div class="w-full flex justify-center items-center p-2">
          <img
            class="rounded-lg object-contain w-full h-48 md:h-56"
            :src="item.image"
            :alt="item.description"
          />
        </div>
        <div class="w-full flex flex-col justify-start text-center items-center gap-3 flex-grow">
          <h1 class="text-lg sm:text-xl md:text-2xl font-bold">{{ item.position }}</h1>
          <p class="text-sm md:text-base text-gray-700 leading-relaxed">
            {{ item.description }}
          </p>
          <div class="w-full flex flex-col sm:flex-row gap-3 mt-auto">
            <a
              :href="item.link"
              target="_blank"
              class="text-sm sm:text-xl w-full text-secondary border-2 bg-[#fff5ee] border-secondary p-2 rounded shadow-normal hover:bg-secondary hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 text-center font-semibold"
            >
              {{ item.button }}
            </a>
            <a
              v-if="item.videoLink"
              :href="item.videoLink"
              target="_blank"
              class="text-sm sm:text-xl text-secondary border-2 bg-[#fff5ee] border-secondary p-2 w-full rounded shadow-normal hover:bg-secondary hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 text-center font-semibold"
              >Video</a
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
const experiences = [
  {
    position: 'Founder & CEO',
    image: '/image/CaminoCodeSquareLogo.png',
    description:
      'Applied AI startup delivering 5+ projects with ongoing clients. Transforming businesses through intelligent automation and machine learning solutions.',
    button: 'Visit Website',
    link: 'https://caminocode.com',
    videoLink: null
  },
  {
    position: 'Front—End Developer',
    image: '/image/ap.png',
    description:
      'Hackathon project for HackTCNJ2024. Built a 3D augmented reality environment using HTML, CSS, JavaScript, A-Frame, and Three.js.',
    button: 'Github',
    link: 'https://github.com/FavioJasso/D3DFrontend',
    videoLink: 'https://youtu.be/_2OsnLILwTI'
  },
  {
    position: 'Analyst & Team Captain',
    image: '/image/asa.png',
    description:
      'Won Best Statistical Analysis at A.S.A. Data Fest 2024. Analyzed 3+ million data points demonstrating advanced Data Science techniques.',
    button: 'Presentation',
    link: 'https://drive.google.com/file/d/1pu0Z-T2j5GHh1wjnm0cjQdD2ENWWBx1o/view',
    videoLink: 'https://youtu.be/G3K2Pz4gKl0?si=VYJFETQ8ZBMEP0eU'
  }
]

const handleScroll = () => {
  const elements = document.querySelectorAll('.project-item')
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target
          if (
            element.classList.contains('slide-from-left') ||
            element.classList.contains('slide-from-right') ||
            element.classList.contains('slide-from-bottom')
          ) {
            element.classList.add('animate')
          } else {
            element.classList.remove('animate')
          }
        }
      })
    },
    { threshold: 0.1 }
  )

  elements.forEach((element) => {
    observer.observe(element)
  })
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll)
})
</script>
<style scoped>
@keyframes slideInFromLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInFromBottom {
  from {
    transform: translateY(50px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.project-item {
  opacity: 0;
  animation: none;
  transition: all 0.3s ease;
}

.project-item.slide-from-left.animate {
  animation: slideInFromLeft 0.6s forwards;
}

.project-item.slide-from-right.animate {
  animation: slideInFromRight 0.6s forwards;
}

.project-item.slide-from-bottom.animate {
  animation: slideInFromBottom 0.6s forwards;
}

.project-item:hover img {
  transform: scale(1.05);
  transition: transform 0.3s ease;
}
</style>
