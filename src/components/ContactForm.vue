<script setup>
import { reactive, ref } from 'vue'
import { contact } from '../data/content.js'
import { audio } from '../engine/audio.js'

const form = reactive({ name: '', email: '', message: '', company: '' })
const status = ref('idle') // idle | sending | sent | failed

async function send() {
  if (status.value === 'sending') return
  // Honeypot: only bots fill the hidden field. Pretend it worked.
  if (form.company) {
    status.value = 'sent'
    return
  }
  status.value = 'sending'
  try {
    // Loaded on demand; most visitors never send a message.
    const { default: emailjs } = await import('@emailjs/browser')
    const { service, template, publicKey } = contact.emailjs
    await emailjs.send(service, template, { name: form.name, email: form.email, message: form.message }, publicKey)
    status.value = 'sent'
    form.name = form.email = form.message = ''
    audio.select()
  } catch {
    status.value = 'failed'
    audio.error()
  }
}
</script>

<template>
  <form class="form" @submit.prevent="send">
    <label class="field">
      <span>Full Name</span>
      <input v-model="form.name" name="name" type="text" autocomplete="name" placeholder="Enter your Name" required :disabled="status === 'sending'" />
    </label>
    <label class="field">
      <span>Email</span>
      <input v-model="form.email" name="email" type="email" autocomplete="email" placeholder="Enter your email address" required :disabled="status === 'sending'" />
    </label>
    <label class="field">
      <span>Message</span>
      <textarea v-model="form.message" name="message" rows="4" placeholder="Enter your Message" required :disabled="status === 'sending'" />
    </label>
    <label class="hp" aria-hidden="true">
      Company
      <input v-model="form.company" name="company" type="text" tabindex="-1" autocomplete="off" />
    </label>
    <button type="submit" class="btn btn--primary" :disabled="status === 'sending'">
      {{ status === 'sending' ? 'Sending...' : 'Send Message' }}
    </button>
    <p class="form-status" role="status">
      <template v-if="status === 'sent'">Message sent. Thanks for reaching out!</template>
      <template v-else-if="status === 'failed'">Something went wrong. Please try again, or email me directly.</template>
    </p>
  </form>
</template>
