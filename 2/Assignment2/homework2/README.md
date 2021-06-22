# GAMES202 homework2

## 工作描述

1. 预计算环境光照：逐像素计算球谐系数，并求和
2. 预计算Diffuse Unshadowed LT：指定方向下Light transport值，即方向与法线余弦值（非负）
3. 预计算Diffuse Shadowed LT：在2.的基础上，从该方向投射光线，与模型相交则visbility为0，LT也为0
4. 预计算数据使用：正确读取PRT的数据并在自定义的材质中加载，并设计合适的shader进行渲染
5. 预计算Diffuse Inter-reflection：在3.的基础上，根据bounce次数迭代，遍历顶点，并从顶点做若干次采样，并按照3.的方式投射光线，但计算的visbility并不是非0即1，而是交点（如果有）所在三角形顶点的LT值对交点的重心坐标的加权平均。最后迭代的结果为经过bounce次弹射后的间接环境光照的LT，与原LT相加即可
6. SH 旋转：通过线性代数方式计算出给定旋转矩阵下precompute_L的变化。具体过程如作业文档中介绍

## 代码改动部分

* 预计算环境光照、Diffuse Unshadowed LT、Diffuse Shadowed LT部分只在标有//TODO的地方更改
* 预计算数据使用：
  1. 添加DiffuseMaterial.js, DiffuseVertex.glsl, DiffuseFragment.glsl
  2. engine.js读取文件处注释删去，101~106行更改读取的文件名（从而可以分别读取三种阴影模式下的LT文件）
  3. index.html添加1.中的三个文件
* 预计算Diffuse Inter-reflection：更改在prt.cpp 253~298行
* SH 旋转：
  1. tools.js全部函数
  2. engine.js 11~27行添加数个全局变量，157~169行进行旋转并向材质传递uniform变量