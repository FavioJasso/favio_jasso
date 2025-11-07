<script setup></script>

<template>
  <div class="wrapper pt-2 md:pt-10">
    <div
      class="p-0 md:px-5 flex h-auto flex-col md:flex-row justify-around py-2 sm:py-10 lg:py-24 bg-[#FFA640] text-white xl:rounded-t-lg"
    >
      <form
        class="flex flex-col w-full md:max-w-[675px] h-full md:max-h-[587px] gap-3 p-5 md:p-14 md:bg-white rounded-lg"
        @submit.prevent="sendEmail"
      >
        <div class="text-2xl md:text-4xl font-bold text-white md:text-primary">
          Connect with me!
        </div>
        <div class="flex flex-col gap-3">
          <span
            class="text-sm md:text-2xl text-white md:text-primary font-bold uppercase md:capitalize"
          >
            Full Name
          </span>
          <input
            class="w-full bg-white text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-orange-400 border-2"
            v-model="name"
            type="text"
            placeholder="Enter your Name"
            required
          />
        </div>
        <div class="flex flex-col gap-3">
          <span
            class="uppercase md:capitalize text-sm md:text-2xl text-white md:text-primary font-bold"
          >
            Email
          </span>
          <input
            class="w-full bg-white text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline focus:ring-2 border-2 focus:ring-orange-400"
            v-model="email"
            type="email"
            placeholder="Enter your email address"
            required
          />
        </div>
        <div class="flex flex-col gap-3">
          <span
            class="uppercase md:capitalize text-sm md:text-2xl text-white md:text-primary font-bold"
          >
            Message
          </span>
          <textarea
            class="w-full h-32 bg-white text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-orange-400 border-2 resize-1none scrollbar"
            v-model="message"
            placeholder="Enter your Message"
            required
          ></textarea>
        </div>
        <div class="flex flex-col gap-3">
          <button
            class="uppercase text-sm font-bold tracking-wide bg-primary text-gray-100 p-3 rounded-lg w-full focus:outline-none focus:shadow-outline hover:bg-orange-700"
            type="submit"
          >
            Send Message
          </button>
        </div>
      </form>
      <div class="flex flex-col justify-center md:w-1/2 md:pl-14 md:pr-5 py-5 gap-8">
        <div class="flex justify-center md:justify-end gap-3">
          <!-- linkedIn icon -->
          <a href="https://www.linkedin.com/in/faviojasso/" target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="size-12">
              <!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
              <path
                fill="#ffffff"
                d="M100.3 448H7.4V148.9h92.9zM53.8 108.1C24.1 108.1 0 83.5 0 53.8a53.8 53.8 0 0 1 107.6 0c0 29.7-24.1 54.3-53.8 54.3zM447.9 448h-92.7V302.4c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448z"
              />
            </svg>
          </a>
          <!-- phone icon -->
          <a href="tel:+9732342073">
            <svg xmlns="http://www.w3.org/2000/svg" class="size-12" viewBox="0 0 384 512">
              <!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
              <path
                fill="#ffffff"
                d="M16 64C16 28.7 44.7 0 80 0L304 0c35.3 0 64 28.7 64 64l0 384c0 35.3-28.7 64-64 64L80 512c-35.3 0-64-28.7-64-64L16 64zM224 448a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM304 64L80 64l0 320 224 0 0-320z"
              />
            </svg>
          </a>
          <!-- email icon -->
          <a href="mailto:jasso.favio@student.ccm.edu">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="size-12">
              <!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
              <path
                fill="#ffffff"
                d="M64 112c-8.8 0-16 7.2-16 16l0 22.1L220.5 291.7c20.7 17 50.4 17 71.1 0L464 150.1l0-22.1c0-8.8-7.2-16-16-16L64 112zM48 212.2L48 384c0 8.8 7.2 16 16 16l384 0c8.8 0 16-7.2 16-16l0-171.8L322 328.8c-38.4 31.5-93.7 31.5-132 0L48 212.2zM0 128C0 92.7 28.7 64 64 64l384 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128z"
              />
            </svg>
          </a>
          <!-- github icon -->
          <a href="https://github.com/FavioJasso" target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" class="size-12">
              <!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
              <path
                fill="#ffffff"
                d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
              />
            </svg>
          </a>
        </div>
        <p class="hidden md:block italic md:text-lg lg:text-2xl font-bold text-right">
          "Empowering your digital future with cutting-edge technology and strategic insights."
        </p>
        <p class="text-sm md:text-lg lg:text-xl text-center md:text-right">
          © <span class="font-bold italic">Favio Jasso.</span> All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import emailjs from '@emailjs/browser'
// import axios from 'axios'
import { useToast } from 'vue-toast-notification'
const toast = useToast()

const name = ref('')
const email = ref('')
const message = ref('')
const serviceID = 'service_wctmbgh'
const templateID = 'template_2xgtcqw'
const userID = 'nKYHmb69A350_7kwn'
function sendEmail() {
  const fullMessage = {
    name: name.value,
    email: email.value,
    message: message.value
  }

  console.log(fullMessage)

  emailjs
    .send(serviceID, templateID, fullMessage, userID)
    .then(() => {
      toast.open({
        message: 'Email sent successfully!',
        type: 'success'
      })
    })
    .catch(() => {
      toast.open({
        message: 'Something went wrong. Please try again.',
        type: 'error'
      })
    })
  // axios
  //   .post('https://www.faviojasso.com/codeigniter4/public/send', fullMessage)
  //   .then(() => {
  //     toast.open({
  //       message: 'Email sent successfully!',
  //       type: 'success'
  //     })
  //   })
  //   .catch(() => {
  //     toast.open({
  //       message: 'Something went wrong. Please try again.',
  //       type: 'error'
  //     })
  //   })
}
</script>

<style scoped></style>
