import { Line, mixins } from '../lib/vue-chartjs.min.js'
const { reactiveProp } = mixins

export default {
  extends: Line,
  mixins: [reactiveProp],
  props: ['options'],
  mounted () {
    // this.chartData 在 mixin 创建.
    // 如果你需要替换 options , 请创建本地的 options 对象
    this.renderChart(this.chartData, this.options)
  }
}