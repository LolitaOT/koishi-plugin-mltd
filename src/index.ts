import { Context,Logger } from 'koishi'
import { MLTD, Config } from './mltd'
module.exports.name = 'mltd'
export const mltd = new MLTD()
export const logger = new Logger('mltd')
module.exports.apply = (ctx: Context,config: Config) => {
  mltd.init(ctx,config)
}
