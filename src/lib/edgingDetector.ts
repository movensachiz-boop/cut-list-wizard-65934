// Edge Banding Detection and Visualization
// Determines which specific edges of a part need edging based on edging type

export interface EdgeInfo {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

/**
 * Parses edging type string and returns which edges need edging
 * @param edgingType - e.g., "1L", "2S", "1L 1S", "AR", "All Round", "None"
 * @param isRotated - whether the part was rotated 90°
 * @returns Object indicating which edges (top, bottom, left, right) need edging
 */
export function detectEdgesNeedingBanding(
  edgingType: string | undefined,
  isRotated: boolean = false
): EdgeInfo {
  const edges: EdgeInfo = { top: false, bottom: false, left: false, right: false };
  
  if (!edgingType || edgingType === 'None') {
    return edges;
  }

  const type = edgingType.toUpperCase().trim();

  // All Round variants
  if (type.includes('AR') || type.includes('ALL') || type === 'ALLROUND') {
    return { top: true, bottom: true, left: true, right: true };
  }

  // Parse format like "1L 2S", "1L_2S", "1L-2S", or "2 Long 1 Short"
  const longMatch = type.match(/(\d+)\s*[_\-\s]*L/);
  const shortMatch = type.match(/(\d+)\s*[_\-\s]*S/);

  const numLong = longMatch ? parseInt(longMatch[1]) : 0;
  const numShort = shortMatch ? parseInt(shortMatch[1]) : 0;

  // Long edges are left/right, short edges are top/bottom
  // (unless rotated, then they swap)
  
  if (!isRotated) {
    // Normal orientation: Long = horizontal (left/right), Short = vertical (top/bottom)
    if (numLong === 1) {
      edges.left = true;
    } else if (numLong === 2) {
      edges.left = true;
      edges.right = true;
    }

    if (numShort === 1) {
      edges.top = true;
    } else if (numShort === 2) {
      edges.top = true;
      edges.bottom = true;
    }
  } else {
    // Rotated 90°: Long becomes vertical (top/bottom), Short becomes horizontal (left/right)
    if (numLong === 1) {
      edges.top = true;
    } else if (numLong === 2) {
      edges.top = true;
      edges.bottom = true;
    }

    if (numShort === 1) {
      edges.left = true;
    } else if (numShort === 2) {
      edges.left = true;
      edges.right = true;
    }
  }

  return edges;
}

/**
 * Calculates the total length of edging needed for a part
 */
export function calculatePartEdgingLength(
  width: number,
  height: number,
  edges: EdgeInfo
): number {
  let length = 0;
  
  if (edges.left) length += height;
  if (edges.right) length += height;
  if (edges.top) length += width;
  if (edges.bottom) length += width;
  
  return length;
}

/**
 * Gets a human-readable description of which edges are banded
 */
export function getEdgingDescription(edges: EdgeInfo): string {
  const edged: string[] = [];
  
  if (edges.top) edged.push('Top');
  if (edges.bottom) edged.push('Bottom');
  if (edges.left) edged.push('Left');
  if (edges.right) edged.push('Right');
  
  if (edged.length === 0) return 'No edging';
  if (edged.length === 4) return 'All edges';
  
  return edged.join(' + ');
}
