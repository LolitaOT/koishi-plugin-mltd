import { IdolInfoModel, EventListModel,EventPointModel, EventAlarmModel, EventAlarm } from '../utils/database'
import { Op } from 'sequelize'
import { RANKS, ANNIVERSARY_RANKS } from '../utils/const'
import { parseTime } from '../utils'
import { logger } from '..'

export async function findIdol(k: string) {
  const idolInfo = await IdolInfoModel.findOne({
    where: {
      [Op.or]: [
        { 
          id: k
        }, {
          nameJP: {
            [Op.substring]: k
          }
        }, {
          nameZH: {
            [Op.substring]: k
          }
        }
      ]
    }
  })
  return idolInfo
}

export async function findIdolsByBirthday(birthday: string) {
  return await IdolInfoModel.findAll({
    where: {
      birthday
    }
  })
}

export async function getBorderPoint(keyword = '') {
  const id = await getLastEventId()
  if(!id) return false
  const eventDetails = await EventListModel.findByPk(id)
  if(!eventDetails) return false
  let idolInfo = undefined
  let idolId = 0
  if(keyword && eventDetails.type === 5) {
    idolInfo = await findIdol(keyword)
    if(idolInfo) {
      idolId = idolInfo.id
    }
  }
  const nowPoint = await EventPointModel.findOne({
    where: {
      eventId: id,
      idolId
    },
    order: [['summaryTime','desc']]
  })
  if(!nowPoint) return false
  return nowPoint
}

export async function getNewestBorderPoint(keyword:string = '') {
  // const id = 142 
  const id = await getLastEventId()
  let idolId = 0
  let idolInfo = undefined
  if(!id) {
    return '现在还不是活动时间'
  }
  const eventDetail = await EventListModel.findByPk(id)
  if(!eventDetail) {
    return '事件不存在'
  }
  if(keyword && eventDetail.type === 5) {
    idolInfo = await findIdol(keyword)
    if(idolInfo) {
      idolId = idolInfo.id
    }
  }
  const nowPoint = await EventPointModel.findOne({
    where: {
      eventId: id,
      idolId
    },
    order: [['summaryTime','desc']]
  })
  if(!nowPoint) {
    return `活动：${eventDetail.name},还暂未有统计数据`
  }
  const nowSummaryTime = nowPoint.summaryTime
  const lastPoint = await EventPointModel.findOne({
    where: {
      eventId: id,
      idolId,
      summaryTime: new Date(nowSummaryTime.getTime() - 1000 * 60 * 30)
    },
  })
  const lastDayPoint = await EventPointModel.findOne({
    where: {
      eventId: id,
      idolId,
      summaryTime: new Date(nowSummaryTime.getTime() - 1000 * 60 * 60 * 24)
    },
  })
  const borderPoint = {
    now: nowPoint?.scores || [],
    last: lastPoint?.scores || [],
    lastDay: lastDayPoint?.scores || []
  }
  const pointLine = []
  const ranks = idolId === 0 ? RANKS : ANNIVERSARY_RANKS
  for (const key in ranks) {
    const rank = ranks[key]
    const rankPoint = borderPoint.now.find(v => v.rank === rank)?.score || 0
    const lastRankPoint = borderPoint.last.find(v => v.rank === rank)?.score || 0
    const lastDayRankPoint = borderPoint.lastDay.find(v => v.rank === rank)?.score || 0
    pointLine.push(`  第${rank}名：${rankPoint},(+${lastRankPoint === 0 ? 0 : rankPoint - lastRankPoint}),[++${lastDayRankPoint === 0 ? 0 : rankPoint - lastDayRankPoint}]`)
  }
  const response = `【pt档线${ idolId === 0 ? '' : ' - ' + idolInfo?.nameJP }】
  活动名称: ${eventDetail.name}
  活动时间: ${parseTime(eventDetail.beginDate)} 至 ${parseTime(eventDetail.endDate)}
  折返时间: ${parseTime(eventDetail.boostBeginDate as Date)} 至 ${parseTime(eventDetail.boostEndDate as Date)}
  档线更新时间: ${parseTime(nowPoint.summaryTime)}
  参与玩家数: ${nowPoint.count}
  ------------------(+半小时增速)------[++天增速]\n${pointLine.join('\n')}`
  return response
}


export async function getLastEventId() {
  try {
    const row = await EventListModel.findOne({
      where: {
        boostBeginDate: {
          [Op.not]: null
        }
      },
      order: [['endDate','DESC']]
    })
    return row?.id
  }catch(e) {
    logger.error(e)
  }
}


export async function isUpdateDataTime() {
  //  1.1  1.4
  //  1.4  1.45 => 1.35
  try {
    const now = new Date()
    const lastUpdateTime = new Date(now.getTime() - 1000 * 60 * 60 * 24)
    const row = await EventListModel.findOne({
      where: {
        boostBeginDate: {
          [Op.not]: null
        },
        beginDate: {
          [Op.lte]: now
        },
        endDate: {
          [Op.gte]: lastUpdateTime
        }
      },
      order: [['endDate','DESC']]
    })
    // logger.info(row.toJSON())
    if(row) {
      return row.id
    }else {
      return false
    }
  }catch(e) {
    logger.error(e)
  }
}


interface UpdateOrInsertAlarm {
  channelId: string,
  userId?: string,
  rank: number,
  point: number,
  idolId: number,
  idolName: string
}
export async function updateOrInsertPointAlarm({ channelId , userId , rank , point, idolId = 0,idolName = ''}: UpdateOrInsertAlarm) {
  const row = await EventAlarmModel.findOne({
    where: {
      channelId,
      userId,
      idolId
    }
  })
  const response: {update: boolean, data: EventAlarm[]} = {
    update: false,
    data: []
  }
  if(row && row.enabled) {
    response.update = true
  }
  if(row) {
    row.rank = rank
    row.point = point
    row.enabled = true
    await row.save()
  } else {
    await EventAlarmModel.create({
      channelId,
      userId,
      rank,
      point,
      idolId,
      idolName,
      enabled: true
    })
  }
  const rows = await EventAlarmModel.findAll({
    where: {
      channelId,
      userId,
      enabled: true
    },
    order: ['idolId']
  })
  response.data = rows
  return response
}

interface CancelAlarm {
  userId: string,
  channelId: string,
  idolId: number,
  allClean?: boolean
}
export async function cancelPointAlarm({userId, channelId, idolId, allClean = false}: CancelAlarm) {
  if (allClean) {
    await EventAlarmModel.update({
      enabled: false
    }, {
      where: {
        channelId, userId, enabled: true
      }
    })
  }else {
    await EventAlarmModel.update({
      enabled: false
    }, {
      where: {
        channelId, userId, enabled: true, idolId
      }
    })
  }
}

export async function getPointAlarm ({ channelId , userId }: {channelId: string, userId: string}){
  const row = await EventAlarmModel.findAll({
    where: {
      channelId , userId, enabled: true
    },
    order: ['idolId']
  })
  return row
}