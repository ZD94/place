# 地点信息

## 数据库设计

- city 城市基本信息
- city_alternate_name 城市别名
- city_code 城市code

---

### city

| 字段名 | 类型 | 备注 | 取值 |
|-       | -    | -    | -    |
| id     | varchar(50) | 城市ID   | CT_131 |
| name   | varchar(50) | 城市名称 | 北京 | 
| type     | interge | 城市级别 | 1. 省 2.市 3.区县 |
| letter | varchar(50) | 首字母缩写 | BJS |
| timezone | varchar(100) | 时区信息 | Asia/Shanghai |
| location | gps |   经纬度 | 35.1,120.8 |
| parent_id | varchar(50) | 父级ID | CT_4,没有父级null |
| pinyin   | varchar(50)  | 拼音   | beijing |


| id | name | type | letter | timezone | location | parentId | pinyin | 
| -  | -    | -    | -      | -        | -        | -        | -      |

### city_alternate_name
---

| 字段名 | 类型 | 备注 | 取值 |
|-       | -    | -    | -    |
| id     | integer | ID | 1 |
| city_id| varchar(50) | 城市ID | CT_131 |
| lang   | varchar(50) | 语言 | en,cn, fr, jp... 参考geonames|
| value  | varchar(100) | 别名 |



| id | city_id | lang | value | 
| -  | -       |-    | -     |

### city_code
---

| 字段名 | 类型 | 备注 | 取值 |
|-       | -    | -    | -    |
| id     | integer | ID | 1   |
| city_id | varchar(50) | 城市ID | CT_131 |
| code   | varchar(50) | 城市三字码,城市二字码,天巡code，百度code,携程code...| BJS | 
| type   | integer | 类型 | 1.天巡 2. 携程 3. 城市三字码 ...|

| ID | city_id| type | code |
|- | -| -| -|


## 接口设计
