class PhongMaterial extends Material {

    constructor(color, specular, light, light2, translate, scale, vertexShader, fragmentShader) {
        let lightMVP = light.CalcLightMVP(translate, scale);
        let lightIntensity = light.mat.GetIntensity();
        let lightMVP2 = light2.CalcLightMVP(translate, scale);
        let lightIntensity2 = light2.mat.GetIntensity();

        super({
            // Phong
            'uSampler': { type: 'texture', value: color },
            'uKs': { type: '3fv', value: specular },
            'uLightIntensity': { type: '3fv', value: lightIntensity },
            // Shadow
            'uShadowMap': { type: 'texture', value: light.fbo },
            'uLightMVP': { type: 'matrix4fv', value: lightMVP },
            // Shadow2
            'uShadowMap2': { type: 'texture', value: light2.fbo },
            'uLightMVP2': { type: 'matrix4fv', value: lightMVP2 },

        }, [], vertexShader, fragmentShader);
        this.light = light;
        this.light2 = light2;
    }

    setUniformsParams(pname, nvalue){
        if(pname in this.uniforms){
            this.uniforms[pname].value = nvalue;
        }
    }
}

async function buildPhongMaterial(color, specular, light, light2, translate, scale, vertexPath, fragmentPath) {


    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new PhongMaterial(color, specular, light, light2, translate, scale, vertexShader, fragmentShader);

}