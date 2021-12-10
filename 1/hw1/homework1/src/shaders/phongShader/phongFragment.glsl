#ifdef GL_ES
precision mediump float;
#endif

#define ENABLE_LIGHT2

// Phong related variables
uniform sampler2D uSampler;
uniform vec3 uKd;
uniform vec3 uKs;
uniform vec3 uLightPos;
uniform vec3 uCameraPos;
uniform vec3 uLightIntensity;

varying highp vec2 vTextureCoord;
varying highp vec3 vFragPos;
varying highp vec3 vNormal;

// Shadow map related variables
#define NUM_SAMPLES 100
#define BLOCKER_SEARCH_NUM_SAMPLES NUM_SAMPLES
#define PCF_NUM_SAMPLES NUM_SAMPLES
#define NUM_RINGS 10

#define EPS 1e-3
#define PI 3.141592653589793
#define PI2 6.283185307179586

#define LSIZE 10.0
#define LWIDTH (LSIZE/240.0)
#define BLOKER_SIZE (LWIDTH/2.0)
#define MAX_PENUMBRA 0.5

uniform sampler2D uShadowMap;
uniform sampler2D uShadowMap2;

varying vec4 vPositionFromLight;
varying vec4 vPositionFromLight2;

highp float rand_1to1(highp float x ) { 
  // -1 -1
  return fract(sin(x)*10000.0);
}

highp float rand_2to1(vec2 uv ) { 
  // 0 - 1
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c);
}

float unpack(vec4 rgbaDepth) {
    const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
    return dot(rgbaDepth, bitShift);
}

vec2 poissonDisk[NUM_SAMPLES];

void poissonDiskSamples( const in vec2 randomSeed ) {

  float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );
  float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );

  float angle = rand_2to1( randomSeed ) * PI2;
  float radius = INV_NUM_SAMPLES;
  float radiusStep = radius;

  for( int i = 0; i < NUM_SAMPLES; i ++ ) {
    poissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );
    radius += radiusStep;
    angle += ANGLE_STEP;
  }
}

void uniformDiskSamples( const in vec2 randomSeed ) {

  float randNum = rand_2to1(randomSeed);
  float sampleX = rand_1to1( randNum ) ;
  float sampleY = rand_1to1( sampleX ) ;

  float angle = sampleX * PI2;
  float radius = sqrt(sampleY);

  for( int i = 0; i < NUM_SAMPLES; i ++ ) {
    poissonDisk[i] = vec2( radius * cos(angle) , radius * sin(angle)  );

    sampleX = rand_1to1( sampleY ) ;
    sampleY = rand_1to1( sampleX ) ;

    angle = sampleX * PI2;
    radius = sqrt(sampleY);
  }
}

float findBlocker( sampler2D shadowMap,  vec2 uv, float zReceiver ) {
  float count = 0.0, depth_sum = 0.0, depthOnShadowMap, is_block;
  vec2 nCoords;
  for( int i = 0; i < BLOCKER_SEARCH_NUM_SAMPLES; i++){
    nCoords = uv + BLOKER_SIZE * poissonDisk[i];

    depthOnShadowMap = unpack(texture2D(shadowMap, nCoords));
    if (abs(depthOnShadowMap) < 1e-5) depthOnShadowMap = 1.0;
    
    is_block = step(depthOnShadowMap, zReceiver - EPS);
    count += is_block;
    depth_sum += is_block * depthOnShadowMap;
  }
  if(count < 0.1)
    return zReceiver;
  return depth_sum / count;
}

float PCF(sampler2D shadowMap, vec4 coords, float filterSize) {
  float _sum = 0.0, depthOnShadowMap, depth, vis;
  vec4 nCoords;
  for( int i = 0; i < PCF_NUM_SAMPLES; i++){
    nCoords = vec4(coords.xy + filterSize * poissonDisk[i], coords.zw);

    depthOnShadowMap = unpack(texture2D(shadowMap, nCoords.xy));
    depth = nCoords.z;
    
    vis = step(depth - EPS, depthOnShadowMap);
    _sum += vis;
  }
  return _sum / float(PCF_NUM_SAMPLES);
}

float PCSS(sampler2D shadowMap, vec4 coords){

  float zReceiver = coords.z;
  // STEP 1: avgblocker depth
  float avgblockerdep = findBlocker(shadowMap, coords.xy, zReceiver);
  if(avgblockerdep <= EPS)// No Blocker
    return 1.0;

  // STEP 2: penumbra size
  float dBlocker = avgblockerdep, dReceiver = zReceiver - avgblockerdep;
  float wPenumbra = min(LWIDTH * dReceiver / dBlocker, MAX_PENUMBRA);

  // STEP 3: filtering
  float _sum = 0.0, depthOnShadowMap, vis;
  vec2 nCoords;
  for( int i = 0; i < NUM_SAMPLES; i++){
    nCoords = coords.xy + wPenumbra * poissonDisk[i];

    depthOnShadowMap = unpack(texture2D(shadowMap, nCoords));
    if (abs(depthOnShadowMap) < 1e-5) depthOnShadowMap = 1.0;

    vis = step(zReceiver - EPS, depthOnShadowMap);
    _sum += vis;
  }
  
  return _sum / float(NUM_SAMPLES);
}


float useShadowMap(sampler2D shadowMap, vec4 shadowCoord){
  float depthOnShadowMap = unpack(texture2D(shadowMap, shadowCoord.xy));
  if (abs(depthOnShadowMap) < 1e-5) depthOnShadowMap = 1.0;
  float depth = shadowCoord.z;
  
  float vis = step(depth - EPS, depthOnShadowMap);
  return vis;
}

vec3 blinnPhong() {
  vec3 color = texture2D(uSampler, vTextureCoord).rgb;
  color = pow(color, vec3(2.2));

  vec3 ambient = 0.05 * color;

  vec3 lightDir = normalize(uLightPos);
  vec3 normal = normalize(vNormal);
  float diff = max(dot(lightDir, normal), 0.0);
  vec3 light_atten_coff =
      uLightIntensity / pow(length(uLightPos - vFragPos), 2.0);
  vec3 diffuse = diff * light_atten_coff * color;

  vec3 viewDir = normalize(uCameraPos - vFragPos);
  vec3 halfDir = normalize((lightDir + viewDir));
  float spec = pow(max(dot(halfDir, normal), 0.0), 32.0);
  vec3 specular = uKs * light_atten_coff * spec;

  vec3 radiance = (ambient + diffuse + specular);
  vec3 phongColor = pow(radiance, vec3(1.0 / 2.2));
  return phongColor;
}

void main(void) {
  poissonDiskSamples(vTextureCoord);
  //uniformDiskSamples(vTextureCoord);

  float visibility = 1.0, visibility2 = 1.0;
  vec3 shadowCoordNDC = (vPositionFromLight.xyz / vPositionFromLight.w + 1.0) / 2.0;
  //visibility = useShadowMap(uShadowMap, vec4(shadowCoordNDC, 1.0));
  //visibility = PCF(uShadowMap, vec4(shadowCoordNDC, 1.0), 0.01);
  visibility = PCSS(uShadowMap, vec4(shadowCoordNDC, 1.0));

#if defined(ENABLE_LIGHT2)
  vec3 shadowCoordNDC2 = (vPositionFromLight2.xyz / vPositionFromLight2.w + 1.0) / 2.0;
  //visibility2 = useShadowMap(uShadowMap2, vec4(shadowCoordNDC2, 1.0));
  //visibility2 = PCF(uShadowMap2, vec4(shadowCoordNDC2, 1.0), 0.01);
  visibility2 = PCSS(uShadowMap2, vec4(shadowCoordNDC2, 1.0));

  visibility = (visibility + visibility2) / 2.0;
#endif

  vec3 phongColor = blinnPhong();

  //gl_FragColor = vec4(visibility, visibility, visibility, 1.0);
  gl_FragColor = vec4(phongColor * visibility, 1.0);
  //gl_FragColor = vec4(phongColor, 1.0);
}