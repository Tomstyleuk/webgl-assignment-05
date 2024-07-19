precision mediump float;

uniform float time;
varying vec4 vColor;

void main() {
  // 時間の経過からサイン波(sin(time))を作る。sin returns 0,1,0,-1,0,1...
  // 絶対値はプラス（正）の値のみを取るから、サイン波の0 〜 +1の範囲で点滅させるようにする
  // y軸の値が0に近いときは色が暗くなり、1に近いときは色が明るくなる
  vec3 rgb = vColor.rgb * abs(sin(time));

  // フラグメントの色
  gl_FragColor = vec4(rgb, vColor.a);
}