import { Context,Logger } from 'koishi'
import { MLTD, Config } from './mltd'
module.exports.name = 'mltd'
export const mltd = new MLTD()
export const logger = new Logger('mltd')
// 2020-07-04 百万动画化宣布时间
module.exports.apply = (ctx: Context,config: Config) => {
  mltd.init(ctx,config)
}
