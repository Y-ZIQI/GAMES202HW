class DiffuseMaterial extends Material {

    constructor(vertexShader, fragmentShader) {
        let precomputeL_mat = getMat3ValueFromRGB(precomputeL[guiParams.envmapId]);

        super({
            'aPrecomputeLR': { type: 'matrix3fv', value: precomputeL_mat[0]},
            'aPrecomputeLG': { type: 'matrix3fv', value: precomputeL_mat[1]},
            'aPrecomputeLB': { type: 'matrix3fv', value: precomputeL_mat[2]},
            'uRotateMatrix': { type: 'matrix4fv', value: rm}
        }, [
            'aPrecomputeLT'
        ], vertexShader, fragmentShader, null);
        this.mapid = guiParams.envmapId;
    }

    setPrecomputeL(pL){
        let precomputeL_mat = getMat3ValueFromRGB(pL);
        this.setUniform('aPrecomputeLR', precomputeL_mat[0]);
        this.setUniform('aPrecomputeLG', precomputeL_mat[1]);
        this.setUniform('aPrecomputeLB', precomputeL_mat[2]);
    }

    checkEnvmap(){
        if(this.mapid == guiParams.envmapId)
            return;
        let precomputeL_mat = getMat3ValueFromRGB(precomputeL[guiParams.envmapId]);
        this.setUniform('aPrecomputeLR', precomputeL_mat[0]);
        this.setUniform('aPrecomputeLG', precomputeL_mat[1]);
        this.setUniform('aPrecomputeLB', precomputeL_mat[2]);
        this.mapid = guiParams.envmapId;
    }

    setUniform(name, value){
        if(name in this.uniforms)
            this.uniforms[name].value = value;
    }
}

async function buildDiffuseMaterial(vertexPath, fragmentPath) {


    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new DiffuseMaterial(vertexShader, fragmentShader);

}