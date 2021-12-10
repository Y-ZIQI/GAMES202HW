#include "denoiser.h"

Denoiser::Denoiser() : m_useTemportal(false) {}

void Denoiser::Reprojection(const FrameInfo &frameInfo) {
    int height = m_accColor.m_height;
    int width = m_accColor.m_width;
    Matrix4x4 preWorldToScreen =
        m_preFrameInfo.m_matrix[m_preFrameInfo.m_matrix.size() - 1];
    Matrix4x4 preWorldToCamera =
        m_preFrameInfo.m_matrix[m_preFrameInfo.m_matrix.size() - 2];
#pragma omp parallel for
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            // TODO: Reproject
            Float3 pos_w = frameInfo.m_position(x, y);
            float mid = frameInfo.m_id(x, y);
            if (mid >= 0.0f) {
                Matrix4x4 mat = frameInfo.m_matrix[mid];
                Matrix4x4 mat_prev = m_preFrameInfo.m_matrix[mid];
                Float3 pos_w_prev =
                    mat_prev(Inverse(mat)(pos_w, Float3::Point), Float3::Point);
                Float3 coor_prev = preWorldToScreen(pos_w_prev, Float3::Point);
                int x_prev = coor_prev.x, y_prev = coor_prev.y;
                if (x_prev >= 0 && x_prev < width && y_prev >= 0 && y_prev < height) {
                    float mid_prev = m_preFrameInfo.m_id(x_prev, y_prev);
                    if ((int)mid == (int)mid_prev) {
                        m_valid(x, y) = true;
                        m_misc(x, y) = m_accColor(x_prev, y_prev);
                        continue;
                    }
                }            
            }
            m_valid(x, y) = false;
            m_misc(x, y) = Float3(0.f);
        }
    }
    std::swap(m_misc, m_accColor);
}

void Denoiser::TemporalAccumulation(const Buffer2D<Float3> &curFilteredColor) {
    int height = m_accColor.m_height;
    int width = m_accColor.m_width;
    int kernelRadius = 3;
#pragma omp parallel for
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            if (m_valid(x, y)) {
                // TODO: Temporal clamp
                Float3 sum = Float3(0.0f), sum_sqr = Float3(0.0f);
                for (int oy = -kernelRadius; oy <= kernelRadius; oy++) {
                    for (int ox = -kernelRadius; ox <= kernelRadius; ox++) {
                        Float3 ncolor = curFilteredColor(x + ox, y + oy);
                        sum += ncolor;
                        sum_sqr += Sqr(ncolor);
                    }                
                }
                Float3 mean = sum / 49.0f;
                Float3 vari = SafeSqrt(sum_sqr / 49.0f - Sqr(mean));
                Float3 color = Clamp(m_accColor(x, y), mean - vari * m_colorBoxK,
                                     mean + vari * m_colorBoxK);
                // TODO: Exponential moving average
                m_misc(x, y) = Lerp(color, curFilteredColor(x, y), m_alpha);            
            } else {
                m_misc(x, y) = curFilteredColor(x, y);
            }
        }
    }
    std::swap(m_misc, m_accColor);
}

Buffer2D<Float3> Denoiser::Filter(const FrameInfo &frameInfo) {
    int height = frameInfo.m_beauty.m_height;
    int width = frameInfo.m_beauty.m_width;
    Buffer2D<Float3> filteredImage = CreateBuffer2D<Float3>(width, height);
    int kernelRadius = 16;
#pragma omp parallel for
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            // TODO: Joint bilateral filter
            filteredImage(x, y) = Float3(0.0f, 0.0f, 0.0f);

            float weight_sum = 0.0f;
            for (int oy = -kernelRadius; oy <= kernelRadius; oy++) {
                for (int ox = -kernelRadius; ox <= kernelRadius; ox++) {
                    if (ox != 0 || oy != 0) {
                        float coor_dist =
                            SafeSqrt(Sqr(ox) + Sqr(oy)) / (2.0f * Sqr(m_sigmaCoord));
                        float color_dist =
                            SqrDistance(frameInfo.m_beauty(x, y),
                                        frameInfo.m_beauty(x + ox, y + oy)) /
                            (2.0f * Sqr(m_sigmaColor));
                        float normal_dist =
                            Sqr(SafeAcos(Dot(frameInfo.m_normal(x, y),
                                             frameInfo.m_normal(x + ox, y + oy)))) /
                            (2.0f * Sqr(m_sigmaNormal));
                        float plane_dist =
                            Sqr(Dot(frameInfo.m_normal(x, y),
                                    (frameInfo.m_position(x + ox, y + oy) -
                                     frameInfo.m_position(x, y)) /
                                        std::max(Distance(frameInfo.m_position(x + ox, y + oy),
                                                 frameInfo.m_position(x, y)), 0.0001f))) /
                            (2.0f * Sqr(m_sigmaPlane));
                        float weight =
                            expf(-coor_dist - color_dist - normal_dist - plane_dist);
                        weight_sum += weight;
                        filteredImage(x, y) +=
                            frameInfo.m_beauty(x + ox, y + oy) * weight;
                    } else {
                        weight_sum += 1.0;
                        filteredImage(x, y) += frameInfo.m_beauty(x, y);
                    }
                }                
            }
            filteredImage(x, y) /= weight_sum;
        }
    }
    return filteredImage;
}

void Denoiser::Init(const FrameInfo &frameInfo, const Buffer2D<Float3> &filteredColor) {
    m_accColor.Copy(filteredColor);
    int height = m_accColor.m_height;
    int width = m_accColor.m_width;
    m_misc = CreateBuffer2D<Float3>(width, height);
    m_valid = CreateBuffer2D<bool>(width, height);
}

void Denoiser::Maintain(const FrameInfo &frameInfo) { m_preFrameInfo = frameInfo; }

Buffer2D<Float3> Denoiser::ProcessFrame(const FrameInfo &frameInfo) {
    // Filter current frame
    Buffer2D<Float3> filteredColor;
    filteredColor = Filter(frameInfo);

    // Reproject previous frame color to current
    if (m_useTemportal) {
        Reprojection(frameInfo);
        TemporalAccumulation(filteredColor);
    } else {
        Init(frameInfo, filteredColor);
    }

    // Maintain
    Maintain(frameInfo);
    if (!m_useTemportal) {
        m_useTemportal = true;
    }
    return m_accColor;
}
