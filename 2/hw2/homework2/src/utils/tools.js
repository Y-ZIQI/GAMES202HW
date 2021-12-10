function getRotationPrecomputeL(precompute_L, rotationMatrix){
	let l1 = [precompute_L[1], precompute_L[2], precompute_L[3]];
	let l2 = [precompute_L[4], precompute_L[5], precompute_L[6], precompute_L[7], precompute_L[8]];
	let M1 = computeSquareMatrix_3by3(rotationMatrix), M2 = computeSquareMatrix_5by5(rotationMatrix);
	let nl1 = math.multiply(M1, l1);
	let nl2 = math.multiply(M2, l2);
	let result = [precompute_L[0], nl1[0], nl1[1], nl1[2], nl2[0], nl2[1], nl2[2], nl2[3], nl2[4]];

	return result;
}

function computeSquareMatrix_3by3(rotationMatrix){ // 计算方阵SA(-1) 3*3 
	
	// 1、pick ni - {ni}
	let n1 = [1, 0, 0, 0]; let n2 = [0, 0, 1, 0]; let n3 = [0, 1, 0, 0];

	// 2、{P(ni)} - A  A_inverse
	let _pn1 = SHEval(n1[0], n1[1], n1[2], 3); let pn1 = [_pn1[1], _pn1[2], _pn1[3]];
	let _pn2 = SHEval(n2[0], n2[1], n2[2], 3); let pn2 = [_pn2[1], _pn2[2], _pn2[3]];
	let _pn3 = SHEval(n3[0], n3[1], n3[2], 3); let pn3 = [_pn3[1], _pn3[2], _pn3[3]];
	let A = [pn1, pn2, pn3];
	let A_ = math.inv(A);
	
	// 3、用 R 旋转 ni - {R(ni)}
	let rm = mat4Matrix2mathMatrix(rotationMatrix);
	//rm = math.transpose(rm);
	let rn_mat = math.multiply([n1, n2, n3], rm);
	let rn = rn_mat._data;

	// 4、R(ni) SH投影 - S
	let _prn1 = SHEval(rn[0][0], rn[0][1], rn[0][2], 3); let prn1 = [_prn1[1], _prn1[2], _prn1[3]];
	let _prn2 = SHEval(rn[1][0], rn[1][1], rn[1][2], 3); let prn2 = [_prn2[1], _prn2[2], _prn2[3]];
	let _prn3 = SHEval(rn[2][0], rn[2][1], rn[2][2], 3); let prn3 = [_prn3[1], _prn3[2], _prn3[3]];
	let S = [prn1, prn2, prn3];

	// 5、S*A_inverse
	let M = math.multiply(S, A_);
	return M;

}

function computeSquareMatrix_5by5(rotationMatrix){ // 计算方阵SA(-1) 5*5
	
	// 1、pick ni - {ni}
	let k = 1 / math.sqrt(2);
	let n1 = [1, 0, 0, 0]; let n2 = [0, 0, 1, 0]; let n3 = [k, k, 0, 0]; 
	let n4 = [k, 0, k, 0]; let n5 = [0, k, k, 0];

	// 2、{P(ni)} - A  A_inverse
	let _pn1 = SHEval(n1[0], n1[1], n1[2], 3); let pn1 = [_pn1[4], _pn1[5], _pn1[6], _pn1[7], _pn1[8]];
	let _pn2 = SHEval(n2[0], n2[1], n2[2], 3); let pn2 = [_pn2[4], _pn2[5], _pn2[6], _pn2[7], _pn2[8]];
	let _pn3 = SHEval(n3[0], n3[1], n3[2], 3); let pn3 = [_pn3[4], _pn3[5], _pn3[6], _pn3[7], _pn3[8]];
	let _pn4 = SHEval(n4[0], n4[1], n4[2], 3); let pn4 = [_pn4[4], _pn4[5], _pn4[6], _pn4[7], _pn4[8]];
	let _pn5 = SHEval(n5[0], n5[1], n5[2], 3); let pn5 = [_pn5[4], _pn5[5], _pn5[6], _pn5[7], _pn5[8]];
	let A = [pn1, pn2, pn3, pn4, pn5];
	let A_ = math.inv(A);
	
	// 3、用 R 旋转 ni - {R(ni)}
	let rm = mat4Matrix2mathMatrix(rotationMatrix);
	//rm = math.transpose(rm);
	let rn_mat = math.multiply([n1, n2, n3, n4, n5], rm);
	let rn = rn_mat._data;

	// 4、R(ni) SH投影 - S
	let _prn1 = SHEval(rn[0][0], rn[0][1], rn[0][2], 3); let prn1 = [_prn1[4], _prn1[5], _prn1[6], _prn1[7], _prn1[8]];
	let _prn2 = SHEval(rn[1][0], rn[1][1], rn[1][2], 3); let prn2 = [_prn2[4], _prn2[5], _prn2[6], _prn2[7], _prn2[8]];
	let _prn3 = SHEval(rn[2][0], rn[2][1], rn[2][2], 3); let prn3 = [_prn3[4], _prn3[5], _prn3[6], _prn3[7], _prn3[8]];
	let _prn4 = SHEval(rn[3][0], rn[3][1], rn[3][2], 3); let prn4 = [_prn4[4], _prn4[5], _prn4[6], _prn4[7], _prn4[8]];
	let _prn5 = SHEval(rn[4][0], rn[4][1], rn[4][2], 3); let prn5 = [_prn5[4], _prn5[5], _prn5[6], _prn5[7], _prn5[8]];
	let S = [prn1, prn2, prn3, prn4, prn5];

	// 5、S*A_inverse
	let M = math.multiply(S, A_);
	return M;

}

function mat4Matrix2mathMatrix(rotationMatrix){

	let mathMatrix = [];
	for(let i = 0; i < 4; i++){
		let r = [];
		for(let j = 0; j < 4; j++){
			r.push(rotationMatrix[i*4+j]);
		}
		mathMatrix.push(r);
	}
	return math.matrix(mathMatrix)

}

function getMat3ValueFromRGB(precomputeL){

    let colorMat3 = [];
    for(var i = 0; i<3; i++){
        colorMat3[i] = mat3.fromValues( precomputeL[0][i], precomputeL[1][i], precomputeL[2][i],
										precomputeL[3][i], precomputeL[4][i], precomputeL[5][i],
										precomputeL[6][i], precomputeL[7][i], precomputeL[8][i] ); 
	}
    return colorMat3;
}