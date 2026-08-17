import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CarsView from '../views/CarsView.vue'
import GraphView from '../views/GraphView.vue'
import AppearanceView from '../views/AppearanceView.vue'
import SettingsView from '../views/SettingsView.vue'

// Hash mode so GitHub Pages needs no 404 fallback (SPEC.md section 13).
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/cars', name: 'cars', component: CarsView },
    { path: '/graph', name: 'graph', component: GraphView },
    { path: '/appearance', name: 'appearance', component: AppearanceView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})
