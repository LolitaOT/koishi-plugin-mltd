import { Context } from 'koishi'
module.exports.name = 'demo'
require('./database.js')
module.exports.apply = (ctx: Context) => {
  console.log(ctx)
  // setTimeout(() => {
  //   console.log(ctx.database)
  //   require('./database')
  // }, 5000)
}
