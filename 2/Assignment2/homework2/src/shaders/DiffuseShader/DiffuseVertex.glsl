uniform mat3 aPrecomputeLR;
uniform mat3 aPrecomputeLG;
uniform mat3 aPrecomputeLB;
attribute mat3 aPrecomputeLT;

attribute vec3 aVertexPosition;
attribute vec3 aNormalPosition;
attribute vec2 aTextureCoord;

uniform mat4 uRotateMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTextureCoord;
varying highp vec3 vFragPos;
varying highp vec3 vNormal;
varying highp vec3 vColor;

const float kd = 2.0;
const float pi = 3.14159;

void main(void) {

  vFragPos = (uModelMatrix * vec4(aVertexPosition, 1.0)).xyz;
  vNormal = (uModelMatrix * vec4(aNormalPosition, 0.0)).xyz;
  vColor = vec3(
      dot(matrixCompMult(aPrecomputeLR, aPrecomputeLT) * vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0)),
      dot(matrixCompMult(aPrecomputeLG, aPrecomputeLT) * vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0)),
      dot(matrixCompMult(aPrecomputeLB, aPrecomputeLT) * vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0))
  ) * kd / pi;

  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix *
                uRotateMatrix * 
                vec4(aVertexPosition, 1.0);

  vTextureCoord = aTextureCoord;
}