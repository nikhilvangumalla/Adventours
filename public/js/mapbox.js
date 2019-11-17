export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibmlraGlsLXZhbmd1bWFsbGEiLCJhIjoiY2sycWRxaGM0MDNscjNsbGxpYnZqenQ4NSJ9.Fqz4aizVo2AykGbxDFynzA';

  let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/nikhil-vangumalla/ck2qdydsz1qak1crovmg17cqe',
    scrollZoom: false,
    doubleClickZoom: false
    // dragPan: true
  });
  // map.scrollZoom.disable()
  // adding zoom in and out buttons
  map.addControl(new mapboxgl.NavigationControl());

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
