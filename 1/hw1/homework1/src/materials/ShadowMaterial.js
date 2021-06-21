class ShadowMaterial extends Material {

    constructor(light, translate, scale, vertexShader, fragmentShader) {
        let lightMVP = light.CalcLightMVP(translate, scale);

        super({
            'uLightMVP': { type: 'matrix4fv', value: lightMVP }
        }, [], vertexShader, fragmentShader, light.fbo);
        this.light = light;
    }

    setUniformsParams(pname, nvalue){
        if(pname in this.uniforms){
            this.uniforms[pname].value = nvalue;
        }
    }
}

async function buildShadowMaterial(light, translate, scale, vertexPath, fragmentPath) {


    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new ShadowMaterial(light, translate, scale, vertexShader, fragmentShader);

}