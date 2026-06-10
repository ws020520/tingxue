import { defineStore } from 'pinia'

export const useToastStore = defineStore('toast', {
  state: () => ({ message: '', timer: null }),
  actions: {
    show(message){
      this.message = message
      clearTimeout(this.timer)
      this.timer = setTimeout(() => { this.message = '' }, 2400)
    }
  }
})
