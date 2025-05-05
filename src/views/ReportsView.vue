<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-4">Reports</h1>
          <p class="text-subtitle-1 mb-6">
            Generate and download reports for inventory movement, waste tracking, and production
            efficiency.
          </p>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <reports-generator @report-data="updateChartData" />
        </v-col>
      </v-row>
      <v-row v-if="hasChartData">
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon left>mdi-chart-line</v-icon>
              Report Trends
            </v-card-title>
            <v-card-text>
              <div class="chart-container" style="position: relative; height: 300px">
                <apexchart
                  :key="chartKey"
                  type="bar"
                  height="300"
                  :options="chartOptions"
                  :series="chartData"
                ></apexchart>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import ReportsGenerator from '../components/reports/ReportsGenerator.vue'
export default defineComponent({
  name: 'ReportsView',

  components: {
    ReportsGenerator,
    apexchart: VueApexCharts,
  },

  setup() {
    // Define a more comprehensive interface that matches your actual data
    interface ReportItem {
      date: string
      ingredient_name: string
      type: string
      quantity: number
      unit: string
      reference?: string
    }

    const reportData = ref<ReportItem[]>([])
    const chartKey = ref<number>(0)

    // Helper function to format dates
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString()
    }

    const updateChartData = (newData: ReportItem[]) => {
      reportData.value = newData
      chartKey.value++ // Force chart re-render
    }

    const chartData = computed(() => {
      if (!reportData.value.length) return []

      // Group data by ingredient
      const ingredientGroups = reportData.value.reduce(
        (acc: Record<string, ReportItem[]>, item: ReportItem) => {
          if (!acc[item.ingredient_name]) {
            acc[item.ingredient_name] = []
          }

          // For deliveries, use positive quantities
          // For removals and bakes, use negative quantities
          const quantity = item.type === 'delivery' ? item.quantity : -item.quantity
          acc[item.ingredient_name].push({
            ingredient_name: item.ingredient_name,
            quantity: quantity,
            type: item.type,
            unit: item.unit,
            date: formatDate(item.date),
          })

          return acc
        },
        {},
      )

      // Convert to series format for ApexCharts
      return Object.keys(ingredientGroups).map((ingredient) => ({
        name: ingredient,
        data: ingredientGroups[ingredient].map((item) => item.quantity),
      }))
    })

    const chartOptions = computed(() => {
      if (!reportData.value.length) return {}

      // Get unique dates
      const allDates = [...new Set(reportData.value.map((item) => formatDate(item.date)))]

      return {
        chart: {
          type: 'bar',
          foreColor: '#ffffff',
        },
        plotOptions: {
          bar: {
            borderRadius: 4,
          },
        },
        dataLabels: {
          enabled: false,
        },
        xaxis: {
          categories: allDates,
        },
        yaxis: {
          title: {
            text: 'Quantity (kg)',
          },
        },
        colors: ['#3CBFB4', '#E78B35', '#4C9CB0', '#E74C3C'],
        legend: {
          position: 'top',
        },
        tooltip: {
          theme: 'dark',
          shared: true,
          intersect: false,
        },
        theme: {
          mode: 'dark',
        },
      }
    })

    const hasChartData = computed(() => reportData.value.length > 0)

    return {
      reportData,
      chartKey,
      updateChartData,
      chartData,
      chartOptions,
      hasChartData,
      formatDate,
    }
  },
})
</script>
