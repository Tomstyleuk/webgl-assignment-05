precision mediump float;
attribute vec3 position;
attribute vec4 color;
uniform float time;
varying vec4 vColor;

void main() {
  // 時間 (time) に基づいて角度 (angle) を計算。timeが増えると、angleも増加
  float angle = time * 0.8;
  
  /* 2D空間での回転を表す回転行列
  * cos(angle)  -  回転角度の余弦　x座標
  * -sin(angle) -  回転角度の正弦の負　y座標
  * sin(angle)  -  回転角度の正弦　y座標
  * cos(angle)  -  回転角度の余弦　x座標
  */
  mat2 rotation = mat2(cos(angle), - sin(angle), sin(angle), cos(angle));
  
  // 元の位置 (position.xy) に回転行列を適用して、新しい位置 (rotatedPosition) を計算
  vec2 rotatedPosition = rotation * position.xy;
  
  gl_Position = vec4(rotatedPosition, position.z, 1.0);
  vColor = color;
}