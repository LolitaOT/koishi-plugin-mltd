# 用于koishi3的MLTD~~灭了同担~~插件

一个用于 **[Koishi v3](https://koishi.js.org/)** 的MLTD插件。

## 安装

``` shell
  npm i koishi-plugin-mltd --save
```
之后根据 **[Koishi v3](https://koishi.js.org/guide/context.html#%E5%AE%89%E8%A3%85%E6%8F%92%E4%BB%B6)** 进行安装。


## 说明

**需要使用koishi的数据库插件**

### 配置项
目前插件只有一个配置项
```
  init.loadHistory
```
布尔值，是否更新旧数据

### 功能

- 查看当前档线
- 设置档线报警
- 取消报警
- 查看已设置的报警

其他功能以后会加~~也许吧~~

## 碎碎念

- 新手，代码很烂，可能以后会优化
- 虽然koishi的数据库扩展很强，但是我用不明白，所以直接 sqlite3 + sequelize 起飞，开摆