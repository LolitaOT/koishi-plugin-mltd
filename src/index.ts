import { Context,Logger } from 'koishi'
import './database'
import {} from './sync'
module.exports.name = 'mltd'
export const logger = new Logger('mltd')

module.exports.apply = (ctx: Context) => {
  // console.log()
  // setTimeout(() => {
  //   console.log(ctx.database)
  //   require('./database')
  // }, 5000)
}
