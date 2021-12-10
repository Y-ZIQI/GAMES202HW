# homework5: 实时光线追踪降噪

## 工作描述

1. 完成单帧降噪：主要内容为Denoiser::Filter中循环的补全

2. 完成两帧间的投影：主要内容为Denoiser::Reprojection中循环的补全

3. 完成两帧间的累计：主要内容为Denoiser::TemporalAccumulation中循环的补全

另外，在box与pink_room场景的降噪中，分别采用了不同的m_sigmaColor参数，从而提高降噪效果。

在生成结果视频时，发现pinkroom-input.mp4不能正常生成，结果为全黑。但由于input视频与结果没什么关系，因此我没有考虑修复。其他展示结果视频能正常播放。

