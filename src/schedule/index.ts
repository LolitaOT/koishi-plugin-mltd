import schedule from 'node-schedule'
import { segment, Session } from 'koishi'
import request from '../utils/request'
import cheerio from 'cheerio'
import { getImage } from '../utils'
import { eventListSync, eventPointSync, updateNewPoint } from '../action/sync'
import { isUpdateDataTime, getBorderPoint, findIdolsByBirthday } from '../action'
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
  },
  checkBirthday() {
    const rule = new schedule.RecurrenceRule()
    rule.hour = 23
    rule.minute = 1
    rule.second = 0
    return rule
  }
}
interface globleSchedult {
  checkEventList: any,
  switchEventSchedule: any,
  eventAlarm?:any,
  checkBirthday?:any,
  updateEventPoinit: any
}
const globleSchedult: globleSchedult = {
  checkEventList: schedule.scheduleJob(jobTime.checkEventList(), checkEventList),
  switchEventSchedule: schedule.scheduleJob(jobTime.switchEventSchedule(),switchEventSchedule),
  checkBirthday: null,
  eventAlarm: null,
  updateEventPoinit: null
}
export function runCheckBirthday() {
  checkBirthday()
  globleSchedult.checkBirthday = schedule.scheduleJob(jobTime.checkBirthday(), () => checkBirthday())
}
// demo()
async function getBirthdayReply() {
  try {

    const targetURI = "http://rss.miyamiyao.com/twitter/keyword/%E6%9C%AC%E6%97%A5%20%E8%AA%95%E7%94%9F%E6%97%A5%20(from:imasml_theater)"
    const data = await request({
      url: targetURI,
    })
    const html = cheerio.load((data as unknown as string))
    const $item = cheerio.load(html('item')[0])
    const title = $item('title').html()?.replace('&lt;![CDATA[', '').replace(']]&gt;', '')
    const imgSrc = $item('img')[0].attribs.src
    const img = (await getImage(imgSrc)).toString('base64')
    const reply = `${title}\n${segment('image', { url: 'base64://' + img })}`
    // mltd.broadcast(reply)
    return reply
  }catch(e) {
    logger.error('获取生日图片时出现错误')
    return '[生日图片]'
  }
  // 'data:image/png;base64,' + Buffer.from(buffer, 'utf8').toString('base64')
}
export async function checkBirthday(check = false, session?:Session) {
  const nowTime = new Date().getTime()
  const targetTime = nowTime + 1000 * 60 * 60 * 2 
  const t = new Date(targetTime)
  const m = t.getMonth() + 1
  const d = t.getDate()
  const idols = await findIdolsByBirthday(m + '/' + d)
  if((idols && idols.length > 0) || check) {
    const retry = await getBirthdayReply()
    let t = retry + '\n'
    if(check) {
      t += `这是一条测试用的生日提醒`
    } else {
      t += '今天是' + idols.map(v => v.nameJP).join('、') + '的生日哦，记得打歌领体力药水。'
    }
    if(session){
      session.send(t)
    } else {
      mltd.broadcast(t)
    }
  }
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
        globleSchedult.updateEventPoinit = schedule.scheduleJob(jobTime.updateEventPoinit(),() => updateNewPoint())
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
      // console.log(response)
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


