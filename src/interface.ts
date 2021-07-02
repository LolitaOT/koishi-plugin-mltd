
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