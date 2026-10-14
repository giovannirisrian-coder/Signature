<script setup>
import { computed, ref } from 'vue'
import { LogIn } from '@lucide/vue'
import { usePortal } from '../composables/usePortal'

const portal = usePortal()
const accountId = ref('')

const account = computed(() => portal.roles.find((item) => item.id === accountId.value) || null)

function submit() {
  if (!account.value) return
  portal.login(account.value.id)
}
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-[radial-gradient(900px_420px_at_10%_-10%,#dbeafe,transparent),linear-gradient(#eef3f9,#e7eef6)] px-4 py-10">
    <div class="w-full max-w-lg">
      <div class="mb-6 flex items-center gap-3">
        <div class="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-sm font-extrabold text-emerald-300">SP</div>
        <div>
          <p class="text-lg font-bold leading-tight text-slate-950">Signature Portal</p>
          <p class="text-sm text-slate-500">SP File Control</p>
        </div>
      </div>

      <form class="card p-6 sm:p-8" @submit.prevent="submit">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Dummy sign-in</p>
        <h1 class="mt-2 text-2xl font-bold text-slate-950">Choose an account</h1>
        <p class="mt-2 text-sm leading-6 text-slate-500">
          Pick a sample user. Email and password fill in automatically, then Login opens the Document Inbox.
        </p>

        <label class="mt-6 block text-sm font-semibold text-slate-800" for="dummy-account">
          Dummy account
          <select id="dummy-account" v-model="accountId" class="field mt-2" data-testid="login-account" required>
            <option value="" disabled>Select a dummy account</option>
            <option v-for="item in portal.roles" :key="item.id" :value="item.id">
              {{ item.loginLabel }} ({{ item.loginGroup }})
            </option>
          </select>
        </label>

        <div class="mt-4 grid gap-4">
          <label class="block text-sm font-semibold text-slate-800" for="login-email">
            Email
            <input
              id="login-email"
              :value="account?.email || ''"
              type="email"
              class="field mt-2"
              placeholder="Select an account"
              readonly
              data-testid="login-email"
            />
          </label>
          <label class="block text-sm font-semibold text-slate-800" for="login-password">
            Password
            <input
              id="login-password"
              :value="account?.password || ''"
              type="text"
              class="field mt-2 font-mono"
              placeholder="Mock password"
              readonly
              data-testid="login-password"
            />
          </label>
        </div>

        <button type="submit" class="btn btn-primary mt-6 w-full" data-testid="login-submit" :disabled="!account">
          <LogIn class="h-4 w-4" />
          Login
        </button>
      </form>
    </div>
  </div>
</template>
