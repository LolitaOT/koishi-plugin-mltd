
export interface EventInfo {
  id: number,
  name: string,
  type: number,
  appealType: number,
  schedule: {
    beginDate: Date,
    endDate: Date,
    pageBeginDate: Date,
    pageEndDate: Date,
    boostBeginDate: Date,
    boostEndDate: Date,
  }
}

export interface IdolPointLog {
  rank: number,
  data: Array<{ score: number,summaryTime: Date }>
}

interface BorderPointsData {
  scores: Array<{ score: number,rank: number }>,
  summaryTime: Date,
  count: number
}

export interface BorderPoints {
  eventPoint:BorderPointsData,
  highScore: BorderPointsData,
  loungePoint: BorderPointsData,
  error: object
}

export interface IdolCard {
  id: number,
  name: string,
  sortId: number,
  idolId: number,
  idolType: number,
  resourceId: string,
  rarity: number,
  category: string,
  extraType: number,
  costume: {
    id: number,
    name: string,
    description: string,
    resourceId: string,
    sortId: number
  },
  bonusCostume: {
    id: number,
    name: string,
    description: string,
    resourceId: string,
    modelId: string,
    sortId: number
  },
  addDate: string
}

export interface AlarmData {
  userId: string,
  channelId: string,
  idolId: number,
  idolName: String,
  setRank: number,
  setPoint: number,
  point: number
}