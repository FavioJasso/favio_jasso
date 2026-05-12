<template>
  <div class="wrapper px-0 md:px-2 py-5 md:py-10">
    <div
      class="flex items-center text-center py-5 mb-2 md:mb-10 px-2 md:px-10 slide-bottom-to-top opacity-0 translate-y-10"
    >
      <div class="flex-grow h-1 bg-[#ff9000] rounded-xl"></div>
      <h3 class="px-10 text-xl sm:text-3xl md:text-5xl font-bold uppercase text-primary">
        Education
      </h3>
      <div class="flex-grow h-1 bg-[#ff9000] rounded-xl"></div>
    </div>
    <div class="flex justify-center w-full flex-wrap gap-2 sm:gap-5">
      <div
        v-for="(item, index) in education"
        :key="index"
        class="education-item border-2 bg-white border-gray-200 border-opacity-60 rounded-xl p-5 lg:p-8 m-2 flex flex-col justify-center items-center gap-2 w-full md:w-[45%] lg:w-[40%] hover:shadow-2xl shadow-normal slide-bottom-to-top opacity-0 translate-y-10 transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:border-orange-300"
      >
        <h1 class="text-xl sm:text-2xl font-bold text-secondary text-center">{{ item.school }}</h1>
        <h2 class="text-base md:text-lg font-semibold text-gray-700 text-center">
          {{ item.degree }}
        </h2>
        <p v-if="item.honors" class="text-sm md:text-base italic text-primary font-semibold">
          {{ item.honors }}
        </p>
        <div
          class="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-sm text-gray-500 pt-1"
        >
          <span class="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {{ item.location }}
          </span>
          <span class="hidden sm:block">•</span>
          <span class="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {{ item.date }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

const education = [
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

onMounted(() => {
  const elements = document.querySelectorAll('.slide-bottom-to-top')
  const observer = new IntersectionObserver(
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
  elements.forEach((el) => observer.observe(el))
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

.slide-up {
  animation: slideFromBottom 0.5s ease forwards;
}

.slide-bottom-to-top {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.education-item {
  transition: all 0.3s ease;
}
</style>
