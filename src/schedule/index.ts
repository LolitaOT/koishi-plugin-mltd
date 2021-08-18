import schedule from 'node-schedule'
import { eventListSync, eventPointSync, updateNewPoint } from '../action/sync'
import { isUpdateDataTime } from '../action'
import { getBorderPoint } from '../action'
import { EventAlarmModel } from '../utils/database'
import { logger, mltd } from '..'

const jobTime = {
  checkEventList() {
    const rule = new schedule.RecurrenceRule()
    rule.minute = [0,15,30,45]
    return rule
  },
  switchEventSchedule(){
    const rule = new schedule.RecurrenceRule()
    rule.second = 30
    return rule
  },
  updateEventPoinit() {
    const rule = new schedule.RecurrenceRule()
    rule.minute = [3,8,13,18,23,28,33,38,43,48,53,58]
    // rule.second = [0,30]
    return rule
  },
  eventAlarm() {
    const rule = new schedule.RecurrenceRule()
    // rule.second = 30
    rule.second = [0,30]
    return rule
  }
}
interface globleSchedult {
  checkEventList: any,
  switchEventSchedule: any,
  eventAlarm?:any,
  updateEventPoinit: any
}
const globleSchedult: globleSchedult = {
  checkEventList: schedule.scheduleJob(jobTime.checkEventList(), checkEventList),
  switchEventSchedule: schedule.scheduleJob(jobTime.switchEventSchedule(),switchEventSchedule),
  eventAlarm: null,
  updateEventPoinit: null
}

async function checkEventList() {
  await eventListSync()
}

async function switchEventSchedule() {
  try {
    const id = await isUpdateDataTime()
    if(id) {
      if(!globleSchedult.updateEventPoinit) {
        logger.info(`活动已开启，踏踏开`)
        globleSchedult.updateEventPoinit = schedule.scheduleJob(jobTime.updateEventPoinit(),() => updateNewPoint)
        globleSchedult.eventAlarm = schedule.scheduleJob(jobTime.eventAlarm(),eventAlarm)
        await eventPointSync(id,false)
      }
    } else {
      if(globleSchedult.updateEventPoinit) {
        logger.info(`诸君，活动已经结束了`)
        globleSchedult.updateEventPoinit.cancel()
        globleSchedult.eventAlarm.cancel()
      }
      globleSchedult.updateEventPoinit = null
    }
  }catch(e) {
    logger.error(e)
  }
}

async function eventAlarm() {
  const alarms = await EventAlarmModel.findAll({
    where: {
      enabled: true
    },
    order: ['idolId']
  })
  for (const key in alarms) {
    if (Object.hasOwnProperty.call(alarms, key)) {
      const alarm = alarms[key];
      const idolId = alarm.idolId
      let response = await getBorderPoint(idolId + '')
      if(!response || response.idolId !== idolId) break
      const scores = response.scores
      const targetScore = scores.find(v => v.rank == alarm.rank)
      if(targetScore && targetScore.score && targetScore.score > alarm.point) {
        mltd.sendAlarmMessage({
            userId: alarm.userId,
            channelId: alarm.channelId,
            idolId,
            idolName: alarm.idolName,
            setRank: alarm.rank,
            setPoint: alarm.point,
            point: targetScore.score
        })
      }
    }
  }
}


