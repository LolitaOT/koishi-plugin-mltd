import { EventListModel,EventPointModel,IdolInfoModel, EventAlarmModel } from '../utils/database' //('../utils/db')
import { Op } from 'sequelize'
import $ from '../utils/request'
import { parseTime } from '../utils'
import { logger } from '..'
import { RANKS,ANNIVERSARY_RANKS } from '../utils/const'
import { EventInfo,IdolPointLog, BorderPoints } from '../utils/interface'
import { EventPoint } from '../utils/database'
import { getLastEventId } from './'
import idolInfoJson from '../data/idolInfo.json'

async function eventListSync() {
  try {
    let response:Array<EventInfo> = await $.get('/events')
    const rows = await EventListModel.findAll({
      attributes: ['id']
    })
    const insertIds = rows.map(v => v.id)
    for (const key in response) {
      const row = response[key];
      const data = {
        name: row.name,
        type: row.type,
        appealType: row.appealType,
        beginDate: new Date(row.schedule.beginDate),
        endDate: new Date(row.schedule.endDate),
        pageBeginDate: new Date(row.schedule.pageBeginDate),
        pageEndDate: new Date(row.schedule.pageEndDate),
        boostBeginDate: row.schedule.boostBeginDate ? new Date(row.schedule.boostBeginDate) : null,
        boostEndDate: row.schedule.boostEndDate ? new Date(row.schedule.boostEndDate) : null,
        eventLength: (new Date(row.schedule.endDate).getTime() + 1000 - new Date(row.schedule.beginDate).getTime()) / (1000 * 60 * 30) ,
        eventBoostLength: row.schedule.boostBeginDate ? (new Date(row.schedule.boostEndDate).getTime() + 1000 - new Date(row.schedule.boostBeginDate).getTime()) / (1000 * 60 * 30) : null
      }
      if(!insertIds.includes(row.id)) {
        await EventListModel.create({
          id: row.id,
          name: data.name,
          type: data.type,
          appealType: data.appealType,
          beginDate: data.beginDate,
          endDate: data.endDate,
          pageBeginDate: data.pageBeginDate,
          pageEndDate: data.pageEndDate,
          boostBeginDate: data.boostBeginDate,
          boostEndDate: data.boostEndDate,
          eventLength: data.eventLength,
          eventBoostLength: data.eventBoostLength
        })
        logger.info(`活动:${row.name }已插入数据库`)
      } else {
        const raw = rows.find(v => v.id === row.id)
        if(!raw) return
        raw.name = data.name
        raw.type = data.type
        raw.appealType = data.appealType
        raw.beginDate = data.beginDate
        raw.endDate = data.endDate
        raw.pageBeginDate = data.pageBeginDate
        raw.pageEndDate = data.pageEndDate
        raw.boostBeginDate = data.boostBeginDate
        raw.boostEndDate = data.boostEndDate
        raw.eventLength = data.eventLength
        raw.eventBoostLength = data.eventBoostLength || 0
        await raw.save()
        // logger.info(`活动 ${row.name }已更新`)
      }
    }
    logger.info(`事件列表同步完成`)
  }catch(e) {
    logger.error('同步事件列表时出现错误')
    logger.error(e)
  }
}

async function anniversaryEventPointSync(eventId: number) {
  try {
    
    const eventInfo = await EventListModel.findByPk(eventId)
    logger.info(`开始同步[${eventInfo?.name}]的小偶像数据`)
    
    const idols = await IdolInfoModel.findAll({
      attributes: ['id','nameJP'],
    })
    for (const idolInfo of idols) {
      const url = `/events/${eventId}/rankings/logs/idolPoint/${idolInfo.id}/${ANNIVERSARY_RANKS.join(',')}`
      let response:Array<IdolPointLog>
      while (true) {
        try {
          logger.info(`正在查询 ${eventId}，${idolInfo.nameJP} 的历史节点数据`)
          response = await $.get(url)
          break
        }catch(e) {
          logger.error(e)
        }
      }
      if(response.length === 0) {
        logger.error(`活动：[${eventInfo?.name}] 的小偶像数据没有返回值所以本次跳过`)
        return 
      }
      const insertedDatas = await EventPointModel.findAll({
        where: {
          eventId,
          idolId: idolInfo.id,
        }
      })
      const datas = getNoInludeDatas(insertedDatas,rankDataFormat(response,ANNIVERSARY_RANKS))
      if(datas.length === 0) {
        logger.info(`活动：[${eventInfo?.name}] 的小偶像数据没有更新的必要`)
        return
      }
      const sqlData = datas.map(v => {
        return {
          eventId,
          idolId:idolInfo.id,
          summaryTime: new Date(v.time),
          scores: v.scores
        }
      })
      await EventPointModel.bulkCreate(sqlData)
      logger.info(`活动：[${eventInfo?.name}]，${idolInfo.nameJP} 的历史记录加载完成`)
    }
    logger.info(`[${eventInfo?.name}]的小偶像数据同步完成`)
  }catch(e) {
    logger.error(e)
  }
}

async function AllEventPointSync() {
  const allEvent = await EventListModel.findAll({
    attributes: ['id'],
    where: {
      boostBeginDate: {
        [Op.not]: null
      }
    }
  })
  for (const key in allEvent) {
    const eventId = allEvent[key].id
    try {
      await eventPointSync(eventId)
    }catch(e) {
      logger.error(`活动：${eventId}，同步数据时出现错误`)
      logger.error(e)
    }
  }
  logger.info(`所有活动历史记录同步完成`)
}

async function eventPointSync(eventId: number, updateAnniversary = true) {
  try {
    const eventInfo = await EventListModel.findByPk(eventId)
    if(!eventInfo) {
      return logger.warn(`没有这个活动的信息哦，id => ${eventId}`)
    }
    const url = `/events/${eventId}/rankings/logs/eventPoint/${RANKS.join(',')}`
    let response:Array<IdolPointLog>
    while (true) {
      try {
        logger.info(`正在查询${eventId}的历史节点数据`)
        response = await $.get(url)
        break
      }catch(e) {
        logger.error(e)
      }
    }
    if(response.length === 0) {
      logger.error(`活动：${eventId}，没有返回值所以跳过`)
      return
    }
    const insertedDatas = await EventPointModel.findAll({
      where: {
        eventId,
        idolId: 0
      }
    })
    const datas = getNoInludeDatas(insertedDatas,rankDataFormat(response))
    const sqlData = datas.map(v => {
      return {
        eventId,
        summaryTime: new Date(v.time),
        scores: v.scores
      }
    })
    await EventPointModel.bulkCreate(sqlData)
    if(eventInfo.type === 5 && updateAnniversary) {
      await anniversaryEventPointSync(eventId)
    }
    await updateNewPoint(eventId)
    logger.info(`活动：${eventId},${eventInfo.name}的历史记录已同步完成`)
  }catch(e) {
    logger.error(`活动：${eventId}历史记录同步出现问题`)
    logger.error(e)
  }
}

async function updateNewPoint(eid?: number) {
  const eventId = eid || await getLastEventId()
  if(!eventId) {
    logger.error('现在不是活动时间')
    return 
  }
  try {
    const eventInfo = await EventListModel.findByPk(eventId)
    if(!eventInfo) {
      return
    }
    let response: BorderPoints = await $.get(`/events/${eventId}/rankings/borderPoints`)
    if(response.error ||( Array.isArray(response) && response.length === 0)) {
      logger.error(`活动：[${eventInfo.name}]，暂时还未有统计数据`)
      return
    }
    const data = response.eventPoint
    const summaryTime = new Date(data.summaryTime)
    const row = await EventPointModel.findOne({
      where: {
        eventId,
        idolId: 0,
        summaryTime
      }
    })
    if(!row) {
      await EventPointModel.create({
        eventId,
        scores: data.scores,
        summaryTime,
        count: data.count || 0
      })
      logger.info(`活动：[${eventInfo.name}]，${parseTime(summaryTime)} 的档线信息已插入`)
    } else {
      row.count = data.count || 0
      row.scores = data.scores
      await row.save()
      logger.info(`活动：[${eventInfo.name}]，${parseTime(summaryTime)} 的档线信息已更新`)
    }
    if (eventInfo.type === 5) {
      await anniversaryEventPointSync(eventId)
    }
  }catch(e) {
    logger.error(`获取最新分数信息失败,活动id：` + eventId)
    logger.error(e)
  }
}

async function idolInfoSync() {
  await IdolInfoModel.destroy({
    truncate: true
  })
  for (const key in idolInfoJson) {
    const { id, nameJP, nameZH, birthday } = idolInfoJson[key]
    await IdolInfoModel.create({
      id: id,
      nameJP,
      nameZH,
      birthday
    })
    // logger.info(`${nameJP}信息已插入`)
  }
  logger.info('小偶像基础信息更新完毕。')
}

interface rankDataFormatResultRow {
  time: string | Date,
  scores: Array<{ rank: number,score: number }>
}
function rankDataFormat(data:Array<IdolPointLog>, ranks = RANKS):Array<rankDataFormatResultRow> {
  const targetData = []
  const times = data[0].data.map(v => v.summaryTime)
  for (const key in times) {
    const time = times[key]
    const result:rankDataFormatResultRow = {
      time,
      scores: []
    }
    for (const rank of ranks) {
      const rankData = data.find(v => v.rank === rank)
      const val = {
        rank,
        score: 0
      }
      if(rankData) {
        const finalData = rankData.data.find(v => v.summaryTime === time)
        if(finalData) {
          val.score = finalData.score
        }
      }
      result.scores.push(val)
    }
    targetData.push(result)
  }
  return targetData
}
function getNoInludeDatas(insertedDatas:Array<EventPoint>, datas: Array<rankDataFormatResultRow>) {
  const insertedTimes = insertedDatas.map(v => new Date(v.summaryTime).getTime())
  const result = datas.filter(v => {
    return !insertedTimes.includes(new Date(v.time).getTime())
  })
  return result
}
export interface InitConfig {
  loadHistory?: boolean
}
async function __init__ (config: InitConfig) {
  // if( process.env.NODE_ENV === 'production') {
  await idolInfoSync()
  await eventListSync()
  if(config.loadHistory) {
    await AllEventPointSync()
    await eventPointSync(44)
    // anniversaryEventPointSync(92)
  }
  // }
}



export {
  __init__,
  eventListSync,
  eventPointSync,
  AllEventPointSync,
  updateNewPoint,
  idolInfoSync
}