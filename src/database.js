const { Database,Tables } = require('koishi-core')

Tables.extend('mltd_event_list', {
  // 主键名称，将用于 database.get() 等方法
  primary: 'id',
  // 所有数据值唯一的字段名称构成的列表
  unique: [],
  // 主键产生的方式，incremental 表示自增
  // type: 'incremental',
})

Tables.extend('mltd_event_alarm', {
  // 主键名称，将用于 database.get() 等方法
  primary: 'id',
  // 所有数据值唯一的字段名称构成的列表
  unique: [],
  // 主键产生的方式，incremental 表示自增
  // type: 'incremental',
})

Tables.extend('mltd_event_point', {
  // 主键名称，将用于 database.get() 等方法
  primary: 'id',
  // 所有数据值唯一的字段名称构成的列表
  unique: [],
  // 主键产生的方式，incremental 表示自增
  type: 'incremental',
})

Tables.extend('mltd_idol_info', {
  // 主键名称，将用于 database.get() 等方法
  primary: 'id',
  // 所有数据值唯一的字段名称构成的列表
  unique: [],
  // 主键产生的方式，incremental 表示自增
  // type: 'incremental',
})





Database.extend('koishi-plugin-mysql', ({ tables }) => {
  // console.log(tables)
  tables.mltd_event_list = {
    id: 'int(11) NOT NULL',
    name: `varchar(1024) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT ''`,
    type: 'int(11) NULL DEFAULT 0',
    appealType: 'int(11) NULL DEFAULT 0',
    beginDate: 'datetime(0) NULL DEFAULT NULL',
    endDate: 'datetime(0) NULL DEFAULT NULL',
    pageBeginDate: 'datetime(0) NULL DEFAULT NULL',
    pageEndDate: 'datetime(0) NULL DEFAULT NULL',
    boostBeginDate: 'datetime(0) NULL DEFAULT NULL',
    boostEndDate: 'datetime(0) NULL DEFAULT NULL',
    eventLength: 'int(11) NULL DEFAULT 0',
    eventBoostLength: 'int(11) NULL DEFAULT 0'
    // 其他字段定义
  }
  tables.mltd_event_alarm = {
    id: 'int(11) NOT NULL AUTO_INCREMENT',
    idolId: 'int(11) NULL DEFAULT 0',
    idolName: `varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT ''`,
    groupId: 'int(11) NULL DEFAULT NULL',
    userId: 'int(11) NOT NULL',
    rank: 'int(11) NOT NULL',
    point: 'int(11) NOT NULL',
    enabled: 'tinyint(1) NULL DEFAULT 1'
  }
  tables.mltd_event_point = {
    id: 'int(11) NOT NULL AUTO_INCREMENT',
    eventId: 'int(11) NOT NULL',
    idolId: 'int(11) NULL DEFAULT 0',
    scores: `varchar(2048) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '[]'`,
    summaryTime: 'datetime(0) NOT NULL',
    count: 'int(11) NULL DEFAULT 0',
  }
  tables.mltd_idol_info = {
    id: 'int(11) NOT NULL',
    nameJP: `varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT ''`,
    nameZH: `varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT ''`,
    birthday: `varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '1/1'`
  }
})