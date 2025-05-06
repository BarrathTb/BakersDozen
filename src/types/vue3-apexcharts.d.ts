import 'vue'

declare module 'vue' {
  export interface GlobalComponents {
    apexchart: (typeof import('vue3-apexcharts'))['default']
  }
}

declare module 'vue3-apexcharts' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}
