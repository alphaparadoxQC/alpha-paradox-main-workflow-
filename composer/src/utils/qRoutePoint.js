/**
 * Mirrors Alpha Paradox's QRoutePoint
 * A data structure representing a point in a route, containing both
 * a physical 2D position (x, y) and a normalized directional vector.
 * Used internally by auto-routing algorithms (AStar, MixedRoute).
 */

export class QRoutePoint {
  /**
   * @param {Array<number>|Object} position - [x, y] or {x, y} coordinate
   * @param {Array<number>|Object} direction - [nx, ny] or {x, y} directional normal vector
   */
  constructor(position = [0, 0], direction = [1, 0]) {
    // Parse position
    if (Array.isArray(position)) {
      this.position = { x: position[0], y: position[1] };
    } else {
      this.position = { x: position.x || 0, y: position.y || 0 };
    }

    // Parse and normalize direction
    let dx = 0, dy = 0;
    if (Array.isArray(direction)) {
      dx = direction[0];
      dy = direction[1];
    } else {
      dx = direction.x || 0;
      dy = direction.y || 0;
    }
    
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      this.direction = { x: dx / len, y: dy / len };
    } else {
      this.direction = { x: 0, y: 0 };
    }
  }

  // Helper method to convert back to raw arrays for linear algebra computation
  getPositionArray() {
    return [this.position.x, this.position.y];
  }

  getDirectionArray() {
    return [this.direction.x, this.direction.y];
  }

  // Clone this point to prevent reference mutation during AStar pathfinding
  clone() {
    return new QRoutePoint(this.getPositionArray(), this.getDirectionArray());
  }
}
