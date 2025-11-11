<template>
  <div class="wrapper px-0 md:px-2 py-5 md:py-10">
    <div
      class="flex items-center text-center py-5 mb-2 md:mb-10 px-2 md:px-10 slide-bottom-to-top opacity-0 translate-y-10"
    >
      <div class="flex-grow h-1 bg-[#ff9000] rounded-xl"></div>
      <h3 class="px-10 text-xl sm:text-3xl md:text-5xl font-bold uppercase text-primary">Skills</h3>
      <div class="flex-grow h-1 bg-[#ff9000] rounded-xl"></div>
    </div>
    <div class="flex justify-around items-center w-full flex-wrap gap-2 p-5 sm:gap-10">
      <div
        class="relative size-[100px] bg-white sm:size-[150px] md:size-[200px] border-2 border-opacity-60 rounded-lg flex justify-around items-center p-2 sm:p-5 hover:scale-110 hover:shadow-lg slide-bottom-to-top opacity-0 translate-y-10 transition-all duration-300 cursor-pointer hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
        v-for="(item, index) in icons"
        :key="index"
        :style="`border-color: ${item.color}`"
        :class="`${item.hoverColor}`"
        @mouseover="showSkillName(item.name)"
        @mouseleave="hideSkillName"
        tabindex="0"
        @focus="showSkillName(item.name)"
        @blur="hideSkillName"
      >
        <img
          class="size-[150px] w-full object-contain object-center"
          :src="item.url"
          :alt="item.name + ' icon'"
        />
        <div
          v-if="showDialog && currentSkill === item.name"
          class="absolute inset-x-0 -top-10 sm:-top-12 md:-top-16 flex items-center justify-center text-white text-xs sm:text-sm text-center md:text-2xl font-bold transition-all duration-300 rounded-xl shadow-lg p-2 animate-bounce-in z-10"
          :class="`${item.skillsNameBackground}`"
          id="skillName"
        >
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showDialog = ref(false)
const currentSkill = ref('')

function showSkillName(name) {
  currentSkill.value = name
  showDialog.value = true
}

function hideSkillName() {
  showDialog.value = false
  currentSkill.value = ''
}

const icons = [
  {
    name: 'HTML',
    url: '/icons/html.svg',
    color: '#E44D26',
    skillsNameBackground: 'bg-[#E44D26]',
    hoverColor: 'hover:bg-[#ffece5]'
  },
  {
    name: 'CSS',
    url: '/icons/css.svg',
    color: '#1172B8',
    skillsNameBackground: 'bg-[#1172B8]',
    hoverColor: 'hover:bg-[#e9eef7]'
  },
  {
    name: 'Javascript',
    url: '/icons/javascript.svg',
    color: '#FFCA28',
    skillsNameBackground: 'bg-[#FFCA28]',
    hoverColor: 'hover:bg-[#fff9e9]'
  },
  {
    name: 'Bootstrap',
    url: '/icons/bootstrap.svg',
    color: '#563D7C',
    skillsNameBackground: 'bg-[#563D7C]',
    hoverColor: 'hover:bg-[#ebe8f0]'
  },
  {
    name: 'Java',
    url: '/icons/java.svg',
    color: '#E76F00',
    skillsNameBackground: 'bg-[#E76F00]',
    hoverColor: 'hover:bg-[#ffefe4]'
  },
  {
    name: 'Python',
    url: '/icons/python.svg',
    color: '#2170B0',
    skillsNameBackground: 'bg-[#2170B0]',
    hoverColor: 'hover:bg-[#e9eef6]'
  },
  {
    name: 'Go',
    url: '/icons/go.svg',
    color: '#00ACD7',
    skillsNameBackground: 'bg-[#00ACD7]',
    hoverColor: 'hover:bg-[#ebf6fb]'
  },
  {
    name: 'MySQL',
    url: '/icons/mysql.svg',
    color: '#F8981D',
    skillsNameBackground: 'bg-[#F8981D]',
    hoverColor: 'hover:bg-[#fff3e7]'
  },
  {
    name: 'DBeaver',
    url: '/icons/dbeaver.svg',
    color: '#45352F',
    skillsNameBackground: 'bg-[#45352F]',
    hoverColor: 'hover:bg-[#e9e6e5]'
  },
  {
    name: 'Git',
    url: '/icons/git.svg',
    color: '#EE513B',
    skillsNameBackground: 'bg-[#EE513B]',
    hoverColor: 'hover:bg-[#ffede7]'
  },
  {
    name: 'R',
    url: '/icons/r.svg',
    color: '#2066B8',
    skillsNameBackground: 'bg-[#2066B8]',
    hoverColor: 'hover:bg-[#e9edf7]'
  },
  {
    name: 'Microsoft Excel',
    url: '/icons/msexcel.svg',
    color: '#215037',
    skillsNameBackground: 'bg-[#215037]',
    hoverColor: 'hover:bg-[#e5eae7]'
  },
  {
    name: 'Matplotlib',
    url: '/icons/matplotlib.svg',
    color: '#E4925C',
    skillsNameBackground: 'bg-[#E4925C]',
    hoverColor: 'hover:bg-[#fef3ec]'
  },
  {
    name: 'pandas',
    url: '/icons/pandas.svg',
    color: '#130754',
    skillsNameBackground: 'bg-[#130754]',
    hoverColor: 'hover:bg-[#e4e0eb]'
  },
  {
    name: 'Tableau',
    url: '/icons/tableau.svg',
    color: '#E8762C',
    skillsNameBackground: 'bg-[#E8762C]',
    hoverColor: 'hover:bg-[#fff0e7]'
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

@keyframes bounceIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.9);
  }
  50% {
    transform: translateY(2px) scale(1.05);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-bounce-in {
  animation: bounceIn 0.4s ease-out forwards;
}

.slide-up {
  animation: slideFromBottom 0.5s ease forwards;
}

.slide-bottom-to-top {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
</style>
