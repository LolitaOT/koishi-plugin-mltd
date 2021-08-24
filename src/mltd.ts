import { Context, segment } from 'koishi'
import { 
  getNewestBorderPoint,
  updateOrInsertPointAlarm, 
  cancelPointAlarm,
  findIdol,
  getPointAlarm
} from './action'
import { AlarmData } from './utils/interface'
import { RANKS, ANNIVERSARY_RANKS } from './utils/const'
import _ from 'lodash'
import './utils/database'
import { runCheckBirthday } from  './schedule'
import { __init__ , InitConfig } from './action/sync'
import { logger } from '.'
export interface Config {
  init?:InitConfig,
  checkBirthday?: Boolean
}

export class MLTD {
  ctx!: Context
  constructor() {
    
  }
  async init(ctx:Context, config: Config = {}) {
    // if(config.init) {
      // 保证数据库初始化完成后再执行
    setTimeout(()=> {
      __init__(config.init)
    }, 1000)
      // }
    this.ctx = ctx
    if(config.checkBirthday) {
      runCheckBirthday()
    }
    this.initBorderpoint()
    this.initAlarm()
    this.initCancelAlarm()
    this.initLookAlarm()
  }
  initBorderpoint() {
    this.ctx.command('mltd','土豆相关指令')
    .subcommand('.borderpoint', '查询实时档线，也可以输入[干活啦.档线查询]来触发')
    .action( async (_,idol) => {
      // const url = encodeURI(`/events/newest/borderpoint?k=${idol}`)
      // const response = await $.get(url)
      // console.log(response)
      // return response.data
      return await getNewestBorderPoint(idol)
    })
    .usage('数据来源：matsurihi.me')
    .shortcut('干活啦.档线查询')
    .shortcut('干活啦。档线查询')
    .shortcut(/^干活啦。档线查询 (\S+)$/, { args: ['$1']} )
    .shortcut(/^干活啦\.档线查询 (\S+)$/, { args: ['$1']} )
    .option('idol','[idol] 小偶像名字，可模糊匹配')
  }
  initTest() {
  }
  initAlarm() {
    this.ctx.command('mltd','土豆相关指令')
    .subcommand('.alarm <rank> <point>', '档线警报，也可以输入[干活啦.档线警报]来触发')
    .channelFields(['id'])
    .option('idol', '-i <idol:string> 小偶像名称，可模糊匹配')
    .action( async ( { session, options },rank,point ) => {
      if(!session || !session.channel || !session.channel.id) return
      try {
        if(!session.groupId) {
          return '暂时不支持私聊设置'
        }
        const $rank = _.toNumber(rank)
        const $point = _.toNumber(point)
        const idol = options?.idol || 0
        // console.log(rank,point)
        if((!_.isNumber($rank) || _.isNaN($rank))|| (!_.isNumber($point) || _.isNaN($point))){
          return '<rank> 与 <point> 请输入正确的数字'
        }
        let ranks = RANKS
        if(idol) {
          ranks = ANNIVERSARY_RANKS
        }
        if(!ranks.includes($rank)) {
          return '请输入在[' + ranks.join(',') +']中的排名'
        }
        if($point <= 1000) {
          return '请输入大于1000的分数'
        }
        // return '设置成功'
        let idolInfo
        if(idol) {
          // const response = await $.get(encodeURI(`/find_idol?k=${idol}`))
          // if(response.code !== 200) {
          //   return '设置失败，未找到相关小偶像'
          // }
          // idolInfo = response.data
          idolInfo = await findIdol(idol)
          if(!idolInfo) {
            return '设置失败，未找到相关小偶像'
          }
        }
        // return JSON.stringify(idolInfo)
        const response = await updateOrInsertPointAlarm({
          channelId: session.channel.id,
          userId: session.userId,
          rank: $rank,
          point: $point,
          idolId: idolInfo?.id || 0,
          idolName: idolInfo?.nameJP || ''
        })
        const responseStart = `设置${response.update ? '已更新' : '成功'}，当前已有的设置为：\n`
        const formatArray = response.data.map(v => {
          return `${v.idolId !== 0 ? `[${v.idolName}]的pt` : '总pt'}将在${v.rank}位档线超过${v.point}时报警`
        })
        return responseStart + formatArray.join('\n')
      }catch(e) {
        logger.error(e)
        return '出现未知错误，呜呜呜。'
      }
    })
    .usage('注意：如果添加小偶像的名字的话，就只有周年活动警报了！')
    .shortcut(/^干活啦。档线警报 (\S+) (\S+)$/, { args: ['$1','$2']} )
    .shortcut(/^干活啦\.档线警报 (\S+) (\S+)$/, { args: ['$1','$2']} )
    .shortcut(/^干活啦。档线警报 (\S+) (\S+) (-i|--idol) (\S+)$/, { args: ['$1','$2'],options: {idol: '$4'}} )
    .shortcut(/^干活啦\.档线警报 (\S+) (\S+) (-i|--idol) (\S+)$/, { args: ['$1','$2'],options: {idol: '$4'}} )
    .example('mltd.alarm 1000 50000 当1000位档线超过50000时发送报警')
    .example('mltd.alarm 100 50000 -i 美也 当[美也]的100位档线超过50000时发送报警,限定周年活动')
  }
  initCancelAlarm() {
    this.ctx.command('mltd','土豆相关指令')
    .subcommand('.cancelalarm', '取消档线报警，也可以输入[干活啦.取消报警]来触发')
    .channelFields(['id'])
    .action( async ({ session }) => {
      if(!session || !session.channel || !session.channel.id || !session.userId) return
      try {
        await cancelPointAlarm({channelId: session.channel.id, userId: session.userId ,idolId: 0,allClean: true})
        return '警报已全部取消'
      }catch(e) {
        logger.error(e)
        return '出现未知错误，呜呜呜。'
      }
    })
    .shortcut('干活啦.取消报警')
    .shortcut('干活啦。取消报警')
  }
  initLookAlarm() {
    this.ctx.command('mltd','土豆相关指令')
    .subcommand('.lookalarm', '查看已设置的档线报警，也可以输入[干活啦.查看报警]来触发')
    .channelFields(['id'])
    .action( async ({ session }) => {
      // console.log('lookalarm')
      if(!session || !session.channel || !session.channel.id || !session.userId) return
      try {
        const result = await getPointAlarm({channelId: session.channel.id,userId: session.userId})
        if(!result || result.length === 0){
          return '还未设置警报\n输入 help mltd.alarm 查看设置详情'
        }else {
          return `当前已有的设置为：\n` +  result.map(v => {
            return `${v.idolId !== 0 ? `[${v.idolName}]的pt`: '总pt'}将在${v.rank}位档线超过${v.point}时报警`
          }).join('\n')
        }
      }catch(e) {
        logger.error(e)
        return '出现未知错误，呜呜呜。'
      }
    })
    .shortcut('干活啦.查看报警')
    .shortcut('干活啦。查看报警')
  }
  async sendAlarmMessage(data: AlarmData) {
    const message = `\n档线警报！！！\n${data.idolId !== 0 ? `[${data.idolName}]的pt` : '总pt'}当前${data.setRank}的档线为：${data.point}，已超过设置值：${data.setPoint}。\n警报已关闭`
    // console.log(message)
    this.ctx.broadcast([data.channelId], segment('at', { id: data.userId }) + message)

    await cancelPointAlarm({userId: data.userId, channelId: data.channelId,idolId: data.idolId})
    
  }
  async broadcast(text: string) {
    this.ctx.broadcast(text)
  }
}