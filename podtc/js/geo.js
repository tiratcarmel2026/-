window.PodGeo = {
  distance(lat1, lon1, lat2, lon2) {
    const R = 6371000, toR = d => d * Math.PI / 180;
    const dLat = toR(lat2 - lat1), dLon = toR(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  },
  /* compass bearing from point 1 to point 2, degrees 0..360 (0 = north) */
  bearing(lat1, lon1, lat2, lon2) {
    const toR = d => d * Math.PI / 180, toD = r => r * 180 / Math.PI;
    const y = Math.sin(toR(lon2 - lon1)) * Math.cos(toR(lat2));
    const x = Math.cos(toR(lat1)) * Math.sin(toR(lat2)) - Math.sin(toR(lat1)) * Math.cos(toR(lat2)) * Math.cos(toR(lon2 - lon1));
    return (toD(Math.atan2(y, x)) + 360) % 360;
  },
  dirName(b) {
    return ['צפונה', 'צפון־מזרחה', 'מזרחה', 'דרום־מזרחה', 'דרומה', 'דרום־מערבה', 'מערבה', 'צפון־מערבה'][Math.round(b / 45) % 8];
  },
  fmt(m) { return m < 1000 ? Math.round(m / 10) * 10 + ' מ׳' : (m / 1000).toFixed(1) + ' ק״מ'; }
};
