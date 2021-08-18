import { Context,Logger } from 'koishi'
import { MLTD } from './mltd'
module.exports.name = 'mltd'
export const mltd = new MLTD()
export const logger = new Logger('mltd')
module.exports.apply = (ctx: Context) => {
  mltd.init(ctx)
}
