import { Sequelize,DataTypes,Model } from 'sequelize'
import path from 'path'
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(__dirname,'../data/mltd.db'),
  logging: false,
  define: {
    freezeTableName: true,
  }
});

export interface EventList extends Model {
  id: number,
  name: string,
  type: number,
  appealType: number,
  beginDate: Date,
  endDate: Date,
  pageBeginDate: Date,
  pageEndDate: Date,
  boostBeginDate: Date | null,
  boostEndDate: Date | null,
  eventLength: number,
  eventBoostLength: number,
}

const EventListModel = sequelize.define<EventList>('eventList', {
  id: {
    type: DataTypes.INTEGER,
    // autoIncrement:true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(1024),
    defaultValue: '',
  },
  type: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  appealType:{
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  beginDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  pageBeginDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  pageEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  boostBeginDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  boostEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  eventLength: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  eventBoostLength: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
})

export interface scores {
  rank: number,
  score: number
}

export interface EventPoint extends Model {
  id: number,
  eventId: string,
  idolId: number,
  scores: Array<scores>,
  summaryTime: Date,
  count: number
}

const EventPointModel = sequelize.define<EventPoint>('eventPoint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement:true
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  idolId: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  scores: {
    // type: DataTypes.STRING(2048),
    type: DataTypes.STRING(2048),
    defaultValue: '[]',
    get() {
      let val = this.getDataValue('scores')
      try {
        val = JSON.parse(val)
      }catch(e) {
        throw new Error('获取scores字符串失败，已返回存储值')
      }
      return val
    },
    set(val) {
      try {
        val = JSON.stringify(val)
        this.setDataValue('scores',val)
      }catch(e) {
        this.setDataValue('scores', '[]')
        throw new Error('存储scores字符串失败，已插入默认值')
      }
    }
  },
  summaryTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
})

export interface EventAlarm extends Model {
  id: number,
  idolId: number,
  idolName: string,
  channelId: string,
  userId: string,
  rank: number,
  point: number,
  enabled: boolean,
} 

const EventAlarmModel = sequelize.define<EventAlarm>('eventAlarm', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  idolId: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  idolName: {
    type: DataTypes.STRING(32),
    defaultValue: ''
  },
  channelId: {
    type: DataTypes.STRING(64)
  },
  userId: {
    type: DataTypes.STRING(128),
    allowNull: false
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  point: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0
  }
})

export interface IdolInfo extends Model {
  id: number,
  nameJP: string,
  nameZH: string,
  birthday: Date
}

const IdolInfoModel = sequelize.define<IdolInfo>('idolInfo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true  
  },
  nameJP: {
    type: DataTypes.STRING(64),
    defaultValue: ''
  },
  nameZH: {
    type: DataTypes.STRING(64),
    defaultValue: ''
  },
  birthday: {
    type: DataTypes.STRING(32),
    defaultValue: '1/1'
  }
})


sequelize.sync();

// (async () => {
//   const result = await EventListModel.findAll()
//   // console.log(result)
// })()

export {
  EventListModel,
  EventPointModel,
  EventAlarmModel,
  IdolInfoModel
}

