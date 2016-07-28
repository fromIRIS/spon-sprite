## 简介

`spon-sprite`

将图片生成雪碧图，压缩，上传至showjoyCDN, 并生成对应的css文件。

## 使用方法

### 进入需要sprite化的图片文件夹

### 命令

1.图片需要缩小1/2 （试用375布局的移动端）

```
spon sprite -m
```

2.图片不需缩小（试用pc以及rem布局的移动端）

```
spon sprite
```

### 生成

```
[sprite-image]
  | -- kulian_03.png
  | -- min_10.png
  | -- people-plus_03.png
  | -- people_03.png
  | -- plus_06.png
  | -- [sprite]
  |     | -- sprite.css
  |     | -- sprite.png
```