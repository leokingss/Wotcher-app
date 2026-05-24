/**
 * MediaPipe FaceMesh landmark index polygons we use for beauty effects.
 *
 * These are ordered traversal paths (closed polygons) rather than the raw
 * connection pairs MediaPipe exposes — easier to clip against in Canvas2D.
 *
 * Source: MediaPipe FaceMesh canonical model.
 */

export const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
  378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
  162, 21, 54, 103, 67, 109,
];

export const LEFT_EYE = [
  33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7,
];

export const RIGHT_EYE = [
  362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382,
];

/** Inner-lip polygon (mouth opening) — used as a teeth-whiten clip. */
export const MOUTH_INNER = [
  78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87,
  178, 88, 95,
];

/** Cheek + jaw soft contour points (left/right). Used to darken slightly. */
export const LEFT_CHEEK = [123, 147, 187, 207, 216];
export const RIGHT_CHEEK = [352, 376, 411, 427, 436];
