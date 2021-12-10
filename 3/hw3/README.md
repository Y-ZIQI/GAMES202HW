# homework3: Screen Space Ray Tracing

## 工作描述

1. 直接光照
2. Screen Space Ray Tracing
3. 间接光照

## 代码改动部分

* 直接光照：只更改ssrFragment.glsl中的EvalDiffuse、EvalDirectionalLight函数
* Screen Space Ray Tracing：更改ssrFragment.glsl中的RayMarch函数，并添加了outScreen、atFront、hasInter新函数和几个宏定义
* 间接光照：添加了EvalIndirectLight函数和更改了SAMPLE_NUM宏定义
* 其他：在engine.js中调整了lightRadiance使得cave场景中更能看清楚间接光照