function distanceBetween(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // radius of Earth in meters
    const phi1 = lat1 * Math.PI / 180; // convert lat1 to radians
    const phi2 = lat2 * Math.PI / 180; // convert lat2 to radians
    const deltaPhi = (lat2 - lat1) * Math.PI / 180; // difference in latitudes, in radians
    const deltaLambda = (lon2 - lon1) * Math.PI / 180; // difference in longitudes, in radians
  
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    const d = R * c; // distance in meters
    return d;
  }
  
export {distanceBetween};