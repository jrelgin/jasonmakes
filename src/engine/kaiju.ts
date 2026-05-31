import { EntityConfig, Vec2 } from "./types";

/**
 * Create a Godzilla-like kaiju silhouette as a Path2D
 * The path is centered at (0,0) with the base at y=0
 * and the figure extending upward (negative y)
 */
function createGodzillaSilhouette(): Path2D {
  const p = new Path2D();

  // Body - main torso rising from water
  p.moveTo(-35, 0); // water line left

  // Left side of body
  p.bezierCurveTo(-38, -15, -40, -30, -36, -50); // lower torso
  p.bezierCurveTo(-33, -65, -28, -80, -24, -95); // upper torso
  p.bezierCurveTo(-22, -105, -20, -110, -18, -118); // neck base

  // Left side of neck
  p.bezierCurveTo(-16, -125, -14, -135, -13, -142); // neck

  // Head
  p.bezierCurveTo(-14, -148, -16, -152, -17, -155); // back of head
  p.bezierCurveTo(-17, -160, -15, -165, -12, -168); // top of head
  p.bezierCurveTo(-8, -171, -3, -172, 2, -171); // crown
  p.bezierCurveTo(7, -170, 11, -167, 13, -163); // forehead

  // Jaw / snout
  p.bezierCurveTo(16, -158, 20, -155, 22, -152); // upper jaw
  p.bezierCurveTo(24, -150, 25, -148, 23, -146); // jaw tip
  p.bezierCurveTo(20, -144, 17, -143, 14, -143); // lower jaw
  p.bezierCurveTo(12, -142, 11, -140, 12, -137); // throat

  // Right side of neck
  p.bezierCurveTo(13, -130, 14, -122, 16, -115); // neck right

  // Right arm/shoulder
  p.bezierCurveTo(20, -105, 26, -100, 30, -92); // shoulder
  p.bezierCurveTo(33, -86, 34, -78, 28, -74); // arm out
  p.bezierCurveTo(24, -72, 22, -70, 24, -66); // arm joint
  p.bezierCurveTo(26, -62, 28, -58, 26, -52); // forearm

  // Right side of body
  p.bezierCurveTo(30, -40, 34, -28, 36, -15); // lower torso right
  p.bezierCurveTo(38, -8, 38, -3, 35, 0); // water line right

  // Back dorsal spines (drawn along the back)
  // We'll add these as separate shapes

  p.closePath();

  return p;
}

/**
 * Create dorsal spine shapes for the kaiju
 */
function createDorsalSpines(): Path2D {
  const p = new Path2D();

  // Spine 1 - largest, on upper back
  p.moveTo(-24, -95);
  p.lineTo(-30, -115);
  p.lineTo(-28, -112);
  p.lineTo(-34, -128);
  p.lineTo(-29, -120);
  p.lineTo(-32, -135);
  p.lineTo(-26, -118);
  p.lineTo(-22, -105);

  // Spine 2 - mid back
  p.moveTo(-30, -72);
  p.lineTo(-36, -88);
  p.lineTo(-33, -84);
  p.lineTo(-38, -95);
  p.lineTo(-32, -82);
  p.lineTo(-28, -68);

  // Spine 3 - lower back
  p.moveTo(-34, -48);
  p.lineTo(-40, -62);
  p.lineTo(-37, -58);
  p.lineTo(-42, -68);
  p.lineTo(-36, -55);
  p.lineTo(-32, -42);

  return p;
}

/**
 * Create a second kaiju variant - more serpentine/sea creature
 */
function createSerpentSilhouette(): Path2D {
  const p = new Path2D();

  // Serpentine sea creature - multiple humps visible above water
  // Main visible hump
  p.moveTo(-50, 0);
  p.bezierCurveTo(-48, -10, -40, -30, -25, -45);
  p.bezierCurveTo(-15, -55, -5, -58, 5, -55);
  p.bezierCurveTo(15, -50, 22, -38, 25, -25);
  p.bezierCurveTo(28, -15, 28, -5, 30, 0);

  // Second hump (behind/further)
  p.moveTo(35, 0);
  p.bezierCurveTo(36, -5, 40, -18, 48, -25);
  p.bezierCurveTo(54, -30, 60, -28, 63, -22);
  p.bezierCurveTo(66, -15, 66, -8, 65, 0);

  // Long neck/head rising from water
  p.moveTo(-55, 0);
  p.bezierCurveTo(-58, -8, -65, -25, -68, -50);
  p.bezierCurveTo(-70, -65, -68, -80, -62, -90);
  p.bezierCurveTo(-58, -96, -52, -98, -48, -95);
  p.bezierCurveTo(-44, -92, -42, -85, -43, -78);
  p.bezierCurveTo(-45, -65, -48, -45, -50, -25);
  p.bezierCurveTo(-50, -15, -48, -5, -45, 0);

  p.closePath();

  return p;
}

export type KaijuType = "godzilla" | "serpent";

/**
 * Create a kaiju entity configuration
 */
export function createKaiju(
  id: string,
  kaijuType: KaijuType,
  position: Vec2,
  scale: number,
  depth: number,
  speed: Vec2 = { x: 0, y: 0 },
): EntityConfig {
  let silhouettePath: Path2D;

  if (kaijuType === "godzilla") {
    silhouettePath = createGodzillaSilhouette();
  } else {
    silhouettePath = createSerpentSilhouette();
  }

  return {
    id,
    type: "kaiju",
    position,
    scale,
    depth,
    speed,
    silhouettePath,
  };
}

/**
 * Render a kaiju entity
 */
export function renderKaiju(
  ctx: CanvasRenderingContext2D,
  entity: EntityConfig,
  width: number,
  height: number,
  palette: string,
) {
  if (!entity.silhouettePath) return;

  const ex = entity.position.x * width;
  const ey = entity.position.y * height;

  ctx.save();
  ctx.translate(ex, ey);
  ctx.scale(entity.scale, entity.scale);

  ctx.fillStyle = palette;
  ctx.fill(entity.silhouettePath);

  // Draw dorsal spines for godzilla type
  if (entity.id.includes("godzilla") || entity.id.includes("kaiju-0")) {
    const spines = createDorsalSpines();
    ctx.fillStyle = palette;
    ctx.fill(spines);
  }

  ctx.restore();
}

/**
 * Update entity position based on speed and time
 */
export function updateEntity(entity: EntityConfig, deltaTime: number): void {
  entity.position.x += entity.speed.x * deltaTime;
  entity.position.y += entity.speed.y * deltaTime;

  // Wrap around horizontally
  if (entity.position.x > 1.3) entity.position.x = -0.3;
  if (entity.position.x < -0.3) entity.position.x = 1.3;
}
