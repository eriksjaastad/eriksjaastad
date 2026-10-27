// What every walkable room page shares (/gallery/, /flashback/): the page's pointer, wheel and key events go to
// walker(), a tap on a piece walks you to it and shows its caption in #caption, and the frame loop moves the camera.
import * as THREE from "three";

// pieces: meshes or groups whose userData is { name, note, stand, look }; a hit on a child counts as its piece.
// onFrame(now) runs before each render for the page's own animation. onTap(hit) runs when you tap a piece you are
// standing at right now (however you got there), with the mesh you hit; returning true means the page used the tap.
export function walkThrough({ renderer, scene, camera, me, pieces, onFrame = () => {}, onTap = () => false }) {
  const el = renderer.domElement;
  el.addEventListener("contextmenu", e => e.preventDefault());
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), cap = document.getElementById("caption");
  let focused = null;  // the piece whose caption shows; it hides once you walk away from it
  function show(p) { focused = p; document.body.classList.toggle("focused", !!p); if (p) { cap.querySelector("b").textContent = p.name; cap.querySelector("span").textContent = p.note; } }
  function pick(x, y) {
    ray.setFromCamera(ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1), camera);
    const hit = ray.intersectObjects(pieces, true)[0]?.object;
    let o = hit; while (o && !o.userData.stand) o = o.parent;
    return { hit, piece: o };
  }
  el.addEventListener("pointerdown", e => {
    el.setPointerCapture(e.pointerId);
    me.pointerDown(e.pointerId, e.clientX, e.clientY, e.button === 2 || e.shiftKey, e.isPrimary && e.button === 0);
  });
  el.addEventListener("pointermove", e => {
    const all = e.getCoalescedEvents?.();  // every sample since the last event; Safari has none
    for (const c of all?.length ? all : [e]) me.pointerMove(e.pointerId, c.clientX, c.clientY);
  });
  el.addEventListener("pointerup", e => {
    if (!me.pointerUp(e.pointerId, e.clientX, e.clientY)) return;
    const { hit, piece } = pick(e.clientX, e.clientY);
    if (!piece) return;
    if (!(me.standingAt(piece.userData.stand) && onTap(hit))) me.goTo(piece.userData.stand, piece.userData.look);
    show(piece.userData);
  });
  el.addEventListener("pointercancel", e => me.pointerCancel(e.pointerId));
  el.addEventListener("wheel", e => { e.preventDefault(); me.wheel(e.deltaY, e.deltaMode, innerHeight); }, { passive: false });
  addEventListener("keydown", e => me.keyDown(e));
  addEventListener("keyup", e => me.keyUp(e.key));
  addEventListener("blur", () => me.blur());

  renderer.setAnimationLoop(now => {
    const pose = me.frame(now);
    camera.position.set(pose.x, pose.y, pose.z);
    camera.rotation.set(pose.pitch, pose.yaw, pose.roll);
    if (focused && !pose.flying && Math.hypot(pose.x - focused.stand.x, pose.z - focused.stand.z) > 1.5) show(null);
    onFrame(now);
    renderer.render(scene, camera);
  });
}
